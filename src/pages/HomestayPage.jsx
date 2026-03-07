import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { homestays } from "../data/homestays"
import { useWishlist } from "../context/WishlistContext"
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Star,
  Users, Calendar, Wifi, Car, Tv, Droplets,
  UtensilsCrossed, BedDouble, Wind, Heart, X, User, Timer, CheckCircle2
} from "lucide-react"
import Navbar from "../components/Navbar"

const amenities = [
  { icon: <Wifi size={16} />, label: "Free WiFi" },
  { icon: <BedDouble size={16} />, label: "King Size Bed" },
  { icon: <Tv size={16} />, label: "Smart TV" },
  { icon: <UtensilsCrossed size={16} />, label: "Fully Equipped Kitchen" },
  { icon: <Wind size={16} />, label: "Spacious Living Area" },
  { icon: <Car size={16} />, label: "Free Parking" },
  { icon: <Droplets size={16} />, label: "Drinking Water" },
  { icon: <Heart size={16} />, label: "Couple Friendly" },
]

const rules = [
  "Check-in: 12:00 PM | Check-out: 11:00 AM",
  "No smoking inside the premises",
  "Pets are not allowed",
  "Parties or loud music after 10:00 PM is not permitted",
  "Guests must carry a valid government ID at check-in",
  "Remaining balance to be paid in cash at homestay",
  "Full refund on platform fee if cancelled 48 hrs before check-in (00:00)",
  "The homestay reserves the right to deny entry if rules are violated",
]

const reviews = [
  { name: "Arjun M.", rating: 5, date: "Feb 2026", comment: "Absolutely stunning stay. The Premium 1 BHK was immaculate — felt like a luxury apartment. Will definitely return." },
  { name: "Priya S.", rating: 5, date: "Jan 2026", comment: "Perfect couple getaway. Very private, clean and the host was incredibly welcoming. Loved the kitchen!" },
  { name: "Rohit D.", rating: 4, date: "Dec 2025", comment: "Great location, cozy rooms and excellent WiFi. The balcony view in the 1 BHK is a bonus." },
]

const nestEscapes = [
  { icon: "🚙", title: "Car Rental", desc: "Explore Jorhat and beyond at your own pace. Self-drive and chauffeur options available.", tag: "On Request" },
  { icon: "🍱", title: "Food Delivered", desc: "Authentic Assamese cuisine and local delicacies delivered straight to your room.", tag: "On Order" },
  { icon: "🌿", title: "More Coming Soon", desc: "Curated local experiences, heritage tours, and more being added.", tag: "Soon" },
]

// ── Core 72hr logic ───────────────────────────────────────────
function hoursUntilCheckIn(checkInStr) {
  if (!checkInStr) return Infinity
  const checkInDate = new Date(checkInStr + "T00:00:00")
  return (checkInDate - new Date()) / 3600000
}

