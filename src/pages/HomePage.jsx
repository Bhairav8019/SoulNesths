import { useRef, useState, useEffect, useCallback } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import SearchBar from "../components/SearchBar"
import MapSection from "../components/MapSection"
import HomestayList from "../components/HomestayList"
import { getActiveOffers } from "../data/adminConfig"

// ── Countdown helpers ─────────────────────────────────────────
function getTimeLeft(expiry) {
  const diff = new Date(expiry) - new Date()
  if (diff <= 0) return null
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s, diff }
}

function formatCountdown({ d, h, m, s }) {
  if (d > 0) return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`
  if (h > 0) return `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`
  return `${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`
}

const ACCENT = {
  gold: {
    bg: "linear-gradient(90deg, #1a1400, #1C1C1C, #1a1400)",
    border: "#8B6914",
    glow: "rgba(139,105,20,0.25)",
    label: "#8B6914",
    labelBg: "rgba(139,105,20,0.15)",
    timer: "#C8A84B",
    text: "#F8F5F0",
    sub: "#9a9a9a",
    dot: "#8B6914",
  },
  green: {
    bg: "linear-gradient(90deg, #001408, #1C1C1C, #001408)",
    border: "#2D5A3D",
    glow: "rgba(45,90,61,0.25)",
    label: "#2D5A3D",
    labelBg: "rgba(45,90,61,0.15)",
    timer: "#4a9e6a",
    text: "#F8F5F0",
    sub: "#9a9a9a",
    dot: "#2D5A3D",
  },
  red: {
    bg: "linear-gradient(90deg, #1a0000, #1C1C1C, #1a0000)",
    border: "#8B2020",
    glow: "rgba(139,32,32,0.25)",
    label: "#c0392b",
    labelBg: "rgba(139,32,32,0.15)",
    timer: "#e05555",
    text: "#F8F5F0",
    sub: "#9a9a9a",
    dot: "#c0392b",
  },
}

function OfferBanner({ offers }) {
  const [activeOffers, setActiveOffers] = useState(offers)
  const [current, setCurrent] = useState(0)
  const [countdowns, setCountdowns] = useState({})
  const [scrollX, setScrollX] = useState(0)
  const animRef = useRef(null)
  const scrollRef = useRef(0)

  // Tick countdowns every second, prune expired
  useEffect(() => {
    const tick = () => {
      const updated = {}
      const still = []
      activeOffers.forEach(o => {
        const tl = getTimeLeft(o.expiry)
        if (tl) { updated[o.id] = tl; still.push(o) }
      })
      setCountdowns(updated)
      if (still.length !== activeOffers.length) {
        setActiveOffers(still)
        setCurrent(c => Math.min(c, Math.max(0, still.length - 1)))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeOffers])

  // Auto-rotate between multiple offers every 5s
  useEffect(() => {
    if (activeOffers.length < 2) return
    const id = setInterval(() => setCurrent(c => (c + 1) % activeOffers.length), 5000)
    return () => clearInterval(id)
  }, [activeOffers.length])

  // Smooth marquee scroll for the offer text row
  useEffect(() => {
    const animate = () => {
      scrollRef.current = (scrollRef.current + 0.4) % 100
      setScrollX(scrollRef.current)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  if (activeOffers.length === 0) return null

  const offer = activeOffers[current]
  const tl = countdowns[offer?.id]
  const accent = ACCENT[offer?.color] || ACCENT.gold
  const isUrgent = tl && tl.d === 0 && tl.h < 2

  return (
    <div
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        borderRadius: "16px",
        boxShadow: `0 0 20px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.03)`,
        overflow: "hidden",
        position: "relative",
      }}
      className="mx-4 mb-1"
    >
      {/* Marquee strip — running text row */}
      <div style={{
        borderBottom: `1px solid ${accent.border}20`,
        padding: "5px 0",
        overflow: "hidden",
        whiteSpace: "nowrap",
      }}>
        <div style={{
          display: "inline-flex",
          gap: "48px",
          transform: `translateX(-${scrollX}%)`,
          willChange: "transform",
        }}>
          {[...Array(6)].map((_, i) => (
            <span key={i} style={{
              color: accent.label,
              fontSize: "9px",
              letterSpacing: "0.2em",
              fontFamily: "'Playfair Display', serif",
              textTransform: "uppercase",
              opacity: 0.7,
            }}>
              ✦ {offer.label} &nbsp;·&nbsp; {offer.text} &nbsp;·&nbsp; LIMITED TIME
            </span>
          ))}
        </div>
      </div>

      {/* Main offer row */}
      <div style={{ padding: "10px 14px 12px" }} className="flex items-center justify-between gap-3">

        {/* Left — label + text */}
        <div className="flex items-center gap-3 min-w-0">
          <span style={{
            background: accent.labelBg,
            border: `1px solid ${accent.border}`,
            color: accent.label,
            fontSize: "8px",
            fontFamily: "'Playfair Display', serif",
            letterSpacing: "0.15em",
            padding: "3px 7px",
            borderRadius: "20px",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {offer.label}
          </span>
          <div className="min-w-0">
            <p style={{
              fontFamily: "'Playfair Display', serif",
              color: accent.text,
              fontSize: "13px",
              fontWeight: 700,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {offer.text}
            </p>
            <p style={{
              color: accent.sub,
              fontSize: "10px",
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {offer.sub}
            </p>
          </div>
        </div>

        {/* Right — countdown timer */}
        {tl && (
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <p style={{
              color: accent.sub,
              fontSize: "8px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}>
              Ends in
            </p>
            <p style={{
              fontFamily: "'Courier New', monospace",
              color: isUrgent ? "#e05555" : accent.timer,
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              animation: isUrgent ? "pulse 1s ease-in-out infinite" : "none",
            }}>
              {formatCountdown(tl)}
            </p>
          </div>
        )}
      </div>

      {/* Multi-offer dots */}
      {activeOffers.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-2">
          {activeOffers.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? "16px" : "5px",
                height: "5px",
                borderRadius: "9999px",
                background: i === current ? accent.dot : "#3a3a3a",
                transition: "all 0.3s ease",
                border: "none",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default function HomePage({ onLogoClick, loggedIn, onLogin, onLogout }) {
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()
  const routerLocation = useLocation()

  const [phase, setPhase] = useState(0)
  const [listVisible, setListVisible] = useState(false)
  const [triggerZoom, setTriggerZoom] = useState(false)
  const [searchCoords, setSearchCoords] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchCheckIn, setSearchCheckIn] = useState(null)
  const [searchCheckOut, setSearchCheckOut] = useState(null)
  const [searchGuests, setSearchGuests] = useState(null)

  // If user navigated here from HomestayPage with triggerLocation flag, auto-enable location
  const autoTriggerLocation = !!(routerLocation.state?.triggerLocation)

  // Load active offers once on mount
  const [activeOffers] = useState(() => getActiveOffers())

  const handleSearch = ({ query, coords, homestay, checkIn, checkOut, guests }) => {
    setSearchQuery(query)
    setSearchCoords(coords)
    setSearchCheckIn(checkIn || null)
    setSearchCheckOut(checkOut || null)
    setSearchGuests(guests ? parseInt(guests) : null)
    if (homestay) {
      navigate(`/homestay/${homestay.id}`, {
        state: {
          searchData: {
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            guests: guests ? parseInt(guests) : null
          }
        }
      })
    }
  }

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2200)
    const t2 = setTimeout(() => setPhase(2), 3200)
    const t3 = setTimeout(() => setTriggerZoom(true), 3400)
    const t4 = setTimeout(() => { setListVisible(true); setPhase(3) }, 6600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">

      {/* Intro overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          background: "linear-gradient(160deg, #1C1C1C 0%, #1a1f1a 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          opacity: phase >= 2 ? 0 : 1,
          pointerEvents: phase >= 2 ? "none" : "auto",
          transition: "opacity 1s ease",
        }}
      >
        <div style={{
          width: phase === 0 ? "80px" : "0px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
          transition: "width 1.2s ease",
        }} />
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            opacity: phase === 0 ? 1 : 0,
            transform: phase === 0 ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.96)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
            transitionDelay: "0.2s",
            letterSpacing: "0.12em",
            fontSize: "clamp(18px, 5vw, 28px)",
            whiteSpace: "nowrap",
          }}
          className="text-[#F8F5F0] font-semibold text-center px-6"
        >
          Soul Nest Homestays
        </h1>
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            opacity: phase === 0 ? 0.6 : 0,
            transition: "opacity 0.9s ease",
            transitionDelay: "0.5s",
            letterSpacing: "0.3em",
            fontSize: "9px",
          }}
          className="text-[#8B6914] uppercase"
        >
          Jorhat · Assam · India
        </p>
        <div style={{
          width: phase === 0 ? "80px" : "0px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
          transition: "width 1.2s ease",
        }} />
      </div>

      <div ref={topRef} />
      <Navbar onLogoClick={onLogoClick} loggedIn={loggedIn} onLogin={onLogin} onLogout={onLogout} />

      <div className="pt-20 flex flex-col gap-4">

        {/* ── OFFER BANNER — above search bar ── */}
        {activeOffers.length > 0 && (
          <div className="pt-4">
            <OfferBanner offers={activeOffers} />
          </div>
        )}

        {/* Search bar */}
        <div className={activeOffers.length > 0 ? "" : "pt-4"}>
          <SearchBar onSearch={handleSearch} />
        </div>

        {/* Map */}
        <MapSection
          onSelectHomestay={(h) => navigate(`/homestay/${h.id}`, {
            state: { searchData: { checkIn: searchCheckIn, checkOut: searchCheckOut, guests: searchGuests } }
          })}
          searchQuery={searchQuery}
          searchCoords={searchCoords}
          triggerZoom={triggerZoom}
          searchCheckIn={searchCheckIn}
          searchCheckOut={searchCheckOut}
          searchGuests={searchGuests}
          autoTriggerLocation={autoTriggerLocation}
        />
      </div>

      {/* Sliding sheet */}
      <div
        style={{
          borderRadius: "28px 28px 0 0",
          boxShadow: listVisible ? "0 -12px 40px rgba(0,0,0,0.5), 0 -4px 12px rgba(45,90,61,0.15)" : "none",
          transform: listVisible ? "translateY(0)" : "translateY(100%)",
          opacity: listVisible ? 1 : 0,
          transition: "transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease",
          background: "linear-gradient(160deg, #232323 0%, #1a1f1a 100%)",
        }}
        className="relative z-10 mt-[-18px] pb-28 min-h-[60vh]"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#8B6914] opacity-60" />
        </div>
        <HomestayList
          onSelectHomestay={(h) => navigate(`/homestay/${h.id}`, {
            state: { searchData: { checkIn: searchCheckIn, checkOut: searchCheckOut, guests: searchGuests } }
          })}
          searchCheckIn={searchCheckIn}
          searchCheckOut={searchCheckOut}
          searchGuests={searchGuests}
        />
      </div>

      <div ref={bottomRef} />

      <div className="fixed right-5 bottom-8 flex flex-col items-center gap-2 z-50">
        <button
          onClick={() => topRef.current.scrollIntoView({ behavior: "smooth" })}
          className="w-10 h-10 rounded-full bg-[#2D5A3D] text-white flex items-center justify-center shadow-lg hover:bg-[#8B6914] transition">
          <ChevronUp size={20} />
        </button>
        <button
          onClick={() => bottomRef.current.scrollIntoView({ behavior: "smooth" })}
          className="w-10 h-10 rounded-full bg-[#2D5A3D] text-white flex items-center justify-center shadow-lg hover:bg-[#8B6914] transition">
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  )
}