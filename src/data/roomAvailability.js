// src/data/roomAvailability.js
// ─────────────────────────────────────────────────────────────────────────────
// All Firestore read/write logic for room availability and bookings.
//
// Firestore structure:
//
//   roomAvailability/{homestayId_roomId}/
//     bookedRanges/{bookingId}
//       → checkIn (ISO), checkOut (ISO), bookingId, bookedAt, blockedByConflict
//
//   bookings/{bookingId}
//       → homestayId, roomIds, checkIn, checkOut, guests, nights,
//         totalAmount, platformFee, status, createdAt
//
// DATE OVERLAP RULE:
//   A room is unavailable for [wantIn, wantOut) if any bookedRange satisfies:
//     wantIn < range.checkOut AND wantOut > range.checkIn
//   (Standard half-open interval overlap)
//
// CONFLICT RULE:
//   standard ↔ premium-2bhk are mutually exclusive for overlapping dates.
//
// AUTO-RESTORE:
//   No longer needed — date-based system naturally ignores past ranges.
//   checkAndRestoreExpiredRooms() is kept as a no-op stub so HomestayPage
//   doesn't need to change its call site.
// ─────────────────────────────────────────────────────────────────────────────

import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection, query, where,
} from "firebase/firestore"
import { db } from "../firebase"

const AVAILABILITY_COL = "roomAvailability"
const BOOKINGS_COL     = "bookings"

// ── Conflict map ─────────────────────────────────────────────
const ROOM_CONFLICTS = {
  "standard":     ["premium-2bhk"],
  "premium-2bhk": ["standard"],
}

// ── Document ID helper ───────────────────────────────────────
function availDocId(homestayId, roomId) {
  return `${homestayId}_${roomId}`
}

// ── Date overlap check ───────────────────────────────────────
// Returns true if [wantIn, wantOut) overlaps [rangeIn, rangeOut)
function datesOverlap(wantIn, wantOut, rangeIn, rangeOut) {
  return wantIn < rangeOut && wantOut > rangeIn
}

// ── Fetch bookedRanges sub-collection for one room ───────────
async function fetchBookedRanges(homestayId, roomId) {
  const rangesCol = collection(
    db, AVAILABILITY_COL, availDocId(homestayId, roomId), "bookedRanges"
  )
  const snap = await getDocs(rangesCol)
  return snap.docs.map(d => d.data())
}

// ── Fetch live availability for all rooms ────────────────────
// Returns Map<roomId, {
//   booked: bool,           // true if selected dates overlap a booking
//   nextAvailable: string,  // ISO date string of earliest free date
//   bookingId: string|null,
//   blockedByConflict: bool,
//   ranges: Array           // all booked ranges for this room
// }>
//
// checkIn / checkOut are ISO date strings (YYYY-MM-DD).
// If not provided, booked=false for all rooms (no dates selected yet).
export async function fetchRoomAvailability(homestayId, roomIds, checkIn, checkOut) {
  const result = new Map()
  roomIds.forEach(id => result.set(id, {
    booked: false, nextAvailable: null,
    bookingId: null, blockedByConflict: false, ranges: [],
  }))

  // Fetch all rooms' bookedRanges in parallel
  const rangesFetches = roomIds.map(roomId => fetchBookedRanges(homestayId, roomId))
  const allRanges     = await Promise.all(rangesFetches)

  roomIds.forEach((roomId, i) => {
    const ranges = allRanges[i]
    // Filter out past ranges (checkOut <= today) — acts as auto-restore
    const today  = new Date().toISOString().split("T")[0]
    const active = ranges.filter(r => r.checkOut > today)

    let booked    = false
    let bookingId = null
    let nextAvailable = null

    if (checkIn && checkOut) {
      // Find any range that overlaps the requested dates
      const conflict = active.find(r => datesOverlap(checkIn, checkOut, r.checkIn, r.checkOut))
      if (conflict) {
        booked    = true
        bookingId = conflict.bookingId
        // Next available = the checkout date of the conflicting range
        nextAvailable = conflict.checkOut
      }
    }

    result.set(roomId, { booked, nextAvailable, bookingId, blockedByConflict: false, ranges: active })
  })

  // ── Apply conflict propagation ───────────────────────────
  result.forEach((status, roomId) => {
    if (!status.booked) return
    const conflicts = ROOM_CONFLICTS[roomId] || []
    conflicts.forEach(conflictId => {
      if (result.has(conflictId) && !result.get(conflictId).booked) {
        const partner = result.get(conflictId)
        result.set(conflictId, {
          ...partner,
          booked:            true,
          blockedByConflict: true,
          bookingId:         status.bookingId,
          nextAvailable:     status.nextAvailable,
        })
      }
    })
  })

  return result
}

