// src/data/roomAvailability.js
// ─────────────────────────────────────────────────────────────────────────────
// All Firestore read/write logic for room availability and bookings.
// This is the single source of truth for live booking state.
//
// Firestore collections used:
//
//   roomAvailability/{homestayId_roomId}
//     Fields: roomId, homestayId, booked (bool), checkOutDate (ISO string),
//             bookedAt (ISO string), bookingId (string)
//     → One document per room. Created on first booking, updated on each booking.
//
//   bookings/{bookingId}
//     Fields: homestayId, roomIds (array), checkIn, checkOut, guests (int),
//             nights (int), totalAmount, platformFee, status ("confirmed"|"cancelled"),
//             createdAt (ISO string)
//     → One document per booking. Phase 4 admin dashboard reads this collection.
//
// CONFLICT RULE:
//   standard ↔ premium-2bhk are mutually exclusive.
//   If either is booked, the other is also marked unavailable in the returned Map.
//   Defined in ROOM_CONFLICTS below — add pairs here to extend.
//
// PHASE 4 ADMIN:
//   Admin dashboard will import { getAllBookings, cancelBooking, restoreRoom }
//   from this file. The availability logic is the same — admin just gets
//   extra write access to flip status and trigger restores manually.
//
// AUTO-RESTORE:
//   On every HomestayPage load, checkAndRestoreExpiredRooms() runs.
//   It finds any room where booked=true AND checkOutDate is today or past,
//   and flips booked back to false at 00:00 of checkout date.
//   This is the client-side fallback. Phase 4: add a Firebase Scheduled
//   Function (Blaze plan) to run this server-side at midnight every day.
// ─────────────────────────────────────────────────────────────────────────────

import {
  doc, getDoc, getDocs, setDoc, updateDoc,
  collection, query, where, Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"

const AVAILABILITY_COL = "roomAvailability"
const BOOKINGS_COL     = "bookings"

// ── Conflict map ─────────────────────────────────────────────
// If a room in the key is booked, all rooms in its value array
// are also treated as unavailable. Bidirectional by design.
const ROOM_CONFLICTS = {
  "standard":     ["premium-2bhk"],
  "premium-2bhk": ["standard"],
}

// ── Document ID helper ───────────────────────────────────────
function availDocId(homestayId, roomId) {
  return `${homestayId}_${roomId}`
}

// ── Fetch live availability for all rooms in a homestay ──────
// Returns a Map<roomId, { booked, checkOutDate, bookingId, blockedByConflict }>
// If a room has no Firestore doc yet, it defaults to { booked: false }.
// After fetching, conflict logic runs: if standard is booked, premium-2bhk
// is also marked booked (blockedByConflict: true), and vice versa.
export async function fetchRoomAvailability(homestayId, roomIds) {
  const result = new Map()
  // Default all to available
  roomIds.forEach(id => result.set(id, { booked: false, checkOutDate: null, bookingId: null, blockedByConflict: false }))

  const fetches = roomIds.map(roomId =>
    getDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)))
  )
  const docs = await Promise.all(fetches)
  docs.forEach(snap => {
    if (snap.exists()) {
      const d = snap.data()
      result.set(d.roomId, {
        booked:           d.booked,
        checkOutDate:     d.checkOutDate || null,
        bookingId:        d.bookingId || null,
        blockedByConflict: false,
      })
    }
  })

  // ── Apply conflict propagation ───────────────────────────
  // For every room that is booked, mark its conflict partners unavailable too.
  result.forEach((status, roomId) => {
    if (!status.booked) return
    const conflicts = ROOM_CONFLICTS[roomId] || []
    conflicts.forEach(conflictId => {
      if (result.has(conflictId) && !result.get(conflictId).booked) {
        result.set(conflictId, {
          ...result.get(conflictId),
          booked:           true,
          blockedByConflict: true,   // flag so UI can show "unavailable" vs "booked"
          checkOutDate:     status.checkOutDate,
          bookingId:        status.bookingId,
        })
      }
    })
  })

  return result
}

