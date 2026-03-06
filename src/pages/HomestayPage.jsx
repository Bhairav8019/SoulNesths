import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { homestays } from "../data/homestays"
import { useWishlist } from "../context/WishlistContext"
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Star,
  Users, Calendar, Wifi, Car, Tv, Droplets,
  UtensilsCrossed, BedDouble, Wind, Heart, X, User, Timer
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

function LoginPromptPopup({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2D5A3D] flex items-center justify-center">
            <User size={26} className="text-white" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-xl font-bold mb-1">Login to Continue</h3>
            <p className="text-[#9a9a9a] text-sm">
              To confirm your booking, please log in first.
            </p>
          </div>
          <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 w-full text-left">
            <p className="text-[#8B6914] text-xs font-medium mb-2">How to login</p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#2D5A3D] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-white" />
              </div>
              <p className="text-[#9a9a9a] text-sm">
                Tap the <span className="text-[#F8F5F0] font-medium">user icon</span> on the top right corner of the page. Enter your phone or email to receive an OTP and log in instantly.
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

function BookingConfirmPopup({ h, selectedRoom, checkIn, checkOut, guests, nights, onClose, onPay }) {
  const [seconds, setSeconds] = useState(600)

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); onClose(); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0")
  const secs = String(seconds % 60).padStart(2, "0")
  const roomPrice = selectedRoom.discountPrice ?? selectedRoom.regularPrice
  const subtotal = roomPrice * nights
  const timerColor = seconds < 120 ? "text-red-400" : "text-[#8B6914]"

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-5 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>

        {/* Timer */}
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-bold">Booking Summary</h3>
          <div className={`flex items-center gap-1.5 ${timerColor} bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-1.5 rounded-full`}>
            <Timer size={13} />
            <span className="text-sm font-mono font-bold">{mins}:{secs}</span>
          </div>
        </div>

        <p className="text-[#9a9a9a] text-xs mb-4">
          This summary will expire in <span className={`font-semibold ${timerColor}`}>{mins}:{secs}</span>. Complete payment before the timer runs out.
        </p>

        {/* Summary Card */}
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 mb-4 flex flex-col gap-2.5">
          <div className="flex justify-between items-start">
            <span className="text-[#9a9a9a] text-xs">Homestay</span>
            <span style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-xs font-semibold text-right max-w-[55%]">{h.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9a9a9a] text-xs">Room</span>
            <span className="text-[#F8F5F0] text-xs font-medium">{selectedRoom.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9a9a9a] text-xs">Check-in</span>
            <span className="text-[#F8F5F0] text-xs">{new Date(checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9a9a9a] text-xs">Check-out</span>
            <span className="text-[#F8F5F0] text-xs">{new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
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
            <div className="flex justify-between text-xs">
              <span className="text-[#9a9a9a]">₹{roomPrice} × {nights} nights</span>
              <span className="text-[#F8F5F0]">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#9a9a9a]">Platform fee</span>
              <span className="text-[#F8F5F0]">₹{h.platformFee}</span>
            </div>
            <div className="flex justify-between text-xs italic">
              <span className="text-[#9a9a9a]">Pay at homestay</span>
              <span className="text-[#9a9a9a]">₹{Math.max(0, subtotal - h.platformFee)}</span>
            </div>
          </div>
          <div className="border-t border-[#8B6914]/30 pt-2 flex justify-between items-center">
            <span className="text-[#F8F5F0] text-sm font-semibold">Pay Now</span>
            <span style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#8B6914] text-xl font-bold">₹{h.platformFee}</span>
          </div>
        </div>

        <p className="text-[#9a9a9a] text-xs text-center mb-4">
          You will be redirected to the payment gateway to complete your booking securely via Razorpay.
        </p>
        <button onClick={onPay}
          className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#8B6914] transition shadow-lg"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Proceed to Payment — ₹{h.platformFee}
        </button>
        <p className="text-center text-[#9a9a9a] text-xs mt-3">
          🔒 Secured by Razorpay · Full refund if cancelled 48 hrs before check-in
        </p>
        <p className="text-center text-[#8B6914] text-xs mt-2 italic">
          ✦ Homestay details & owner contact will be shared via SMS, Email & WhatsApp instantly after booking confirmation
        </p>
      </div>
    </div>
  )
}

export default function HomestayPage({ onLogoClick, loggedIn, onLogin, onLogout }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const h = homestays.find(h => h.id === id)
  const [imgIndex, setImgIndex] = useState(0)

  // Get search data from location state if available
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
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showBookingConfirm, setShowBookingConfirm] = useState(false)
  const [showNestEscapes, setShowNestEscapes] = useState(false)
  const { toggleWishlist, isWishlisted } = useWishlist()

  const getTodayDate = () => new Date().toISOString().split("T")[0]

  const handleCheckInChange = (value) => {
    const today = getTodayDate()
    if (value < today) return
    setCheckIn(value)
    if (checkOut && checkOut < value) setCheckOut("")
  }

  const handleCheckOutChange = (value) => {
    if (checkIn && value < checkIn) return
    if (!checkIn) {
      const today = getTodayDate()
      if (value <= today) return
    }
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

  const roomPrice = selectedRoom ? (selectedRoom.discountPrice ?? selectedRoom.regularPrice) : 0
  const subtotal = roomPrice * nights

  const handleReserve = () => {
    if (!loggedIn) { setShowLoginPrompt(true); return }
    setShowBookingConfirm(true)
  }

  const handlePay = () => {
    setShowBookingConfirm(false)
    alert("Redirecting to Razorpay... (Phase 4)")
  }

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">
      <Navbar onLogoClick={onLogoClick} loggedIn={loggedIn} onLogin={onLogin} onLogout={onLogout} />

      {showLoginPrompt && <LoginPromptPopup onClose={() => setShowLoginPrompt(false)} />}
      {showBookingConfirm && selectedRoom && (
        <BookingConfirmPopup
          h={h}
          selectedRoom={selectedRoom}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          nights={nights}
          onClose={() => setShowBookingConfirm(false)}
          onPay={handlePay}
        />
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
            <button
              onClick={() => toggleWishlist(h)}
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
              <div key={i}
                className="flex items-center gap-2 bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl px-3 py-3 text-sm text-[#F8F5F0]">
                <span className="text-[#8B6914]">{a.icon}</span>
                {a.label}
              </div>
            ))}
          </div>
          <p className="text-[#9a9a9a] text-xs mt-3 italic px-1">
            ✦ Balcony available exclusively in Premium 1 BHK
          </p>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Search Criteria Banner */}
        {hasSearchData && (
          <div className="bg-gradient-to-r from-[#8B6914]/20 to-[#2D5A3D]/20 rounded-2xl px-4 py-3 mb-6 border border-[#8B6914]/30 flex items-center justify-between animate-fadeIn">
            <div className="flex-1">
              <p className="text-[#8B6914] font-semibold text-sm mb-2">✦ Your Search Details Applied</p>
              <div className="flex flex-wrap gap-3 text-xs text-[#F8F5F0]">
                {checkIn && (
                  <div>📅 {new Date(checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>
                )}
                {checkOut && (
                  <div>→ {new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>
                )}
                {guests && guests > 1 && (
                  <div>👥 {guests} {guests === 1 ? "Guest" : "Guests"}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => { setCheckIn(""); setCheckOut(""); setGuests(1) }}
              className="flex-shrink-0 text-[#9a9a9a] hover:text-[#F8F5F0] transition text-xs underline ml-4">
              Clear
            </button>
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
            className="text-[#F8F5F0] text-lg font-semibold mb-3">Choose Your Room</h2>
          <div className="flex flex-col gap-3">
            {h.rooms.map(room => (
              <button key={room.id} onClick={() => {
                setSelectedRoom(room)
                if (guests > room.maxGuests) setGuests(room.maxGuests)
              }}
                className={`w-full text-left bg-[#2a2a2a] rounded-2xl p-4 border-2 transition ${selectedRoom?.id === room.id ? "border-[#8B6914]" : "border-[#3a3a3a] hover:border-[#2D5A3D]"}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily: "'Playfair Display', serif" }}
                      className="text-[#F8F5F0] font-semibold text-sm">{room.name}</p>
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
                {selectedRoom?.id === room.id && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#8B6914]" />
                    <span className="text-[#8B6914] text-xs font-medium">Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Booking Card */}
        {selectedRoom && (
          <div className="bg-[#2a2a2a] rounded-3xl border border-[#3a3a3a] p-5 shadow-xl mb-8">
            <p style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-base font-semibold mb-4">{selectedRoom.name}</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a]">
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-in
                </p>
                <input type="date" value={checkIn}
                  onChange={e => handleCheckInChange(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a]">
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-out
                </p>
                <input type="date" value={checkOut}
                  onChange={e => handleCheckOutChange(e.target.value)}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
            </div>
            <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 border border-[#3a3a3a] mb-5">
              <p className="text-[#8B6914] text-xs font-medium mb-2 flex items-center gap-1">
                <Users size={11} /> Guests
              </p>
              <div className="flex items-center gap-4">
                <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#F8F5F0] flex items-center justify-center hover:border-[#8B6914] transition text-lg">−</button>
                <span className="text-[#F8F5F0] font-semibold w-6 text-center">{guests}</span>
                <button onClick={() => setGuests(g => Math.min(selectedRoom.maxGuests, g + 1))}
                  className="w-8 h-8 rounded-full bg-[#2a2a2a] border border-[#3a3a3a] text-[#F8F5F0] flex items-center justify-center hover:border-[#8B6914] transition text-lg">+</button>
                <span className="text-[#9a9a9a] text-sm">{guests === 1 ? "1 guest" : `${guests} guests`}</span>
              </div>
              <p className="text-[#9a9a9a] text-xs mt-2 italic">
                ✦ Max {selectedRoom.maxGuests} guests for {selectedRoom.name}
                {checkIn && checkOut ? ` · ${nights} ${nights === 1 ? "night" : "nights"} selected` : ""}
              </p>
            </div>
            <div className="border-t border-[#3a3a3a] pt-4 mb-5 flex flex-col gap-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#9a9a9a]">₹{roomPrice} × {nights} {nights === 1 ? "night" : "nights"}</span>
                <span className="text-[#F8F5F0]">₹{subtotal}</span>
              </div>
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
            </div>
            <button onClick={handleReserve}
              className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#8B6914] transition shadow-lg"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Reserve Now — Pay ₹{h.platformFee} to Confirm
            </button>
            <p className="text-center text-[#9a9a9a] text-xs mt-3">
              Full refund if cancelled 48 hrs before check-in · Remaining amount paid at homestay
            </p>
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
              <div key={i}
                onClick={() => setShowNestEscapes(true)}
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