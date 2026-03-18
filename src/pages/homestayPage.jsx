import { useState, useEffect, useRef } from "react"
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
  resolveRoomKey,
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
  "Check-in: 11:00 PM | Check-out: 11:00 AM",
  "No illegal activities; use of drugs, illegal substances, or any unlawful activity is strictly prohibited on the premises",
  "Guests must carry a valid government ID at check-in and should not be less than 21 years of age. Minors must be accompanied by a guardian at all times",
  "Parties or loud music after 10:00 PM - 07:00 AM is not permitted",
  "Guests are responsible for any damage to the property during their stay.",
  "Visitors are not allowed without prior permission from the host",
  "Full refund on platform fee if cancelled 48 hrs before check-in (00:00)",
  "The homestay reserves the right to deny entry if rules are violated",
]

const reviews = [
  { name: "Arjun M.", rating: 5, date: "Feb 2026", comment: "Absolutely stunning stay. The Premium 1 BHK was immaculate — felt like a luxury apartment. Will definitely return." },
  { name: "Bhairav G.", rating: 5, date: "Mar 2026", comment: "Perfect couple getaway. Very private, clean and the host was incredibly welcoming. Loved the kitchen!" },
  { name: "Rohit D.", rating: 4, date: "Dec 2025", comment: "Great location, cozy rooms and excellent WiFi. The balcony view in the 1 BHK is a bonus." },
]

const nestEscapes = [
  { image: "/hangout.jpg", title: "Hangout", desc: "Hangout with us & Explore Jorhat and beyond.", tag: "On Request" },
  { image: "/chefondemand.jpg", title: "Chef on Demand", desc: "Authentic Assamese cuisine and regional delicacies prepared fresh and delivered to your room.", tag: "On Order" },
  { image: "/orchestraanddj.jpg", title: "Orchestra & DJ", desc: "Premium live entertainment with curated music performances and DJ nights for special evenings.", tag: "On Request" },
]

const nestEscapeDetails = {
  "Hangout": {
    title: "Hangout",
    message: "Explore Jorhat and beyond at your own pace with our self-drive and chauffeur options. Perfect for couples and small groups.",
    cta: "To know more, first log in. Then, after your successful booking, check the Bookings section in your user profile for available options and pricing.",
  },
  "Chef on Demand": {
    title: "Chef on Demand",
    message: "Savor authentic Assamese cuisine and regional delicacies prepared fresh and delivered to your room. Available for breakfast, lunch, dinner, or special occasions.",
    cta: "To know more, first log in. Then, after your successful booking, check the Bookings section in your user profile to browse menus and place orders.",
  },
  "Orchestra & DJ": {
    title: "Orchestra & DJ",
    message: "Experience premium live entertainment with curated music performances and DJ nights. Perfect for celebrations and special evenings at Soul Nest.",
    cta: "To know more, first log in. Then, after your successful booking, check the Bookings section in your user profile to reserve your entertainment experience.",
  },
}

function hoursUntilCheckIn(checkInStr) {
  if (!checkInStr) return Infinity
  const checkInDate = new Date(checkInStr + "T00:00:00")
  return (checkInDate - new Date()) / 3600000
}

