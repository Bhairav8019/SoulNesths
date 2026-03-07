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

// ── Document ID helper ───────────────────────────────────────
function availDocId(homestayId, roomId) {
  return `${homestayId}_${roomId}`
}

// ── Fetch live availability for all rooms in a homestay ──────
// Returns a Map<roomId, { booked, checkOutDate, bookingId }>
// If a room has no Firestore doc yet, it defaults to { booked: false }.
export async function fetchRoomAvailability(homestayId, roomIds) {
  const result = new Map()
  // Default all to available
  roomIds.forEach(id => result.set(id, { booked: false, checkOutDate: null, bookingId: null }))

  const fetches = roomIds.map(roomId =>
    getDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)))
  )
  const docs = await Promise.all(fetches)
  docs.forEach(snap => {
    if (snap.exists()) {
      const d = snap.data()
      result.set(d.roomId, {
        booked:      d.booked,
        checkOutDate: d.checkOutDate || null,
        bookingId:   d.bookingId || null,
      })
    }
  })
  return result
}

// ── Auto-restore rooms whose checkout date has passed ────────
// Called on every HomestayPage load.
// Restores any room where booked=true and checkOutDate <= today 00:00.
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
          booked:      false,
          checkOutDate: null,
          bookingId:   null,
          restoredAt:  new Date().toISOString(),
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

  // 2. Mark each room as booked in roomAvailability
  const roomWrites = roomIds.map(roomId =>
    setDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
      roomId,
      homestayId,
      booked:      true,
      checkOutDate: checkOut,        // ISO string — used by auto-restore
      bookingId,
      bookedAt:    createdAt,
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
export async function cancelBooking(bookingId, homestayId, roomIds) {
  await updateDoc(doc(db, BOOKINGS_COL, bookingId), {
    status:      "cancelled",
    cancelledAt: new Date().toISOString(),
  })
  const restores = roomIds.map(roomId =>
    updateDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
      booked:      false,
      checkOutDate: null,
      bookingId:   null,
      restoredAt:  new Date().toISOString(),
    })
  )
  await Promise.all(restores)
}

// Manually restore a single room (admin override)
export async function restoreRoom(homestayId, roomId) {
  await updateDoc(doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)), {
    booked:      false,
    checkOutDate: null,
    bookingId:   null,
    restoredAt:  new Date().toISOString(),
  })
}