// ── Shared summary rows used in both popups ───────────────────
function SummaryRows({ h, selectedRooms, checkIn, checkOut, guests, nights, showFee }) {
  const roomsSubtotal = selectedRooms.reduce((sum, r) => {
    const p = r.discountPrice ?? r.regularPrice
    return sum + p * nights
  }, 0)
  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex justify-between items-start">
        <span className="text-[#9a9a9a] text-xs">Homestay</span>
        <span style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-[#F8F5F0] text-xs font-semibold text-right max-w-[55%]">{h.name}</span>
      </div>
      {/* Rooms — one line each */}
      {selectedRooms.map((r, i) => (
        <div key={r.id} className="flex justify-between">
          <span className="text-[#9a9a9a] text-xs">{i === 0 ? "Room" : `Room ${i + 1}`}</span>
          <span className="text-[#F8F5F0] text-xs font-medium">{r.name}</span>
        </div>
      ))}
      <div className="flex justify-between">
        <span className="text-[#9a9a9a] text-xs">Check-in</span>
        <span className="text-[#F8F5F0] text-xs">
          {new Date(checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#9a9a9a] text-xs">Check-out</span>
        <span className="text-[#F8F5F0] text-xs">
          {new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#9a9a9a] text-xs">Guests</span>
        <span className="text-[#F8F5F0] text-xs">{guests} {guests === 1 ? "Guest" : "Guests"}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-[#9a9a9a] text-xs">Duration</span>
        <span className="text-[#F8F5F0] text-xs">{nights} {nights === 1 ? "Night" : "Nights"}</span>
      </div>
      <div className="border-t border-[#3a3a3a] pt-2 mt-1 flex flex-col gap-1.5">
        {/* Per-room price lines */}
        {selectedRooms.map(r => {
          const p = r.discountPrice ?? r.regularPrice
          return (
            <div key={r.id} className="flex justify-between text-xs">
              <span className="text-[#9a9a9a]">{r.name} · ₹{p} × {nights}n</span>
              <span className="text-[#F8F5F0]">₹{p * nights}</span>
            </div>
          )
        })}
        {showFee ? (
          <>
            <div className="flex justify-between text-xs">
              <span className="text-[#9a9a9a]">Platform fee</span>
              <span className="text-[#F8F5F0]">₹{h.platformFee}</span>
            </div>
            <div className="flex justify-between text-xs italic">
              <span className="text-[#9a9a9a]">Pay at homestay</span>
              <span className="text-[#9a9a9a]">₹{Math.max(0, roomsSubtotal - h.platformFee)}</span>
            </div>
            <div className="border-t border-[#8B6914]/30 pt-2 flex justify-between items-center">
              <span className="text-[#F8F5F0] text-sm font-semibold">Pay Now</span>
              <span style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[#8B6914] text-xl font-bold">₹{h.platformFee}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between text-xs italic">
              <span className="text-[#9a9a9a]">Pay at homestay on arrival</span>
              <span className="text-[#9a9a9a]">₹{roomsSubtotal}</span>
            </div>
            <div className="border-t border-[#2D5A3D]/30 pt-2 flex justify-between items-center">
              <span className="text-[#F8F5F0] text-sm font-semibold">Pay Now</span>
              <span style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[#2D5A3D] text-xl font-bold">₹0</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── POPUP A — Platform fee + Razorpay (booking > 72hrs before check-in) ──
function BookingConfirmPopupFee({ h, selectedRooms, checkIn, checkOut, guests, nights, onClose, onPay }) {
  const [seconds, setSeconds] = useState(600)
  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => { if (s <= 1) { clearInterval(t); onClose(); return 0 } return s - 1 })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")
  const timerColor = seconds < 120 ? "text-red-400" : "text-[#8B6914]"

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-5 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>
        <div className="flex items-center justify-between mb-2">
          <h3 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-bold">Booking Summary</h3>
          <div className={`flex items-center gap-1.5 ${timerColor} bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-1.5 rounded-full`}>
            <Timer size={13} />
            <span className="text-sm font-mono font-bold">{mins}:{secs}</span>
          </div>
        </div>
        <p className="text-[#9a9a9a] text-xs mb-4">
          Summary expires in <span className={`font-semibold ${timerColor}`}>{mins}:{secs}</span>. Complete payment before the timer runs out.
        </p>

        <SummaryRows h={h} selectedRooms={selectedRooms} checkIn={checkIn} checkOut={checkOut}
          guests={guests} nights={nights} showFee={true} />

        <div className="mt-3 bg-[#2D5A3D]/10 border border-[#2D5A3D]/30 rounded-xl px-3 py-2.5">
          <p className="text-[#2D5A3D] text-xs font-medium">🛡️ Full refund policy</p>
          <p className="text-[#9a9a9a] text-xs mt-0.5">
            Platform fee fully refunded if cancelled before 48 hrs of check-in (00:00). No questions asked.
          </p>
        </div>

        <p className="text-[#9a9a9a] text-xs text-center mt-3 mb-3">
          You will be redirected to Razorpay to complete your booking securely.
        </p>
        <button onClick={onPay}
          className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#8B6914] transition shadow-lg"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Proceed to Payment — ₹{h.platformFee}
        </button>
        <p className="text-center text-[#9a9a9a] text-xs mt-2">🔒 Secured by Razorpay</p>
        <p className="text-center text-[#8B6914] text-xs mt-1 italic">
          ✦ Owner contact shared via SMS, Email & WhatsApp after confirmation
        </p>
      </div>
    </div>
  )
}

// ── POPUP B — Direct booking (within 72hrs of check-in) ──────
function BookingConfirmPopupDirect({ h, selectedRooms, checkIn, checkOut, guests, nights, onClose, onConfirm }) {
  const roomsSubtotal = selectedRooms.reduce((sum, r) => sum + (r.discountPrice ?? r.regularPrice) * nights, 0)
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-5 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h3 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-bold">Booking Summary</h3>
          <span className="text-xs bg-[#2D5A3D]/20 text-[#2D5A3D] border border-[#2D5A3D]/40 px-2 py-0.5 rounded-full whitespace-nowrap">
            No Payment Now
          </span>
        </div>

        <div className="bg-[#1a2a1a] border border-[#2D5A3D]/40 rounded-xl px-3 py-2.5 mb-4">
          <p className="text-[#2D5A3D] text-xs font-semibold">⚡ Last-minute booking</p>
          <p className="text-[#9a9a9a] text-xs mt-0.5">
            Your check-in is within 72 hours — no platform fee is charged. Full amount paid directly at the homestay on arrival.
          </p>
        </div>

        <SummaryRows h={h} selectedRooms={selectedRooms} checkIn={checkIn} checkOut={checkOut}
          guests={guests} nights={nights} showFee={false} />

        <div className="mt-3 bg-[#8B6914]/10 border border-[#8B6914]/30 rounded-xl px-3 py-2.5">
          <p className="text-[#8B6914] text-xs font-medium">💰 Pay at homestay on arrival</p>
          <p className="text-[#9a9a9a] text-xs mt-0.5">
            Full amount of ₹{roomsSubtotal} to be paid in cash or UPI directly to the homestay on check-in.
          </p>
        </div>

        <p className="text-[#9a9a9a] text-xs text-center mt-3 mb-3">
          Booking confirmation and owner contact will be shared via SMS, Email & WhatsApp immediately.
        </p>
        <button onClick={onConfirm}
          className="w-full text-white py-4 rounded-2xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2"
          style={{ fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #2D5A3D, #3a7a52)" }}>
          <CheckCircle2 size={16} />
          Confirm Booking — No Payment Required
        </button>
        <p className="text-center text-[#8B6914] text-xs mt-2 italic">
          ✦ Owner contact shared via SMS, Email & WhatsApp after confirmation
        </p>
      </div>
    </div>
  )
}

// ── Login prompt ──────────────────────────────────────────────
function LoginPromptPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2D5A3D] flex items-center justify-center">
            <User size={26} className="text-white" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-xl font-bold mb-1">Login to Continue</h3>
            <p className="text-[#9a9a9a] text-sm">To confirm your booking, please log in first.</p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 w-full text-left">
            <p className="text-[#8B6914] text-xs font-medium mb-2">How to login</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-white" />
              </div>
              <p className="text-[#9a9a9a] text-sm">
                Tap the <span className="text-[#F8F5F0] font-medium">user icon</span> on the top right. Enter your phone or email to receive an OTP and log in instantly.
              </p>
            </div>
          </div>
          <button onClick={onClose}
            className="w-full bg-[#2D5A3D] text-white py-3 rounded-2xl text-sm font-medium hover:bg-[#8B6914] transition">
            Got it — I'll login now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function HomestayPage({ onLogoClick, loggedIn, onLogin, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const h = homestays.find(h => h.id === id)
  const [imgIndex, setImgIndex] = useState(0)

  const locationState = location.state || {}
  const searchData = locationState.searchData || {}

  const parseSearchDate = (dateStr) => {
    if (!dateStr) return ""
    if (dateStr.includes("T")) return dateStr.split("T")[0]
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ""
    return d.toISOString().split("T")[0]
  }

  const [checkIn, setCheckIn] = useState(parseSearchDate(searchData.checkIn) || "")
  const [checkOut, setCheckOut] = useState(parseSearchDate(searchData.checkOut) || "")
  const [guests, setGuests] = useState(searchData.guests ? parseInt(searchData.guests) : 1)

  const hasSearchData = !!(checkIn || checkOut || (guests && guests > 1))
  const [selectedRooms, setSelectedRooms] = useState([])   // array of room objects
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showFeePopup, setShowFeePopup] = useState(false)
  const [showDirectPopup, setShowDirectPopup] = useState(false)
  const [showNestEscapes, setShowNestEscapes] = useState(false)
  const { toggleWishlist, isWishlisted } = useWishlist()

  // ── Multi-room helpers ───────────────────────────────────────
  const primaryRoom = selectedRooms[0] || null
  const combinedMaxGuests = selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0)
  // Rooms not yet selected (available to add)
  const availableToAdd = h ? h.rooms.filter(r => !selectedRooms.find(s => s.id === r.id)) : []
  // Total rooms capacity cap from property
  const atPropertyCap = h ? selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0) >= h.totalMaxGuests : false

  const toggleRoom = (room) => {
    setSelectedRooms(prev => {
      const exists = prev.find(r => r.id === room.id)
      if (exists) {
        // Remove room — also clamp guests to new combined cap
        const next = prev.filter(r => r.id !== room.id)
        const newCap = next.reduce((sum, r) => sum + r.maxGuests, 0)
        setGuests(g => Math.min(g, Math.max(1, newCap)))
        return next
      } else {
        return [...prev, room]
      }
    })
  }

  const getTodayDate = () => new Date().toISOString().split("T")[0]

  const handleCheckInChange = (value) => {
    if (value < getTodayDate()) return
    setCheckIn(value)
    if (checkOut && checkOut < value) setCheckOut("")
  }

  const handleCheckOutChange = (value) => {
    if (checkIn && value < checkIn) return
    if (!checkIn && value <= getTodayDate()) return
    setCheckOut(value)
  }

  if (!h) return (
    <div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F8F5F0]">
      Homestay not found.
    </div>
  )

  const prev = () => setImgIndex(i => (i === 0 ? h.images.length - 1 : i - 1))
  const next = () => setImgIndex(i => (i === h.images.length - 1 ? 0 : i + 1))

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)))
    : 1

  const subtotal = selectedRooms.reduce((sum, r) => {
    return sum + (r.discountPrice ?? r.regularPrice) * nights
  }, 0)

  // ── 72hr gate ────────────────────────────────────────────────
  const hrs = hoursUntilCheckIn(checkIn)
  const isDirectMode = checkIn && hrs <= 72

  const handleReserve = () => {
    if (!loggedIn) { setShowLoginPrompt(true); return }
    if (isDirectMode) setShowDirectPopup(true)
    else setShowFeePopup(true)
  }

  const handlePay = () => {
    setShowFeePopup(false)
    alert("Redirecting to Razorpay... (Phase 4)")
  }

  const handleDirectConfirm = () => {
    setShowDirectPopup(false)
    alert("Booking confirmed! Owner details sent to you shortly. (Phase 4)")
  }

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">
      <Navbar onLogoClick={onLogoClick} loggedIn={loggedIn} onLogin={onLogin} onLogout={onLogout} />

      {showLoginPrompt && <LoginPromptPopup onClose={() => setShowLoginPrompt(false)} />}
      {showFeePopup && selectedRooms.length > 0 && (
        <BookingConfirmPopupFee h={h} selectedRooms={selectedRooms}
          checkIn={checkIn} checkOut={checkOut} guests={guests} nights={nights}
          onClose={() => setShowFeePopup(false)} onPay={handlePay} />
      )}
      {showDirectPopup && selectedRooms.length > 0 && (
        <BookingConfirmPopupDirect h={h} selectedRooms={selectedRooms}
          checkIn={checkIn} checkOut={checkOut} guests={guests} nights={nights}
          onClose={() => setShowDirectPopup(false)} onConfirm={handleDirectConfirm} />
      )}
      {showNestEscapes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => setShowNestEscapes(false)}
              className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
              <X size={18} />
            </button>
            <div className="text-5xl mb-4">🌿</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-xl font-bold mb-2">Coming Soon</h3>
            <p className="text-[#9a9a9a] text-sm mb-6">
              Nest Escapes curated experiences are being handcrafted for you. Car rentals, local food delivery, heritage tours and more — arriving soon.
            </p>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#2D5A3D] to-[#8B6914] mx-auto mb-6" />
            <button onClick={() => setShowNestEscapes(false)}
              className="w-full bg-[#2D5A3D] text-white py-3 rounded-2xl text-sm font-medium hover:bg-[#8B6914] transition"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="pt-20 max-w-3xl mx-auto px-4 pb-24">
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#9a9a9a] hover:text-[#F8F5F0] transition mt-4 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Homestays
        </button>

        {/* Gallery */}
        <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl">
          <img src={h.images[imgIndex]} alt={h.name}
            className="w-full h-full object-cover transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <button onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-[#2D5A3D] transition backdrop-blur-sm">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-[#2D5A3D] transition backdrop-blur-sm">
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {h.images.map((_, i) => (
              <button key={i} onClick={() => setImgIndex(i)}
                className={`h-2 rounded-full transition-all ${i === imgIndex ? "bg-white w-4" : "bg-white/40 w-2"}`} />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {imgIndex + 1} / {h.images.length}
          </div>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {h.images.map((img, i) => (
            <button key={i} onClick={() => setImgIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${i === imgIndex ? "border-[#8B6914]" : "border-transparent"}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Name & Rating */}
        <div className="mt-6 flex items-start justify-between">
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-2xl font-bold">{h.name}</h1>
            <div className="flex items-center gap-1 mt-1 text-[#9a9a9a] text-sm">
              <MapPin size={13} className="text-[#8B6914]" />
              {h.location}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs bg-[#2D5A3D]/30 text-[#2D5A3D] border border-[#2D5A3D]/40 px-3 py-1 rounded-full">
                💑 Couple Friendly
              </span>
            </div>
            <button onClick={() => toggleWishlist(h)}
              style={{ transition: "transform 0.2s ease" }}
              className={`flex items-center gap-2 text-sm mt-2 ${isWishlisted(h.id) ? "text-red-500" : "text-[#9a9a9a] hover:text-red-500"} transition`}>
              <Heart size={16} fill={isWishlisted(h.id) ? "currentColor" : "none"} />
              {isWishlisted(h.id) ? "Wishlisted" : "Save to Wishlist"}
            </button>
          </div>
          <div className="flex items-center gap-1 bg-[#2a2a2a] px-3 py-1.5 rounded-xl border border-[#3a3a3a]">
            <Star size={13} className="text-[#8B6914] fill-[#8B6914]" />
            <span className="text-[#F8F5F0] text-sm font-semibold">{h.rating}</span>
            <span className="text-[#9a9a9a] text-xs">({h.reviews})</span>
          </div>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Amenities */}
        <div className="mb-8">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-semibold mb-4">What's Included</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {amenities.map((a, i) => (
              <div key={i} className="flex items-center gap-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl px-3 py-3 text-sm text-[#F8F5F0]">
                <span className="text-[#8B6914]">{a.icon}</span>
                {a.label}
              </div>
            ))}
          </div>
          <p className="text-[#9a9a9a] text-xs mt-3 italic px-1">✦ Balcony available exclusively in Premium 1 BHK</p>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Search Criteria Banner */}
        {hasSearchData && (
          <div className="bg-gradient-to-r from-[#8B6914]/20 to-[#2D5A3D]/20 rounded-2xl px-4 py-3 mb-6 border border-[#8B6914]/30 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[#8B6914] font-semibold text-sm mb-2">✦ Your Search Details Applied</p>
              <div className="flex flex-wrap gap-3 text-xs text-[#F8F5F0]">
                {checkIn && <div>📅 {new Date(checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>}
                {checkOut && <div>→ {new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>}
                {guests > 1 && <div>👥 {guests} Guests</div>}
              </div>
            </div>
            <button onClick={() => { setCheckIn(""); setCheckOut(""); setGuests(1) }}
              className="flex-shrink-0 text-[#9a9a9a] hover:text-[#F8F5F0] transition text-xs underline ml-4">Clear</button>
          </div>
        )}

        {/* Offer Banner */}
        {new Date() <= new Date(h.offerExpiry) && (
          <div className="bg-gradient-to-r from-[#2D5A3D] to-[#8B6914] rounded-2xl px-4 py-3 mb-6 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">🎉 Flat 30% off on Premium stays!</p>
              <p className="text-white/70 text-xs mt-0.5">
                ⏳ Offer valid till {new Date(h.offerExpiry).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <span className="text-white text-2xl font-bold">30% off</span>
          </div>
        )}

        {/* Room Selection */}
        <div className="mb-6">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-semibold mb-1">Choose Your Room</h2>
          <p className="text-[#9a9a9a] text-xs mb-3">Tap to select · Tap again to deselect · Add multiple rooms for larger groups</p>
          <div className="flex flex-col gap-3">
            {h.rooms.map(room => {
              const isSelected = !!selectedRooms.find(r => r.id === room.id)
              const isPrimary = selectedRooms[0]?.id === room.id
              return (
                <button key={room.id} onClick={() => toggleRoom(room)}
                  className={`w-full text-left bg-[#2a2a2a] rounded-2xl p-4 border-2 transition ${
                    isSelected ? "border-[#8B6914]" : "border-[#3a3a3a] hover:border-[#2D5A3D]"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontFamily: "'Playfair Display', serif" }}
                          className="text-[#F8F5F0] font-semibold text-sm">{room.name}</p>
                        <span className="text-[#9a9a9a] text-xs flex items-center gap-1">
                          <Users size={10} /> Max {room.maxGuests}
                        </span>
                      </div>
                      <p className="text-[#9a9a9a] text-xs mt-0.5">{room.description}</p>
                      {room.id === "premium-1bhk" && (
                        <span className="text-xs text-[#8B6914] mt-1 inline-block">✦ Includes private balcony</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      {room.discount ? (
                        <>
                          <p className="text-[#9a9a9a] text-xs line-through">₹{room.regularPrice}</p>
                          <p className="text-[#2D5A3D] font-bold text-base">₹{room.discountPrice}</p>
                          <span className="text-xs bg-[#2D5A3D] text-white px-2 py-0.5 rounded-full">30% off</span>
                        </>
                      ) : (
                        <p className="text-[#F8F5F0] font-bold text-base">₹{room.regularPrice}</p>
                      )}
                      <p className="text-[#9a9a9a] text-xs">/ night</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#8B6914]" />
                      <span className="text-[#8B6914] text-xs font-medium">
                        {isPrimary ? "Primary Room" : "Added"}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── BOOKING CARD ── */}
        {selectedRooms.length > 0 && (
          <div className="bg-[#2a2a2a] rounded-3xl border border-[#3a3a3a] p-5 shadow-xl mb-8">

            {/* ── Selected rooms summary strip ── */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[#F8F5F0] text-base font-semibold">
                  {selectedRooms.length === 1 ? selectedRooms[0].name : `${selectedRooms.length} Rooms Selected`}
                </p>
                <span className="text-[#8B6914] text-xs border border-[#8B6914]/40 px-2 py-0.5 rounded-full">
                  Max {combinedMaxGuests} guests
                </span>
              </div>
              {selectedRooms.length > 1 && (
                <div className="flex flex-col gap-1 bg-[#1C1C1C] rounded-2xl px-3 py-2.5 border border-[#3a3a3a]">
                  {selectedRooms.map((r, i) => {
                    const p = r.discountPrice ?? r.regularPrice
                    return (
                      <div key={r.id} className="flex justify-between items-center">
                        <span className="text-[#9a9a9a] text-xs">{i === 0 ? "📌 " : "➕ "}{r.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#F8F5F0] text-xs">₹{p}/night</span>
                          <button onClick={() => toggleRoom(r)}
                            className="text-[#9a9a9a] hover:text-red-400 transition text-xs px-1">✕</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Add another room prompt (if rooms still available and not at property cap) ── */}
            {availableToAdd.length > 0 && !atPropertyCap && (
              <div className="bg-[#1C1C1C] border border-dashed border-[#3a3a3a] rounded-2xl px-3 py-3 mb-4">
                <p className="text-[#8B6914] text-xs font-medium mb-2 flex items-center gap-1">
                  <Users size={11} /> Need more rooms?
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map(r => {
                    const p = r.discountPrice ?? r.regularPrice
                    return (
                      <button key={r.id} onClick={() => toggleRoom(r)}
                        className="flex items-center gap-1.5 bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#8B6914] text-[#F8F5F0] text-xs px-3 py-1.5 rounded-full transition">
                        <span className="text-[#8B6914]">+</span>
                        {r.name}
                        <span className="text-[#9a9a9a]">·</span>
                        <span className="text-[#9a9a9a]">₹{p}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-[#9a9a9a] text-xs mt-2 italic">
                  ✦ Property can host up to {h.totalMaxGuests} guests total
                </p>
              </div>
            )}
            {atPropertyCap && (
              <div className="bg-[#2D5A3D]/10 border border-[#2D5A3D]/30 rounded-2xl px-3 py-2.5 mb-4">
                <p className="text-[#2D5A3D] text-xs font-semibold">✓ Full property booked</p>
                <p className="text-[#9a9a9a] text-xs mt-0.5">You've selected rooms up to the property's max capacity of {h.totalMaxGuests} guests.</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a]">
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-in
                </p>
                <input type="date" value={checkIn}
                  onChange={e => handleCheckInChange(e.target.value)}
                  min={getTodayDate()}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a]">
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-out
                </p>
                <input type="date" value={checkOut}
                  onChange={e => handleCheckOutChange(e.target.value)}
                  min={checkIn || getTodayDate()}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
            </div>

            {/* Guests — capped by combinedMaxGuests */}
            <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a] mb-5">
              <p className="text-[#8B6914] text-xs font-medium mb-2 flex items-center gap-1">
                <Users size={11} /> Guests
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#F8F5F0] flex items-center justify-center hover:border-[#8B6914] transition text-lg">−</button>
                <span className="text-[#F8F5F0] font-semibold w-6 text-center">{guests}</span>
                <button onClick={() => setGuests(g => Math.min(combinedMaxGuests, g + 1))}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#F8F5F0] flex items-center justify-center hover:border-[#8B6914] transition text-lg">+</button>
                <span className="text-[#9a9a9a] text-sm">{guests === 1 ? "1 guest" : `${guests} guests`}</span>
              </div>
              <p className="text-[#9a9a9a] text-xs mt-2 italic">
                ✦ Max {combinedMaxGuests} guests across {selectedRooms.length} {selectedRooms.length === 1 ? "room" : "rooms"}
                {checkIn && checkOut ? ` · ${nights} ${nights === 1 ? "night" : "nights"}` : ""}
              </p>
              {guests > combinedMaxGuests - 2 && guests === combinedMaxGuests && availableToAdd.length > 0 && !atPropertyCap && (
                <p className="text-[#8B6914] text-xs mt-1 font-medium">
                  ⚠ At room capacity — add another room above for more guests
                </p>
              )}
            </div>

            {/* Price breakdown */}
            <div className="border-t border-[#3a3a3a] pt-4 mb-5 flex flex-col gap-2">
              {selectedRooms.map(r => {
                const p = r.discountPrice ?? r.regularPrice
                return (
                  <div key={r.id} className="flex justify-between text-sm">
                    <span className="text-[#9a9a9a]">{r.name} · ₹{p} × {nights}n</span>
                    <span className="text-[#F8F5F0]">₹{p * nights}</span>
                  </div>
                )
              })}
              {isDirectMode ? (
                <>
                  <div className="flex justify-between text-sm text-[#9a9a9a] italic">
                    <span>Pay at homestay on arrival</span>
                    <span>₹{subtotal}</span>
                  </div>
                  <div className="border-t border-[#2D5A3D]/30 pt-2 flex justify-between font-semibold">
                    <span className="text-[#F8F5F0]">Pay now</span>
                    <span style={{ fontFamily: "'Playfair Display', serif" }}
                      className="text-[#2D5A3D] text-lg">₹0</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#9a9a9a]">Platform fee</span>
                    <span className="text-[#F8F5F0]">₹{h.platformFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#9a9a9a] italic">
                    <span>Remaining (pay at homestay)</span>
                    <span>₹{Math.max(0, subtotal - h.platformFee)}</span>
                  </div>
                  <div className="border-t border-[#3a3a3a] pt-2 flex justify-between font-semibold">
                    <span className="text-[#F8F5F0]">Pay now</span>
                    <span style={{ fontFamily: "'Playfair Display', serif" }}
                      className="text-[#8B6914] text-lg">₹{h.platformFee}</span>
                  </div>
                </>
              )}
            </div>

            {/* ── THE BUTTON — two faces ── */}
            {isDirectMode ? (
              <>
                <div className="bg-[#1a2a1a] border border-[#2D5A3D]/40 rounded-xl px-3 py-2 mb-3">
                  <p className="text-[#2D5A3D] text-xs font-semibold">⚡ Last-minute booking</p>
                  <p className="text-[#9a9a9a] text-xs mt-0.5">
                    Check-in within 72 hours — no platform fee. Pay full amount at homestay on arrival.
                  </p>
                </div>
                <button onClick={handleReserve}
                  className="w-full text-white py-4 rounded-2xl font-semibold text-base transition shadow-lg flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #2D5A3D, #3a7a52)" }}>
                  <CheckCircle2 size={18} />
                  Book Now — No Payment Required
                </button>
                <p className="text-center text-[#9a9a9a] text-xs mt-3">
                  Full amount ₹{subtotal} paid directly at homestay on check-in
                </p>
              </>
            ) : (
              <>
                <button onClick={handleReserve}
                  className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#8B6914] transition shadow-lg"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reserve Now — Pay ₹{h.platformFee} to Confirm
                </button>
                <p className="text-center text-[#9a9a9a] text-xs mt-3">
                  Full refund if cancelled 48 hrs before check-in · Remaining amount paid at homestay
                </p>
              </>
            )}
          </div>
        )}

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Nest Escapes */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold">Nest Escapes</h2>
            <span className="text-xs text-[#8B6914] border border-[#8B6914]/40 px-2 py-0.5 rounded-full">Curated Experiences</span>
          </div>
          <p className="text-[#9a9a9a] text-xs mb-4">Handpicked add-ons to elevate your stay</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {nestEscapes.map((e, i) => (
              <div key={i} onClick={() => setShowNestEscapes(true)}
                className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 hover:border-[#8B6914] transition cursor-pointer">
                <div className="text-3xl mb-2">{e.icon}</div>
                <p style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[#F8F5F0] font-semibold text-sm mb-1">{e.title}</p>
                <p className="text-[#9a9a9a] text-xs mb-3">{e.desc}</p>
                <span className="text-xs bg-[#1C1C1C] text-[#8B6914] border border-[#8B6914]/30 px-2 py-0.5 rounded-full">{e.tag}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Reviews */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold">Guest Reviews</h2>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-[#8B6914] fill-[#8B6914]" />
              <span className="text-[#F8F5F0] font-bold">{h.rating}</span>
              <span className="text-[#9a9a9a] text-xs">({h.reviews} reviews)</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center text-white text-xs font-bold">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-[#F8F5F0] text-sm font-medium">{r.name}</p>
                      <p className="text-[#9a9a9a] text-xs">{r.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(r.rating)].map((_, j) => (
                      <Star key={j} size={11} className="text-[#8B6914] fill-[#8B6914]" />
                    ))}
                  </div>
                </div>
                <p className="text-[#9a9a9a] text-sm italic">"{r.comment}"</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Rules */}
        <div className="mb-8">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-semibold mb-4">House Rules & Policies</h2>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-5 flex flex-col gap-3">
            {rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[#8B6914] mt-0.5 flex-shrink-0">✦</span>
                <span className="text-[#9a9a9a]">{rule}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}