// ── Auto-restore rooms whose checkout date has passed ────────
// Called on every HomestayPage load.
// Restores any room where booked=true and checkOutDate <= today 00:00.
// Note: only restores rooms with actual Firestore docs (not conflict-blocked ones).
export async function checkAndRestoreExpiredRooms(homestayId, roomIds) {
  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  const fetches = roomIds.map(roomId =>
    getDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)))
  )
  const docs = await Promise.all(fetches)

  const restores = []
  docs.forEach(snap => {
    if (!snap.exists()) return
    const d = snap.data()
    if (!d.booked || !d.checkOutDate) return

    const checkOut = new Date(d.checkOutDate)
    checkOut.setHours(0, 0, 0, 0)

    // Restore if checkout date is today or has passed
    if (checkOut <= todayMidnight) {
      restores.push(
        updateDoc(snap.ref, {
          booked:       false,
          checkOutDate: null,
          bookingId:    null,
          restoredAt:   new Date().toISOString(),
        })
      )
    }
  })

  if (restores.length > 0) await Promise.all(restores)
  return restores.length  // number of rooms restored (useful for logging)
}

// ── Mark rooms as booked after confirmed booking ─────────────
// Called from HomestayPage after Razorpay/direct confirm.
// Writes to roomAvailability + creates a bookings document.
// Also writes conflict-partner rooms as booked in Firestore so that
// any client fetching availability sees them as unavailable immediately.
export async function confirmBookingInFirestore({
  homestayId,
  roomIds,
  checkIn,
  checkOut,
  guests,
  nights,
  totalAmount,
  platformFee,
}) {
  const bookingId  = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const createdAt  = new Date().toISOString()

  // 1. Write booking document
  await setDoc(doc(db, BOOKINGS_COL, bookingId), {
    bookingId,
    homestayId,
    roomIds,
    checkIn,
    checkOut,
    guests,
    nights,
    totalAmount,
    platformFee,
    status:    "confirmed",
    createdAt,
  })

  // 2. Collect all rooms to mark booked: the booked rooms + their conflict partners
  const allRoomsToBlock = new Set(roomIds)
  roomIds.forEach(roomId => {
    const conflicts = ROOM_CONFLICTS[roomId] || []
    conflicts.forEach(c => allRoomsToBlock.add(c))
  })

  // 3. Mark each room (and conflict partners) as booked in roomAvailability
  const roomWrites = [...allRoomsToBlock].map(roomId =>
    setDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
      roomId,
      homestayId,
      booked:           true,
      checkOutDate:     checkOut,   // ISO string — used by auto-restore
      bookingId,
      bookedAt:         createdAt,
      blockedByConflict: !roomIds.includes(roomId),  // true if written due to conflict
    })
  )
  await Promise.all(roomWrites)

  return bookingId
}

// ── Phase 4 admin helpers (imported by admin dashboard) ──────

// Get all bookings (admin dashboard table)
export async function getAllBookings() {
  const snap = await getDocs(collection(db, BOOKINGS_COL))
  return snap.docs.map(d => d.data())
}

// Cancel a booking and restore its rooms immediately (admin action)
// Also clears conflict-partner rooms that were blocked by this booking.
export async function cancelBooking(bookingId, homestayId, roomIds) {
  await updateDoc(doc(db, BOOKINGS_COL, bookingId), {
    status:      "cancelled",
    cancelledAt: new Date().toISOString(),
  })

  // Collect booked rooms + their conflict partners to restore
  const allRoomsToRestore = new Set(roomIds)
  roomIds.forEach(roomId => {
    const conflicts = ROOM_CONFLICTS[roomId] || []
    conflicts.forEach(c => allRoomsToRestore.add(c))
  })

  const restores = [...allRoomsToRestore].map(roomId =>
    updateDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
      booked:           false,
      checkOutDate:     null,
      bookingId:        null,
      blockedByConflict: false,
      restoredAt:       new Date().toISOString(),
    })
  )
  await Promise.all(restores)
}

// Manually restore a single room (admin override)
export async function restoreRoom(homestayId, roomId) {
  await updateDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
    booked:           false,
    checkOutDate:     null,
    bookingId:        null,
    blockedByConflict: false,
    restoredAt:       new Date().toISOString(),
  })
}