// ── Auto-restore stub ─────────────────────────────────────────
// Date-based system ignores past ranges naturally.
// Kept so HomestayPage.jsx call site doesn't need to change.
export async function checkAndRestoreExpiredRooms(homestayId, roomIds) {
  return 0
}

// ── Confirm booking ──────────────────────────────────────────
// 1. Creates bookings/{bookingId}
// 2. Writes bookedRanges/{bookingId} under each room (+ conflict partners)
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
  const bookingId = `BK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
  const createdAt = new Date().toISOString()

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

  // 2. Collect rooms to block: booked rooms + conflict partners
  const allRoomsToBlock = new Set(roomIds)
  roomIds.forEach(roomId => {
    ;(ROOM_CONFLICTS[roomId] || []).forEach(c => allRoomsToBlock.add(c))
  })

  // 3. Write a bookedRanges doc under each room's sub-collection
  const rangeData = (roomId) => ({
    bookingId,
    roomId,
    homestayId,
    checkIn,
    checkOut,
    bookedAt:          createdAt,
    blockedByConflict: !roomIds.includes(roomId),
  })

  const writes = [...allRoomsToBlock].map(roomId => {
    const rangeRef = doc(
      db,
      AVAILABILITY_COL, availDocId(homestayId, roomId),
      "bookedRanges", bookingId
    )
    return setDoc(rangeRef, rangeData(roomId))
  })

  // 4. Ensure parent roomAvailability doc exists (needed for sub-collection reads)
  const parentWrites = [...allRoomsToBlock].map(roomId =>
    setDoc(
      doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)),
      { roomId, homestayId, updatedAt: createdAt },
      { merge: true }
    )
  )

  await Promise.all([...writes, ...parentWrites])
  return bookingId
}

// ── Cancel booking ───────────────────────────────────────────
// Marks booking as cancelled + deletes the bookedRanges doc from each room.
export async function cancelBooking(bookingId, homestayId, roomIds) {
  // 1. Update booking status
  await updateDoc(doc(db, BOOKINGS_COL, bookingId), {
    status:      "cancelled",
    cancelledAt: new Date().toISOString(),
  })

  // 2. Collect rooms + conflict partners
  const allRooms = new Set(roomIds)
  roomIds.forEach(roomId => {
    ;(ROOM_CONFLICTS[roomId] || []).forEach(c => allRooms.add(c))
  })

  // 3. Delete the bookedRanges doc for this booking from each room
  const deletes = [...allRooms].map(roomId =>
    deleteDoc(doc(
      db,
      AVAILABILITY_COL, availDocId(homestayId, roomId),
      "bookedRanges", bookingId
    ))
  )
  await Promise.all(deletes)
}

// ── Restore single room (admin override) ─────────────────────
// Deletes ALL bookedRanges for a room — use with care.
// For surgical cancellation, use cancelBooking() with the bookingId instead.
export async function restoreRoom(homestayId, roomId) {
  const rangesCol = collection(
    db, AVAILABILITY_COL, availDocId(homestayId, roomId), "bookedRanges"
  )
  const snap = await getDocs(rangesCol)
  const deletes = snap.docs.map(d => deleteDoc(d.ref))
  await Promise.all(deletes)
}

// ── Get all bookings (admin dashboard) ───────────────────────
export async function getAllBookings() {
  const snap = await getDocs(collection(db, BOOKINGS_COL))
  return snap.docs.map(d => d.data())
}