import { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { homestays } from "../data/homestays"
import { useWishlist } from "../context/WishlistContext"
import {
  ArrowLeft, ChevronLeft, ChevronRight, MapPin, Star,
  Users, Calendar, Wifi, Car, Tv, Droplets,
  UtensilsCrossed, BedDouble, Wind, Heart, X, User, Timer, CheckCircle2, Phone
} from "lucide-react"
import Navbar from "../components/Navbar"
import { useAuth } from "../context/AuthContext"
import {
  fetchRoomAvailability,
  checkAndRestoreExpiredRooms,
  confirmBookingInFirestore,
} from "../data/roomAvailability"

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


// ── Phone validation — Indian & international ─────────────────
function validatePhone(raw) {
  const cleaned = raw.replace(/[\s\-().]/g, "")
  if (!cleaned) return false
  if (/^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned)) return true
  if (/^\+\d{7,15}$/.test(cleaned)) return true
  return false
}

// ── Guest Details Popup ───────────────────────────────────────
function GuestDetailsPopup({ onClose, onConfirm }) {
  const [name, setName]          = useState("")
  const [contact, setContact]    = useState("")
  const [whatsapp, setWhatsapp]  = useState("")
  const [sameAsContact, setSame] = useState(false)
  const [errors, setErrors]      = useState({})
  const [touched, setTouched]    = useState({})

  useEffect(() => {
    if (sameAsContact) setWhatsapp(contact)
  }, [sameAsContact, contact])

  const validate = () => {
    const e = {}
    if (!name.trim()) e.name = "Name is required"
    if (!contact.trim()) {
      e.contact = "Contact number is required"
    } else if (!validatePhone(contact)) {
      e.contact = "Enter a valid Indian (+91) or international number"
    }
    if (whatsapp.trim() && !validatePhone(whatsapp)) {
      e.whatsapp = "Enter a valid WhatsApp number"
    }
    return e
  }

  const handleConfirm = () => {
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      setTouched({ name: true, contact: true, whatsapp: true })
      return
    }
    onConfirm({ name: name.trim(), contact: contact.trim(), whatsapp: whatsapp.trim() })
  }

  const fieldMeta = (key) => ({
    borderStyle: touched[key] && errors[key]
      ? { border: "1.5px solid #ef4444" }
      : { border: "1.5px solid #3a3a3a" },
    err: touched[key] ? errors[key] : null,
    blur: () => setTouched(t => ({ ...t, [key]: true })),
  })
  const nm = fieldMeta("name")
  const ct = fieldMeta("contact")
  const wa = fieldMeta("whatsapp")

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}>
      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-5 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#2D5A3D] flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-white" />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-bold leading-tight">Guest Details</h3>
            <p className="text-[#9a9a9a] text-xs">Required before confirming your booking</p>
          </div>
        </div>
        <div className="w-full h-px bg-[#3a3a3a] mb-4" />
        <div className="flex flex-col gap-4">

          <div>
            <label className="text-[#8B6914] text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <User size={10} />
              Booking in the name of
              <span className="text-red-400 font-bold">*</span>
            </label>
            <input type="text" value={name}
              onChange={e => { setName(e.target.value); setErrors(ev => ({ ...ev, name: "" })) }}
              onBlur={nm.blur}
              placeholder="Full name of primary guest"
              className="w-full bg-[#2a2a2a] text-[#F8F5F0] text-sm px-4 py-3 rounded-2xl outline-none placeholder-[#5a5a5a]"
              style={nm.borderStyle} />
            {nm.err && <p className="text-red-400 text-xs mt-1 ml-1">{nm.err}</p>}
          </div>

          <div>
            <label className="text-[#8B6914] text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <Phone size={10} />
              Contact number
              <span className="text-red-400 font-bold">*</span>
              <span className="text-[#5a5a5a] font-normal">&middot; Indian or international</span>
            </label>
            <input type="tel" value={contact}
              onChange={e => {
                setContact(e.target.value)
                setErrors(ev => ({ ...ev, contact: "" }))
                if (sameAsContact) setWhatsapp(e.target.value)
              }}
              onBlur={ct.blur}
              placeholder="+91 98765 43210  or  +1 555 000 1234"
              className="w-full bg-[#2a2a2a] text-[#F8F5F0] text-sm px-4 py-3 rounded-2xl outline-none placeholder-[#5a5a5a]"
              style={ct.borderStyle} />
            {ct.err && <p className="text-red-400 text-xs mt-1 ml-1">{ct.err}</p>}
          </div>

          <div>
            <label className="text-[#8B6914] text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <span style={{ fontSize: 11 }}>💬</span>
              WhatsApp number
              <span className="text-[#5a5a5a] font-normal">&middot; optional</span>
            </label>
            <button type="button"
              onClick={() => {
                const next = !sameAsContact
                setSame(next)
                if (next) { setWhatsapp(contact); setErrors(ev => ({ ...ev, whatsapp: "" })) }
                else setWhatsapp("")
              }}
              className="flex items-center gap-2 mb-2 group">
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: sameAsContact ? "#2D5A3D" : "transparent",
                  border: sameAsContact ? "1.5px solid #2D5A3D" : "1.5px solid #5a5a5a",
                }}>
                {sameAsContact && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-[#9a9a9a] text-xs group-hover:text-[#F8F5F0] transition">Same as contact number</span>
            </button>
            <input type="tel" value={whatsapp}
              disabled={sameAsContact}
              onChange={e => { setWhatsapp(e.target.value); setErrors(ev => ({ ...ev, whatsapp: "" })) }}
              onBlur={wa.blur}
              placeholder="+91 98765 43210"
              className="w-full bg-[#2a2a2a] text-[#F8F5F0] text-sm px-4 py-3 rounded-2xl outline-none placeholder-[#5a5a5a]"
              style={{ ...wa.borderStyle, opacity: sameAsContact ? 0.45 : 1, cursor: sameAsContact ? "not-allowed" : "text" }} />
            {wa.err && <p className="text-red-400 text-xs mt-1 ml-1">{wa.err}</p>}
          </div>

        </div>
        <div className="w-full h-px bg-[#3a3a3a] my-4" />
        <p className="text-[#5a5a5a] text-xs text-center mb-4">
          ✦ Details used only for booking confirmation &amp; owner contact
        </p>
        <button onClick={handleConfirm}
          className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-sm hover:bg-[#8B6914] transition shadow-lg"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Confirm Guest Details →
        </button>
      </div>
    </div>
  )
}

// ── Shared summary rows used in both popups ───────────────────
function SummaryRows({ h, selectedRooms, checkIn, checkOut, guests, nights, showFee, scaledFee, guestDetails }) {
  const roomsSubtotal = selectedRooms.reduce((sum, r) => {
    const p = r.discountPrice ?? r.regularPrice
    return sum + p * nights
  }, 0)
  const feeToShow = scaledFee ?? h.platformFee
  return (
    <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 flex flex-col gap-2.5">
      <div className="flex justify-between items-start">
        <span className="text-[#9a9a9a] text-xs">Homestay</span>
        <span style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-[#F8F5F0] text-xs font-semibold text-right max-w-[55%]">{h.name}</span>
      </div>
      {guestDetails?.name && (
        <div className="flex justify-between">
          <span className="text-[#9a9a9a] text-xs">Guest</span>
          <span className="text-[#F8F5F0] text-xs font-medium">{guestDetails.name}</span>
        </div>
      )}
      {guestDetails?.contact && (
        <div className="flex justify-between">
          <span className="text-[#9a9a9a] text-xs">Contact</span>
          <span className="text-[#F8F5F0] text-xs">{guestDetails.contact}</span>
        </div>
      )}
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
              <span className="text-[#9a9a9a]">
                Platform fee {selectedRooms.length > 1 ? `(₹${h.platformFee} × ${selectedRooms.length} rooms)` : ""}
              </span>
              <span className="text-[#F8F5F0]">₹{feeToShow}</span>
            </div>
            <div className="flex justify-between text-xs italic">
              <span className="text-[#9a9a9a]">Pay at homestay</span>
              <span className="text-[#9a9a9a]">₹{Math.max(0, roomsSubtotal - feeToShow)}</span>
            </div>
            <div className="border-t border-[#8B6914]/30 pt-2 flex justify-between items-center">
              <span className="text-[#F8F5F0] text-sm font-semibold">Pay Now</span>
              <span style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[#8B6914] text-xl font-bold">₹{feeToShow}</span>
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
function BookingConfirmPopupFee({ h, selectedRooms, scaledFee, checkIn, checkOut, guests, nights, guestDetails, onClose, onPay }) {
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

        <SummaryRows h={h} selectedRooms={selectedRooms} scaledFee={scaledFee} checkIn={checkIn} checkOut={checkOut}
          guests={guests} nights={nights} showFee={true} guestDetails={guestDetails} />

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
          Proceed to Payment — ₹{scaledFee}
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
function BookingConfirmPopupDirect({ h, selectedRooms, checkIn, checkOut, guests, nights, guestDetails, onClose, onConfirm }) {
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
          guests={guests} nights={nights} showFee={false} guestDetails={guestDetails} />

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
export default function HomestayPage({ onLogoClick }) {
  const { currentUser, openLogin } = useAuth()
  const loggedIn = !!currentUser
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
  const [selectedRooms, setSelectedRooms] = useState([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showFeePopup, setShowFeePopup] = useState(false)
  const [showDirectPopup, setShowDirectPopup] = useState(false)
  const [showGuestPopup, setShowGuestPopup] = useState(false)
  const [pendingType, setPendingType] = useState(null)
  const [guestDetails, setGuestDetails] = useState(null)
  const [showNestEscapes, setShowNestEscapes] = useState(false)

  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const isWishlisted = (homestayId) => wishlist.some(item => item.id === homestayId)

  const toggleWishlist = (homestay) => {
    if (isWishlisted(homestay.id)) {
      removeFromWishlist(homestay.id)
    } else {
      addToWishlist(homestay)
    }
  }

  // Availability state
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [unavailableRoomIds, setUnavailableRoomIds] = useState(new Set())
  const [unavailableReason, setUnavailableReason] = useState(() => () => null)

  // Load availability on mount
  useEffect(() => {
    if (!h?.rooms) return
    setAvailabilityLoading(true)
    checkAndRestoreExpiredRooms()
    fetchRoomAvailability(h.id, h.rooms).then(result => {
      setUnavailableRoomIds(new Set(result.unavailable || []))
      setUnavailableReason(() => (room) => result.unavailableReasons?.[room.id] || "Unavailable")
      setAvailabilityLoading(false)
    }).catch(() => setAvailabilityLoading(false))
  }, [h?.id, h?.rooms])

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
    : 0

  const combinedMaxGuests = selectedRooms.reduce((sum, r) => sum + (r.maxGuests || 2), 0)

  // Platform fee logic — total for all selected rooms
  const scaledFee = selectedRooms.length > 0
    ? h.platformFee * selectedRooms.length
    : 0

  // Navigation helpers
  const prev = () => setImgIndex(i => (i === 0 ? h.images.length - 1 : i - 1))
  const next = () => setImgIndex(i => (i === h.images.length - 1 ? 0 : i + 1))

  // Room toggle
  const toggleRoom = (room) => {
    if (unavailableRoomIds.has(room.id)) return
    setSelectedRooms(prev => {
      const exists = prev.find(r => r.id === room.id)
      if (exists) return prev.filter(r => r.id !== room.id)
      return [...prev, room]
    })
  }

  // Booking flow
  const handleBookNow = () => {
    if (!loggedIn) {
      setShowLoginPrompt(true)
      return
    }
    if (!checkIn || !checkOut) {
      alert("Please select check-in and check-out dates first.")
      return
    }
    if (selectedRooms.length === 0) {
      alert("Please select at least one room.")
      return
    }
    if (guests > combinedMaxGuests) {
      alert(`Selected rooms can accommodate up to ${combinedMaxGuests} guests. Please reduce the number of guests.`)
      return
    }
    setShowGuestPopup(true)
    setPendingType(nights > 0 && hoursUntilCheckIn(checkIn) > 72 ? "fee" : "direct")
  }

  const handleGuestConfirmed = (details) => {
    setGuestDetails(details)
    setShowGuestPopup(false)
    if (pendingType === "fee") {
      setShowFeePopup(true)
    } else {
      setShowDirectPopup(true)
    }
    setPendingType(null)
  }

  // Finalize booking
  const finaliseBooking = async () => {
    if (!h || selectedRooms.length === 0 || !checkIn || !checkOut || !guestDetails) return null
    const bookingData = {
      homestayId: h.id,
      homestayName: h.name,
      rooms: selectedRooms.map(r => ({ id: r.id, name: r.name, price: r.discountPrice ?? r.regularPrice })),
      checkIn,
      checkOut,
      guests,
      nights,
      platformFee: scaledFee,
      totalAmount: selectedRooms.reduce((sum, r) => sum + (r.discountPrice ?? r.regularPrice) * nights, 0),
      guestDetails,
      createdAt: new Date().toISOString(),
      status: "confirmed",
    }
    const result = await confirmBookingInFirestore(bookingData)
    if (result?.bookingId) {
      // Clear selections after successful booking
      setSelectedRooms([])
      setCheckIn("")
      setCheckOut("")
      setGuests(1)
      setGuestDetails(null)
    }
    return result?.bookingId || null
  }

  // Phase 4: Razorpay onSuccess callback calls finaliseBooking() then redirects
  const handlePay = async () => {
    setShowFeePopup(false)
    // TODO Phase 4: open Razorpay, await payment success, then call finaliseBooking()
    const bookingId = await finaliseBooking()
    if (bookingId) {
      alert(`Booking confirmed! ID: ${bookingId}\n\nRazorpay integration coming in Phase 4.`)
    } else {
      alert("Booking saved locally but Firestore write failed. Check connection.")
    }
  }

  const handleDirectConfirm = async () => {
    setShowDirectPopup(false)
    const bookingId = await finaliseBooking()
    if (bookingId) {
      alert(`Booking confirmed! ID: ${bookingId}\nOwner details will be shared via SMS, Email & WhatsApp shortly.`)
    } else {
      alert("Booking saved but Firestore write failed. Check connection.")
    }
  }

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">
      <style>{`
        @keyframes datePulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(139,105,20,0.18); }
          50%       { box-shadow: 0 0 0 8px rgba(139,105,20,0.38); }
        }
      `}</style>
      <Navbar onLogoClick={onLogoClick} />

      {showGuestPopup && (
        <GuestDetailsPopup
          onClose={() => { setShowGuestPopup(false); setPendingType(null) }}
          onConfirm={handleGuestConfirmed}
        />
      )}

      {showLoginPrompt && <LoginPromptPopup onClose={() => { setShowLoginPrompt(false); openLogin() }} />}
      {showFeePopup && selectedRooms.length > 0 && (
        <BookingConfirmPopupFee h={h} selectedRooms={selectedRooms} scaledFee={scaledFee}
          checkIn={checkIn} checkOut={checkOut} guests={guests} nights={nights}
          guestDetails={guestDetails}
          onClose={() => setShowFeePopup(false)} onPay={handlePay} />
      )}
      {showDirectPopup && selectedRooms.length > 0 && (
        <BookingConfirmPopupDirect h={h} selectedRooms={selectedRooms}
          checkIn={checkIn} checkOut={checkOut} guests={guests} nights={nights}
          guestDetails={guestDetails}
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
        <div className="flex items-center justify-between mt-4 mb-6">
          <button onClick={() => navigate("/")}
            className="flex items-center gap-2 text-[#9a9a9a] hover:text-[#F8F5F0] transition text-sm">
            <ArrowLeft size={16} /> Back to Homestays
          </button>
          <button
            onClick={() => navigate("/", { state: { triggerLocation: true } })}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition font-medium"
            style={{ color: "#3B82F6", borderColor: "rgba(59,130,246,0.5)", background: "rgba(59,130,246,0.07)" }}>
            <MapPin size={12} />
            Detect &amp; View on Map
          </button>
        </div>

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

        {/* Room Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold">Choose Your Room</h2>
            {availabilityLoading && (
              <span className="text-xs text-[#9a9a9a] flex items-center gap-1">
                <span className="w-3 h-3 border border-[#9a9a9a] border-t-transparent rounded-full inline-block"
                  style={{ animation: "spin 0.8s linear infinite" }} />
                Checking availability...
              </span>
            )}
          </div>
          <p className="text-[#9a9a9a] text-xs mb-3">Tap to select · Tap again to deselect · Add multiple rooms for larger groups</p>
          <div className="flex flex-col gap-3">
            {h.rooms.map(room => {
              const isSelected    = !!selectedRooms.find(r => r.id === room.id)
              const isPrimary     = selectedRooms[0]?.id === room.id
              const isUnavailable = unavailableRoomIds.has(room.id)
              const reason        = isUnavailable ? unavailableReason(room) : null

              return (
                <div
                  key={room.id}
                  onClick={() => !isUnavailable && toggleRoom(room)}
                  className={`w-full text-left rounded-2xl p-4 border-2 transition ${
                    isUnavailable
                      ? "border-[#2a2a2a] bg-[#1e1e1e] cursor-not-allowed opacity-50"
                      : isSelected
                      ? "bg-[#2a2a2a] border-[#8B6914] cursor-pointer"
                      : "bg-[#2a2a2a] border-[#3a3a3a] hover:border-[#2D5A3D] cursor-pointer"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontFamily: "'Playfair Display', serif" }}
                          className={`font-semibold text-sm ${isUnavailable ? "text-[#5a5a5a]" : "text-[#F8F5F0]"}`}>
                          {room.name}
                        </p>
                        <span className={`text-xs flex items-center gap-1 ${isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]"}`}>
                          <Users size={10} /> Max {room.maxGuests}
                        </span>
                        {isUnavailable && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                            {reason}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]"}`}>
                        {room.description}
                      </p>
                      {room.id === "premium-1bhk" && !isUnavailable && (
                        <span className="text-xs text-[#8B6914] mt-1 inline-block">✦ Includes private balcony</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={`font-bold text-base ${isUnavailable ? "text-[#4a4a4a]" : "text-[#F8F5F0]"}`}>₹{room.discountPrice ?? room.regularPrice}</p>
                      <p className={`text-xs ${isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]"}`}>/ night</p>
                    </div>
                  </div>
                  {isSelected && !isUnavailable && (
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#8B6914]" />
                      <span className="text-[#8B6914] text-xs font-medium">
                        {isPrimary ? "Primary Room" : "Added"}
                      </span>
                    </div>
                  )}
                </div>
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

            {/* ── Date & Guest inputs ── */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="col-span-1">
                <label className="text-[#8B6914] text-xs font-medium mb-1 block">Check-in</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6914]" />
                  <input type="date" value={checkIn}
                    onChange={e => setCheckIn(e.target.value)}
                    className="w-full bg-[#1C1C1C] text-[#F8F5F0] text-xs pl-9 pr-2 py-2.5 rounded-xl border border-[#3a3a3a] outline-none"
                    style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div className="col-span-1">
                <label className="text-[#8B6914] text-xs font-medium mb-1 block">Check-out</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6914]" />
                  <input type="date" value={checkOut}
                    onChange={e => setCheckOut(e.target.value)}
                    min={checkIn}
                    className="w-full bg-[#1C1C1C] text-[#F8F5F0] text-xs pl-9 pr-2 py-2.5 rounded-xl border border-[#3a3a3a] outline-none"
                    style={{ colorScheme: "dark" }} />
                </div>
              </div>
              <div className="col-span-1">
                <label className="text-[#8B6914] text-xs font-medium mb-1 block">Guests</label>
                <div className="relative">
                  <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B6914]" />
                  <select value={guests}
                    onChange={e => setGuests(parseInt(e.target.value))}
                    className="w-full bg-[#1C1C1C] text-[#F8F5F0] text-xs pl-9 pr-2 py-2.5 rounded-xl border border-[#3a3a3a] outline-none appearance-none">
                    {[...Array(combinedMaxGuests)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "Guest" : "Guests"}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* ── Pricing breakdown ── */}
            {nights > 0 && (
              <div className="bg-[#1C1C1C] rounded-2xl p-3 mb-4 border border-[#3a3a3a]">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9a9a9a]">
                    {selectedRooms.map(r => r.name).join(" + ")} × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="text-[#F8F5F0]">
                    ₹{selectedRooms.reduce((sum, r) => sum + (r.discountPrice ?? r.regularPrice) * nights, 0)}
                  </span>
                </div>
                {hoursUntilCheckIn(checkIn) <= 72 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#2D5A3D]">Platform fee</span>
                    <span className="text-[#2D5A3D]">₹0</span>
                  </div>
                )}
                {hoursUntilCheckIn(checkIn) > 72 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8B6914]">Platform fee</span>
                    <span className="text-[#8B6914]">₹{scaledFee}</span>
                  </div>
                )}
                <div className="border-t border-[#3a3a3a] mt-2 pt-2 flex justify-between items-center">
                  <span className="text-[#F8F5F0] text-sm font-semibold">Total to Pay Now</span>
                  <span style={{ fontFamily: "'Playfair Display', serif" }}
                    className={`text-xl font-bold ${hoursUntilCheckIn(checkIn) <= 72 ? "text-[#2D5A3D]" : "text-[#8B6914]"}`}>
                    ₹{hoursUntilCheckIn(checkIn) <= 72 ? 0 : scaledFee}
                  </span>
                </div>
                {nights > 0 && (
                  <div className="mt-2 pt-2 border-t border-[#3a3a3a] flex justify-between text-xs">
                    <span className="text-[#9a9a9a]">Pay at homestay</span>
                    <span className="text-[#9a9a9a]">
                      ₹{Math.max(0, selectedRooms.reduce((sum, r) => sum + (r.discountPrice ?? r.regularPrice) * nights, 0) - scaledFee)}
                    </span>
                  </div>
                )}
                {hoursUntilCheckIn(checkIn) > 72 && hoursUntilCheckIn(checkIn) <= 168 && (
                  <p className="text-[#8B6914] text-xs mt-2 italic">✦ 50% off — booked 3-7 days ahead</p>
                )}
                {hoursUntilCheckIn(checkIn) > 168 && (
                  <p className="text-[#8B6914] text-xs mt-2 italic">✦ 30% off — booked more than 7 days ahead</p>
                )}
              </div>
            )}

            {nights <= 0 && selectedRooms.length > 0 && (
              <div className="bg-[#1C1C1C] rounded-2xl p-3 mb-4 border border-[#3a3a3a] text-center">
                <p className="text-[#9a9a9a] text-xs">Select check-in and check-out dates to see pricing</p>
              </div>
            )}

            {/* ── CTA ── */}
            <button onClick={handleBookNow}
              disabled={!checkIn || !checkOut || selectedRooms.length === 0 || guests > combinedMaxGuests}
              className={`w-full py-4 rounded-2xl font-semibold text-sm transition shadow-lg ${
                !checkIn || !checkOut || selectedRooms.length === 0 || guests > combinedMaxGuests
                  ? "bg-[#3a3a3a] text-[#5a5a5a] cursor-not-allowed"
                  : "bg-[#2D5A3D] text-white hover:bg-[#8B6914]"
              }`}
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {selectedRooms.length === 0 ? "Select a Room to Continue"
                : !checkIn || !checkOut ? "Select Dates to Continue"
                  : guests > combinedMaxGuests ? `Max ${combinedMaxGuests} guests`
                    : "Book Now"}
            </button>
          </div>
        )}

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Reviews */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold">Reviews</h2>
            <div className="flex items-center gap-1 bg-[#2a2a2a] px-3 py-1.5 rounded-xl border border-[#3a3a3a]">
              <Star size={13} className="text-[#8B6914] fill-[#8B6914]" />
              <span className="text-[#F8F5F0] text-sm font-semibold">{h.rating}</span>
              <span className="text-[#9a9a9a] text-xs">({h.reviews} reviews)</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {reviews.map((r, i) => (
              <div key={i} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#F8F5F0] font-medium text-sm">{r.name}</span>
                  <span className="text-[#9a9a9a] text-xs">{r.date}</span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={12}
                      className={j < r.rating ? "text-[#8B6914] fill-[#8B6914]" : "text-[#3a3a3a]"} />
                  ))}
                </div>
                <p className="text-[#9a9a9a] text-sm">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#3a3a3a] my-6" />

        {/* Nest Escapes */}
        <div className="mb-8">
          <h2 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-semibold mb-4">Nest Escapes ✦</h2>
          <div className="grid grid-cols-1 gap-3">
            {nestEscapes.map((item, i) => (
              <div key={i} className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-2xl p-4 flex items-start gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[#F8F5F0] font-medium text-sm">{item.title}</h3>
                    {item.tag && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.tag === "On Request" ? "bg-[#2D5A3D]/20 text-[#2D5A3D]" :
                        item.tag === "On Order" ? "bg-[#8B6914]/20 text-[#8B6914]" :
                        "bg-[#3a3a3a] text-[#9a9a9a]"
                      }`}>{item.tag}</span>
                    )}
                  </div>
                  <p className="text-[#9a9a9a] text-xs mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowNestEscapes(true)}
            className="w-full mt-3 text-[#8B6914] text-sm hover:underline">View all experiences →</button>
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
