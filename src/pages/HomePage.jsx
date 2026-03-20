import { useRef, useState, useEffect } from "react"
import { ChevronUp, ChevronDown, Mic, MicOff, Phone } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import Navbar from "../components/Navbar"
import SearchBar from "../components/SearchBar"
import MapSection from "../components/MapSection"
import HomestayList from "../components/HomestayList"
import Vapi from "@vapi-ai/web"

const VAPI_PUBLIC_KEY  = "74f0be6a-463e-4621-843d-f8295691de93"
const VAPI_ASSISTANT_ID = "7669d267-cdfc-44a3-b77c-521da655106d"

// ── Vapi singleton — one instance for the whole page lifetime ──
let vapiInstance = null
function getVapi() {
  if (!vapiInstance) vapiInstance = new Vapi(VAPI_PUBLIC_KEY)
  return vapiInstance
}

// ── Animated mic rings ─────────────────────────────────────────
function PulseRings() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid rgba(45,90,61,0.6)",
          animation: "vapiPulse 1.8s ease-out infinite",
          animationDelay: i * 0.4 + "s",
          pointerEvents: "none",
        }} />
      ))}
    </>
  )
}

// ── Voice button component ─────────────────────────────────────
function VapiButton() {
  const [status, setStatus]     = useState("idle")   // idle | connecting | active | error
  const [volume, setVolume]     = useState(0)
  const [showTip, setShowTip]   = useState(false)
  const tipTimer = useRef(null)

  useEffect(() => {
    const vapi = getVapi()

    vapi.on("call-start",  () => setStatus("active"))
    vapi.on("call-end",    () => { setStatus("idle"); setVolume(0) })
    vapi.on("error",       () => setStatus("error"))
    vapi.on("volume-level", v => setVolume(v))

    // Show tooltip hint after 3s on first load
    tipTimer.current = setTimeout(() => setShowTip(true), 3000)
    const hideTip    = setTimeout(() => setShowTip(false), 8000)

    return () => {
      clearTimeout(tipTimer.current)
      clearTimeout(hideTip)
      vapi.removeAllListeners()
    }
  }, [])

  const handleClick = async () => {
    const vapi = getVapi()
    setShowTip(false)

    if (status === "active") {
      vapi.stop()
      return
    }
    if (status === "connecting") return

    setStatus("connecting")
    try {
      await vapi.start(VAPI_ASSISTANT_ID)
    } catch {
      setStatus("error")
      setTimeout(() => setStatus("idle"), 2000)
    }
  }

  const bgColor = status === "active"
    ? "#ef4444"
    : status === "connecting"
    ? "#8B6914"
    : status === "error"
    ? "#ef4444"
    : "#2D5A3D"

  const scale = status === "active" ? 1 + volume * 0.3 : 1

  const label = status === "active"
    ? "Tap to end call"
    : status === "connecting"
    ? "Connecting..."
    : status === "error"
    ? "Try again"
    : "24/7 Support"

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>

      {/* Tooltip */}
      {showTip && status === "idle" && (
        <div style={{
          position: "absolute", bottom: "100%", right: 0, marginBottom: 10,
          background: "#1C1C1C", border: "1px solid #3a3a3a",
          borderRadius: 12, padding: "8px 12px", whiteSpace: "nowrap",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          animation: "fadeInUp 0.3s ease",
        }}>
          <p style={{ color: "#F8F5F0", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>
            🎙️ Ask anything about Soul Nest
          </p>
          <p style={{ color: "#9a9a9a", fontSize: 11, margin: 0 }}>
            Rooms · Pricing · Check-in · Experiences
          </p>
          {/* Arrow */}
          <div style={{
            position: "absolute", bottom: -6, right: 16,
            width: 10, height: 10, background: "#1C1C1C",
            border: "1px solid #3a3a3a", borderTop: "none", borderLeft: "none",
            transform: "rotate(45deg)",
          }} />
        </div>
      )}

      {/* Main button */}
      <div style={{ position: "relative", width: 48, height: 48 }}>
        {status === "active" && <PulseRings />}
        <button
          onClick={handleClick}
          title={label}
          style={{
            position: "relative", zIndex: 1,
            width: 48, height: 48, borderRadius: "50%",
            background: bgColor,
            border: "none", cursor: status === "connecting" ? "wait" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: status === "active"
              ? "0 0 0 4px rgba(239,68,68,0.25), 0 4px 16px rgba(0,0,0,0.4)"
              : "0 4px 16px rgba(0,0,0,0.4)",
            transform: "scale(" + scale + ")",
            transition: "background 0.2s ease, box-shadow 0.2s ease",
          }}>
          {status === "active"
            ? <MicOff size={20} color="white" />
            : status === "connecting"
            ? <Phone size={18} color="white" style={{ animation: "spin 1s linear infinite" }} />
            : <Mic size={20} color="white" />
          }
        </button>
      </div>

      {/* Label */}
      <span style={{
        color: status === "active" ? "#ef4444" : status === "connecting" ? "#8B6914" : "#9a9a9a",
        fontSize: 9, fontWeight: 600, letterSpacing: "0.06em",
        whiteSpace: "nowrap", textTransform: "uppercase",
        transition: "color 0.2s ease",
      }}>{label}</span>
    </div>
  )
}

export default function HomePage({ onLogoClick }) {
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

  const autoTriggerLocation = !!(routerLocation.state?.triggerLocation)

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
            guests: guests ? parseInt(guests) : null,
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

      <style>{`
        @keyframes vapiPulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

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
      <Navbar onLogoClick={onLogoClick} />

      <div className="pt-20 flex flex-col gap-4">
        <div className="pt-4">
          <SearchBar onSearch={handleSearch} />
        </div>
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

      {/* Fixed bottom-right controls: scroll buttons + Vapi */}
      <div className="fixed right-5 bottom-8 flex flex-col items-center gap-2 z-50">

        {/* Vapi voice support button */}
        <VapiButton />

        {/* Divider */}
        <div style={{ width: 1, height: 12, background: "#3a3a3a" }} />

        {/* Scroll up */}
        <button
          onClick={() => topRef.current.scrollIntoView({ behavior: "smooth" })}
          className="w-10 h-10 rounded-full bg-[#2D5A3D] text-white flex items-center justify-center shadow-lg hover:bg-[#8B6914] transition">
          <ChevronUp size={20} />
        </button>

        {/* Scroll down */}
        <button
          onClick={() => bottomRef.current.scrollIntoView({ behavior: "smooth" })}
          className="w-10 h-10 rounded-full bg-[#2D5A3D] text-white flex items-center justify-center shadow-lg hover:bg-[#8B6914] transition">
          <ChevronDown size={20} />
        </button>
      </div>
    </div>
  )
}