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
// ALIAS RULE:
//   "standard" and "premium-2bhk" are the same physical room.
//   "standard" is a marketing label only. resolveRoomKey() always maps
//   "standard" → "premium-2bhk" before any Firestore read/write.
//   ROOM_CONFLICTS is intentionally empty — same-key rooms can't conflict.
//
// AUTO-RESTORE:
//   No longer needed — date-based system naturally ignores past ranges.
//   checkAndRestoreExpiredRooms() is kept as a no-op stub so HomestayPage
//   doesn't need to change its call site.
// ─────────────────────────────────────────────────────────────────────────────

import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  collection,
} from "firebase/firestore"
import { db } from "../firebase"

const AVAILABILITY_COL = "roomAvailability"
const BOOKINGS_COL     = "bookings"

// ── Room alias map ────────────────────────────────────────────
// "standard" and "premium-2bhk" are the same physical room.
// All Firestore keys use "premium-2bhk" as the canonical ID.
export const ROOM_ALIAS = {
  "standard":     "premium-2bhk",
  "premium-2bhk": "premium-2bhk",
  "premium-1bhk": "premium-1bhk",
  "deluxe":       "deluxe",
}

export function resolveRoomKey(roomId) {
  return ROOM_ALIAS[roomId] ?? roomId
}

// ── Conflict map ──────────────────────────────────────────────
// Empty — standard/premium-2bhk resolve to the same key so
// double-booking is impossible by design. No other rooms conflict.
const ROOM_CONFLICTS = {}

// ── Document ID helper ────────────────────────────────────────
function availDocId(homestayId, roomId) {
  // Always use the canonical key so both "standard" and "premium-2bhk"
  // read/write the same Firestore document.
  return `${homestayId}_${resolveRoomKey(roomId)}`
}

// ── Date overlap check ────────────────────────────────────────
// Returns true if [wantIn, wantOut) overlaps [rangeIn, rangeOut)
function datesOverlap(wantIn, wantOut, rangeIn, rangeOut) {
  return wantIn < rangeOut && wantOut > rangeIn
}

// ── Fetch bookedRanges sub-collection for one room ────────────
async function fetchBookedRanges(homestayId, roomId) {
  const rangesCol = collection(
    db, AVAILABILITY_COL, availDocId(homestayId, roomId), "bookedRanges"
  )
  const snap = await getDocs(rangesCol)
  return snap.docs.map(d => d.data())
}

// ── Fetch live availability for all rooms ─────────────────────
// Returns Map<roomId, {
//   booked: bool,
//   nextAvailable: string | null,
//   bookingId: string | null,
//   blockedByConflict: bool,
//   ranges: Array
// }>
//
// checkIn / checkOut are ISO date strings (YYYY-MM-DD).
// If not provided, booked=false for all rooms (no dates selected yet).
//
// Rooms that share a canonical key (standard / premium-2bhk) will always
// reflect the same availability because they read the same Firestore doc.
export async function fetchRoomAvailability(homestayId, roomIds, checkIn, checkOut) {
  const result = new Map()
  roomIds.forEach(id => result.set(id, {
    booked: false, nextAvailable: null,
    bookingId: null, blockedByConflict: false, ranges: [],
  }))

  // Deduplicate by canonical key so we don't double-fetch the same doc
  const canonicalIds  = [...new Set(roomIds.map(resolveRoomKey))]
  const rangesFetches = canonicalIds.map(cid => fetchBookedRanges(homestayId, cid))
  const allRanges     = await Promise.all(rangesFetches)

  // Build a map from canonical key → availability result
  const canonicalResult = new Map()
  canonicalIds.forEach((cid, i) => {
    const ranges = allRanges[i]
    const today  = new Date().toISOString().split("T")[0]
    // Filter out past ranges — acts as auto-restore
    const active = ranges.filter(r => r.checkOut > today)

    let booked        = false
    let bookingId     = null
    let nextAvailable = null

    if (checkIn && checkOut) {
      const conflict = active.find(r => datesOverlap(checkIn, checkOut, r.checkIn, r.checkOut))
      if (conflict) {
        booked        = true
        bookingId     = conflict.bookingId
        nextAvailable = conflict.checkOut
      }
    }

    canonicalResult.set(cid, { booked, nextAvailable, bookingId, blockedByConflict: false, ranges: active })
  })

  // Map canonical results back to every original roomId (including aliases)
  roomIds.forEach(roomId => {
    const cid = resolveRoomKey(roomId)
    result.set(roomId, { ...canonicalResult.get(cid) })
  })

  return result
}

