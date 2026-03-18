import { PLATFORM_FEE } from "./adminConfig"

// ── ROOM AVAILABILITY ─────────────────────────────────────────────────────────
// Each room has two availability fields:
//
//   booked: true/false
//     → Set to true when a room is currently occupied / reserved.
//     → Phase 4 (Firebase): this will be driven by Firestore in real-time.
//       The admin dashboard will toggle this per booking. For now, edit manually.
//
//   conflictsWith: [array of room IDs]
//     → Rooms that CANNOT be booked simultaneously because they share physical
//       space. If a user selects room A, all rooms in A's conflictsWith list
//       become unavailable in the UI, and vice versa.
//     → Example: "standard" and "premium-2bhk" share the same physical area.
//       Booking one makes the other unavailable for the same dates.
//     → Phase 4 (Firebase): conflict rules will live in Firestore under each
//       room document and be fetched on HomestayPage load. Same logic applies.
//
// TO MARK A ROOM AS BOOKED (before Firebase):
//   Change booked: false → booked: true for that room in the array below.
//   The UI will automatically grey it out and block selection.
// ─────────────────────────────────────────────────────────────────────────────

export const homestays = [
  {
    id: "soul-nest-main",
    name: "Soul Nest Homestay",
    location: "Malow Ali Bye Pass, Jorhat",
    startingPrice: 1000,
    platformFee: PLATFORM_FEE,
    rating: 4.9,
    reviews: 24,
    image: "/soulnest.jpeg",
    images: [
      "/soulnest.jpeg",
      "/image1.jpeg",
      "/image2.jpeg",
      "/image3.jpeg",
      "/image4.png",
      "/image5.png",
      "/image6.png",
      "/image7.png",
      "/image8.png",
      "/image9.png",
      "/image10.png",
      "/image11.png",
      "/image12.png",
      "/image13.png",
      "/image14.png",
      "/image15.png",
    ],
    lat: 26.768666,
    lng: 94.188933,
    isOurs: true,
    available: true,
    offerExpiry: "2026-03-27",
    totalMaxGuests: 14,
    rooms: [
      {
        id: "standard",
        name: "Standard Room",
        regularPrice: 1000,
        discountPrice: null,
        discount: false,
        description: "Comfortable and cozy room for a peaceful stay.",
        maxGuests: 3,
        booked: false,                        // ← set true when occupied
        conflictsWith: ["premium-2bhk"],       // shares physical space with 2BHK
      },
      {
        id: "deluxe",
        name: "Deluxe Room",
        regularPrice: 1500,
        discountPrice: null,
        discount: false,
        description: "Spacious deluxe room with premium amenities.",
        maxGuests: 3,
        booked: false,
        conflictsWith: [],                     // no conflicts
      },
      {
        id: "premium-1bhk",
        name: "Premium 1 BHK",
        regularPrice: 2500,
        discountPrice: 1750,
        discount: true,
        description: "Luxurious 1 BHK with full kitchen and living area.",
        maxGuests: 3,
        booked: false,
        conflictsWith: [],                     // no conflicts
      },
      {
        id: "premium-2bhk",
        name: "Premium 2 BHK",
        regularPrice: 3500,
        discountPrice: 2450,
        discount: true,
        description: "Expansive 2 BHK perfect for families or groups.",
        maxGuests: 5,
        booked: false,                        // ← set true when occupied
        conflictsWith: ["standard"],           // encompasses the Standard Room area
      },
    ],
  },
]