function validatePhone(raw) {
  const cleaned = raw.replace(/[\s\-().]/g, "")
  if (!cleaned) return false
  if (/^(\+91|91|0)?[6-9]\d{9}$/.test(cleaned)) return true
  if (/^\+\d{7,15}$/.test(cleaned)) return true
  return false
}

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
      {selectedRooms.map((r, i) => (
        <div key={r.id} className="flex justify-between">
          <span className="text-[#9a9a9a] text-xs">{i === 0 ? "Room" : "Room " + (i + 1)}</span>
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
                Platform fee {selectedRooms.length > 1 ? "(₹" + h.platformFee + " × " + selectedRooms.length + " rooms)" : ""}
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
          <div className={"flex items-center gap-1.5 " + timerColor + " bg-[#2a2a2a] border border-[#3a3a3a] px-3 py-1.5 rounded-full"}>
            <Timer size={13} />
            <span className="text-sm font-mono font-bold">{mins}:{secs}</span>
          </div>
        </div>
        <p className="text-[#9a9a9a] text-xs mb-4">
          Summary expires in <span className={"font-semibold " + timerColor}>{mins}:{secs}</span>. Complete payment before the timer runs out.
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
          ✦ Owner contact shared via SMS, Email &amp; WhatsApp after confirmation
        </p>
      </div>
    </div>
  )
}

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
          Booking confirmation and owner contact will be shared via SMS, Email &amp; WhatsApp immediately.
        </p>
        <button onClick={onConfirm}
          className="w-full text-white py-4 rounded-2xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2"
          style={{ fontFamily: "'Playfair Display', serif", background: "linear-gradient(135deg, #2D5A3D, #3a7a52)" }}>
          <CheckCircle2 size={16} />
          Confirm Booking — No Payment Required
        </button>
        <p className="text-center text-[#8B6914] text-xs mt-2 italic">
          ✦ Owner contact shared via SMS, Email &amp; WhatsApp after confirmation
        </p>
      </div>
    </div>
  )
}

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

  const [checkIn, setCheckIn]   = useState(parseSearchDate(searchData.checkIn) || "")
  const [checkOut, setCheckOut] = useState(parseSearchDate(searchData.checkOut) || "")
  const [guests, setGuests]     = useState(searchData.guests ? parseInt(searchData.guests) : 1)

  const hasSearchData = !!(checkIn || checkOut || (guests && guests > 1))
  const [selectedRooms, setSelectedRooms]     = useState([])
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [showFeePopup, setShowFeePopup]       = useState(false)
  const [showDirectPopup, setShowDirectPopup] = useState(false)
  const [showNestEscapes, setShowNestEscapes] = useState(false)
  const [selectedEscape, setSelectedEscape]   = useState(null)
  const { toggleWishlist, isWishlisted } = useWishlist()

  const [highlightDates, setHighlightDates] = useState(false)

  const [showGuestPopup, setShowGuestPopup]  = useState(false)
  const [pendingBookingType, setPendingType] = useState(null)
  const [guestDetails, setGuestDetails]      = useState(null)

  const [liveAvailability, setLiveAvailability]       = useState(new Map())
  const [availabilityLoading, setAvailabilityLoading] = useState(true)

  useEffect(() => {
    if (!h) return
    const roomIds = h.rooms.map(r => r.id)
    setAvailabilityLoading(true)
    ;(async () => {
      try {
        await checkAndRestoreExpiredRooms(h.id, roomIds)
        const availability = await fetchRoomAvailability(h.id, roomIds, checkIn || undefined, checkOut || undefined)
        setLiveAvailability(availability)
      } catch (err) {
        console.warn("Firestore unavailable, falling back to static room data:", err.message)
        const fallback = new Map()
        h.rooms.forEach(r => fallback.set(r.id, { booked: r.booked ?? false, checkOutDate: null, bookingId: null }))
        setLiveAvailability(fallback)
      } finally {
        setAvailabilityLoading(false)
      }
    })()
  }, [h?.id, checkIn, checkOut])

  useEffect(() => {
    if (checkIn && checkOut) setHighlightDates(false)
  }, [checkIn, checkOut])

  const primaryRoom        = selectedRooms[0] || null
  const combinedMaxGuests  = selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0)
  const atPropertyCap      = h ? selectedRooms.reduce((sum, r) => sum + r.maxGuests, 0) >= h.totalMaxGuests : false

  const unavailableRoomIds = new Set(
    h ? h.rooms
      .filter(r => {
        const key  = resolveRoomKey(r.id)
        const live = liveAvailability.get(key) ?? liveAvailability.get(r.id)
        const isBooked = live ? live.booked : (r.booked ?? false)
        if (isBooked) return true
        return selectedRooms.some(sel =>
          sel.id !== r.id && resolveRoomKey(sel.id) === resolveRoomKey(r.id)
        )
      })
      .map(r => r.id)
    : []
  )

  const unavailableReason = (room) => {
    const key  = resolveRoomKey(room.id)
    const live = liveAvailability.get(key) ?? liveAvailability.get(room.id)
    const isBooked = live ? live.booked : (room.booked ?? false)
    if (isBooked) {
      if (live?.nextAvailable) {
        const d = new Date(live.nextAvailable)
        const label = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        return "Booked · Available from " + label
      }
      return checkIn && checkOut ? "Unavailable for selected dates" : "Currently booked"
    }
    const aliasTwin = selectedRooms.find(
      sel => sel.id !== room.id && resolveRoomKey(sel.id) === resolveRoomKey(room.id)
    )
    if (aliasTwin) return "Same room as " + aliasTwin.name
    return "Unavailable"
  }

  const availableToAdd = h
    ? h.rooms.filter(r => !selectedRooms.find(s => s.id === r.id) && !unavailableRoomIds.has(r.id))
    : []

  const toggleRoom = (room) => {
    if (unavailableRoomIds.has(room.id)) return
    setSelectedRooms(prev => {
      const exists = prev.find(r => r.id === room.id)
      if (exists) {
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
    setHighlightDates(false)
    if (checkOut && checkOut < value) setCheckOut("")
    setSelectedRooms([])
  }

  const handleCheckOutChange = (value) => {
    if (checkIn && value < checkIn) return
    if (!checkIn && value <= getTodayDate()) return
    setCheckOut(value)
    setHighlightDates(false)
    setSelectedRooms([])
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

  const scaledFee = h.platformFee * selectedRooms.length

  const hrs         = hoursUntilCheckIn(checkIn)
  const isWithin72  = checkIn && hrs <= 72
  const isDirectMode = isWithin72 && selectedRooms.length === 1

  const handleReserve = () => {
    if (!loggedIn) { setShowLoginPrompt(true); return }
    if (!checkIn || !checkOut) {
      setHighlightDates(true)
      document.getElementById("booking-dates")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    setPendingType(isDirectMode ? "direct" : "fee")
    setShowGuestPopup(true)
  }

  const handleGuestConfirmed = (details) => {
    setGuestDetails(details)
    setShowGuestPopup(false)
    if (pendingBookingType === "direct") setShowDirectPopup(true)
    else setShowFeePopup(true)
  }

  const finaliseBooking = async () => {
    if (!checkIn || !checkOut) return
    try {
      const bookingId = await confirmBookingInFirestore({
        homestayId:  h.id,
        roomIds:     selectedRooms.map(r => resolveRoomKey(r.id)),
        checkIn,
        checkOut,
        guests,
        nights,
        totalAmount: subtotal,
        platformFee: scaledFee,
      })
      setLiveAvailability(prev => {
        const next = new Map(prev)
        selectedRooms.forEach(r => {
          const key = resolveRoomKey(r.id)
          next.set(key,  { booked: true, nextAvailable: checkOut, bookingId })
          next.set(r.id, { booked: true, nextAvailable: checkOut, bookingId })
        })
        return next
      })
      setSelectedRooms([])
      return bookingId
    } catch (err) {
      console.error("Firestore booking write failed:", err.message)
      return null
    }
  }

  const handlePay = async () => {
    setShowFeePopup(false)
    const bookingId = await finaliseBooking()
    if (bookingId) {
      alert("Booking confirmed! ID: " + bookingId + "\n\nRazorpay integration coming in Phase 4.")
    } else {
      alert("Booking saved locally but Firestore write failed. Check connection.")
    }
  }

  const handleDirectConfirm = async () => {
    setShowDirectPopup(false)
    const bookingId = await finaliseBooking()
    if (bookingId) {
      alert("Booking confirmed! ID: " + bookingId + "\nOwner details will be shared via SMS, Email & WhatsApp shortly.")
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
        @keyframes spin { to { transform: rotate(360deg); } }
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
      {showNestEscapes && selectedEscape && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
          <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center">
            <button onClick={() => { setShowNestEscapes(false); setSelectedEscape(null) }}
              className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
              <X size={18} />
            </button>
            <h3 style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-2xl font-bold mb-3">{selectedEscape.title}</h3>
            <p className="text-[#9a9a9a] text-sm mb-4 leading-relaxed">{selectedEscape.message}</p>
            <div className="bg-[#8B6914]/10 border border-[#8B6914]/30 rounded-xl px-4 py-3 mb-6">
              <p className="text-[#8B6914] text-xs font-semibold leading-relaxed">{selectedEscape.cta}</p>
            </div>
            <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#2D5A3D] to-[#8B6914] mx-auto mb-6" />
            <button onClick={() => { setShowNestEscapes(false); setSelectedEscape(null) }}
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

        {/* Gallery — thumbnail strip removed */}
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
                className={"h-2 rounded-full transition-all " + (i === imgIndex ? "bg-white w-4" : "bg-white/40 w-2")} />
            ))}
          </div>
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {imgIndex + 1} / {h.images.length}
          </div>
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
              className={"flex items-center gap-2 text-sm mt-2 " + (isWishlisted(h.id) ? "text-red-500" : "text-[#9a9a9a] hover:text-red-500") + " transition"}>
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
                {checkIn  && <div>📅 {new Date(checkIn).toLocaleDateString("en-IN",  { day: "2-digit", month: "short", year: "2-digit" })}</div>}
                {checkOut && <div>→ {new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}</div>}
                {guests > 1 && <div>👥 {guests} Guests</div>}
              </div>
            </div>
            <button onClick={() => { setCheckIn(""); setCheckOut(""); setGuests(1); setSelectedRooms([]) }}
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
          {checkIn && checkOut && (
            <p className="text-[#8B6914] text-xs mb-2 font-medium">
              ✦ Showing availability for {new Date(checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} → {new Date(checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
            </p>
          )}
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
                  className={"w-full text-left rounded-2xl p-4 border-2 transition " + (
                    isUnavailable
                      ? "border-[#2a2a2a] bg-[#1e1e1e] cursor-not-allowed opacity-50"
                      : isSelected
                      ? "bg-[#2a2a2a] border-[#8B6914] cursor-pointer"
                      : "bg-[#2a2a2a] border-[#3a3a3a] hover:border-[#2D5A3D] cursor-pointer"
                  )}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontFamily: "'Playfair Display', serif" }}
                          className={"font-semibold text-sm " + (isUnavailable ? "text-[#5a5a5a]" : "text-[#F8F5F0]")}>
                          {room.name}
                        </p>
                        <span className={"text-xs flex items-center gap-1 " + (isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]")}>
                          <Users size={10} /> Max {room.maxGuests}
                        </span>
                        {isUnavailable && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                            {reason}
                          </span>
                        )}
                      </div>
                      <p className={"text-xs mt-0.5 " + (isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]")}>
                        {room.description}
                      </p>
                      {room.id === "premium-1bhk" && !isUnavailable && (
                        <span className="text-xs text-[#8B6914] mt-1 inline-block">✦ Includes private balcony</span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className={"font-bold text-base " + (isUnavailable ? "text-[#4a4a4a]" : "text-[#F8F5F0]")}>
                        ₹{room.discountPrice ?? room.regularPrice}
                      </p>
                      <p className={"text-xs " + (isUnavailable ? "text-[#4a4a4a]" : "text-[#9a9a9a]")}>/ night</p>
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

        {/* BOOKING CARD */}
        {selectedRooms.length > 0 && (
          <div className="bg-[#2a2a2a] rounded-3xl border border-[#3a3a3a] p-5 shadow-xl mb-8">

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[#F8F5F0] text-base font-semibold">
                  {selectedRooms.length === 1 ? selectedRooms[0].name : selectedRooms.length + " Rooms Selected"}
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
            <div id="booking-dates" className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 transition-all duration-200"
                style={highlightDates && !checkIn
                  ? { border: "2px solid #8B6914", boxShadow: "0 0 0 4px rgba(139,105,20,0.18)", animation: "datePulse 0.9s ease-in-out 3" }
                  : { border: "1px solid #3a3a3a" }}>
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-in
                  {highlightDates && !checkIn && <span className="ml-1 font-bold animate-pulse">← required</span>}
                </p>
                <input type="date" value={checkIn}
                  onChange={e => handleCheckInChange(e.target.value)}
                  min={getTodayDate()}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
              <div className="bg-[#1C1C1C] rounded-2xl px-4 py-3 transition-all duration-200"
                style={highlightDates && !checkOut
                  ? { border: "2px solid #8B6914", boxShadow: "0 0 0 4px rgba(139,105,20,0.18)", animation: "datePulse 0.9s ease-in-out 3" }
                  : { border: "1px solid #3a3a3a" }}>
                <p className="text-[#8B6914] text-xs font-medium mb-1 flex items-center gap-1">
                  <Calendar size={11} /> Check-out
                  {highlightDates && !checkOut && <span className="ml-1 font-bold animate-pulse">← required</span>}
                </p>
                <input type="date" value={checkOut}
                  onChange={e => handleCheckOutChange(e.target.value)}
                  min={checkIn || getTodayDate()}
                  className="bg-transparent text-[#F8F5F0] text-sm outline-none w-full" />
              </div>
            </div>
            {highlightDates && (!checkIn || !checkOut) && (
              <div className="bg-[#8B6914]/10 border border-[#8B6914]/40 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
                <Calendar size={13} className="text-[#8B6914] flex-shrink-0" />
                <p className="text-[#8B6914] text-xs font-medium">Set both check-in and check-out dates to continue booking.</p>
              </div>
            )}

            {/* Guests */}
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
                <span className="text-[#9a9a9a] text-sm">{guests === 1 ? "1 guest" : guests + " guests"}</span>
              </div>
              <p className="text-[#9a9a9a] text-xs mt-2 italic">
                ✦ Max {combinedMaxGuests} guests across {selectedRooms.length} {selectedRooms.length === 1 ? "room" : "rooms"}
                {checkIn && checkOut ? " · " + nights + " " + (nights === 1 ? "night" : "nights") : ""}
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
                    <span className="text-[#9a9a9a]">
                      Platform fee{selectedRooms.length > 1 ? " (₹" + h.platformFee + " × " + selectedRooms.length + ")" : ""}
                    </span>
                    <span className="text-[#F8F5F0]">₹{scaledFee}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[#9a9a9a] italic">
                    <span>Remaining (pay at homestay)</span>
                    <span>₹{Math.max(0, subtotal - scaledFee)}</span>
                  </div>
                  <div className="border-t border-[#3a3a3a] pt-2 flex justify-between font-semibold">
                    <span className="text-[#F8F5F0]">Pay now</span>
                    <span style={{ fontFamily: "'Playfair Display', serif" }}
                      className="text-[#8B6914] text-lg">₹{scaledFee}</span>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
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
            ) : isWithin72 && selectedRooms.length > 1 ? (
              <>
                <div className="bg-[#2a1a0a] border border-[#8B6914]/40 rounded-xl px-3 py-2 mb-3">
                  <p className="text-[#8B6914] text-xs font-semibold">⚡ Last-minute · Multi-room booking</p>
                  <p className="text-[#9a9a9a] text-xs mt-0.5">
                    72hr waiver applies to single rooms only. Booking {selectedRooms.length} rooms requires a platform fee of ₹{scaledFee} (₹{h.platformFee} × {selectedRooms.length} rooms).
                  </p>
                </div>
                <button onClick={handleReserve}
                  className="w-full bg-[#8B6914] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#a07820] transition shadow-lg"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reserve Now — Pay ₹{scaledFee} to Confirm
                </button>
                <p className="text-center text-[#9a9a9a] text-xs mt-3">
                  Full refund if cancelled 48 hrs before check-in · Remaining amount paid at homestay
                </p>
              </>
            ) : (
              <>
                <button onClick={handleReserve}
                  className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#8B6914] transition shadow-lg"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  Reserve Now — Pay ₹{scaledFee} to Confirm
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
              <div key={i} onClick={() => { setSelectedEscape(nestEscapeDetails[e.title]); setShowNestEscapes(true) }}
                className="border border-[#3a3a3a] rounded-2xl overflow-hidden hover:border-[#8B6914] transition cursor-pointer"
                style={{ background: "transparent" }}>
                <div className="w-full h-48 flex items-center justify-center overflow-hidden"
                  style={{ background: "#1C1C1C" }}>
                  <img src={e.image} alt={e.title}
                    className="w-full h-full object-contain"
                    style={{ filter: "brightness(0.95) contrast(1.02)" }} />
                </div>
                <div className="px-4 py-3" style={{ background: "rgba(42,42,42,0.6)" }}>
                  <p style={{ fontFamily: "'Playfair Display', serif" }}
                    className="text-[#F8F5F0] font-semibold text-sm mb-1">{e.title}</p>
                  <p className="text-[#9a9a9a] text-xs mb-3">{e.desc}</p>
                  <span className="text-xs bg-[#1C1C1C] text-[#8B6914] border border-[#8B6914]/30 px-2 py-0.5 rounded-full">{e.tag}</span>
                </div>
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
            className="text-[#F8F5F0] text-lg font-semibold mb-4">House Rules &amp; Policies</h2>
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