// ── Auto-restore stub ──────────────────────────────────────────
// Date-based system ignores past ranges naturally.
// Kept so HomestayPage.jsx call site doesn't need to change.
export async function checkAndRestoreExpiredRooms(homestayId, roomIds) {
  return 0
}

// ── Confirm booking ────────────────────────────────────────────
// 1. Creates bookings/{bookingId}
// 2. Writes bookedRanges/{bookingId} under each room's canonical doc
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

  // Resolve all roomIds to canonical keys before writing
  const canonicalRoomIds = [...new Set(roomIds.map(resolveRoomKey))]

  // 1. Write booking document (store canonical IDs)
  await setDoc(doc(db, BOOKINGS_COL, bookingId), {
    bookingId,
    homestayId,
    roomIds: canonicalRoomIds,
    checkIn,
    checkOut,
    guests,
    nights,
    totalAmount,
    platformFee,
    status:    "confirmed",
    createdAt,
  })

  // 2. Write bookedRanges under each canonical room doc
  const rangeData = (roomId) => ({
    bookingId,
    roomId,
    homestayId,
    checkIn,
    checkOut,
    bookedAt:          createdAt,
    blockedByConflict: false,
  })

  const writes = canonicalRoomIds.map(roomId => {
    const rangeRef = doc(
      db,
      AVAILABILITY_COL, availDocId(homestayId, roomId),
      "bookedRanges", bookingId
    )
    return setDoc(rangeRef, rangeData(roomId))
  })

  // 3. Ensure parent roomAvailability doc exists (needed for sub-collection reads)
  const parentWrites = canonicalRoomIds.map(roomId =>
    setDoc(
      doc(db, AVAILABILITY_COL, availDocId(homestayId, roomId)),
      { roomId, homestayId, updatedAt: createdAt },
      { merge: true }
    )
  )

  await Promise.all([...writes, ...parentWrites])
  return bookingId
}

// ── Cancel booking ─────────────────────────────────────────────
// Marks booking as cancelled + deletes the bookedRanges doc from each room.
export async function cancelBooking(bookingId, homestayId, roomIds) {
  // 1. Update booking status
  await updateDoc(doc(db, BOOKINGS_COL, bookingId), {
    status:      "cancelled",
    cancelledAt: new Date().toISOString(),
  })

  // 2. Resolve to canonical keys and delete bookedRanges
  const canonicalRoomIds = [...new Set(roomIds.map(resolveRoomKey))]
  const deletes = canonicalRoomIds.map(roomId =>
    deleteDoc(doc(
      db,
      AVAILABILITY_COL, availDocId(homestayId, roomId),
      "bookedRanges", bookingId
    ))
  )
  await Promise.all(deletes)
}

// ── Restore single room (admin override) ──────────────────────
// Deletes ALL bookedRanges for a room — use with care.
export async function restoreRoom(homestayId, roomId) {
  const rangesCol = collection(
    db, AVAILABILITY_COL, availDocId(homestayId, roomId), "bookedRanges"
  )
  const snap = await getDocs(rangesCol)
  const deletes = snap.docs.map(d => deleteDoc(d.ref))
  await Promise.all(deletes)
}

// ── Get all bookings (admin dashboard) ────────────────────────
export async function getAllBookings() {
  const snap = await getDocs(collection(db, BOOKINGS_COL))
  return snap.docs.map(d => d.data())
}