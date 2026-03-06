// ═══════════════════════════════════════════════════════════════
//  SOUL NEST — ADMIN CONFIG
//  Edit this file to update platform fee and offers/discounts.
//  No code knowledge needed — just change the values below.
// ═══════════════════════════════════════════════════════════════

// ── PLATFORM FEE ─────────────────────────────────────────────
// This fee is charged online via Razorpay at booking.
// Remaining balance is paid at the homestay on check-in.
export const PLATFORM_FEE = 149

// ── ACTIVE OFFERS ────────────────────────────────────────────
// Add, remove, or edit offers here.
// Each offer appears as a banner on the homepage above the search bar.
// Banner auto-vanishes when the expiry date/time passes.
//
// Fields:
//   id          — unique string, don't repeat
//   label       — short tag shown on banner e.g. "FESTIVE DEAL"
//   text        — main offer headline
//   sub         — supporting line (discount details, room name, etc.)
//   expiry      — ISO date string "YYYY-MM-DDTHH:MM:SS" (24hr, local time)
//   color       — "green" | "gold" | "red"  (banner accent color)
//   roomIds     — array of room IDs this applies to, or [] for all rooms
//   discountPct — percentage discount to apply e.g. 30 for 30%
//                 set to 0 if offer is informational only (no price change)

export const OFFERS = [
  {
    id: "offer-premium-march",
    label: "LIMITED OFFER",
    text: "Flat 30% off on Premium Stays",
    sub: "Premium 1 BHK & 2 BHK · Book before offer ends",
    expiry: "2026-03-27T23:59:59",
    color: "gold",
    roomIds: ["premium-1bhk", "premium-2bhk"],
    discountPct: 30,
  },

  // ── ADD MORE OFFERS BELOW ──
  // {
  //   id: "offer-bihu-2026",
  //   label: "BIHU SPECIAL",
  //   text: "Celebrate Bihu with 20% off all rooms",
  //   sub: "Valid for check-ins between Apr 13–17 · All rooms",
  //   expiry: "2026-04-17T23:59:59",
  //   color: "green",
  //   roomIds: [],
  //   discountPct: 20,
  // },
]

// ── HELPERS (do not edit) ─────────────────────────────────────
export const getActiveOffers = () => {
  const now = new Date()
  return OFFERS.filter(o => new Date(o.expiry) > now)
}

export const getOfferForRoom = (roomId) => {
  const now = new Date()
  return OFFERS.find(o =>
    new Date(o.expiry) > now &&
    o.discountPct > 0 &&
    (o.roomIds.length === 0 || o.roomIds.includes(roomId))
  ) || null
}

export const applyDiscount = (price, roomId) => {
  const offer = getOfferForRoom(roomId)
  if (!offer) return { discountPrice: null, discount: false, offer: null }
  const discountPrice = Math.round(price * (1 - offer.discountPct / 100))
  return { discountPrice, discount: true, offer }
}