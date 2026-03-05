import { useRef, useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import SearchBar from "../components/SearchBar"
import MapSection from "../components/MapSection"
import HomestayList from "../components/HomestayList"

export default function HomePage({ onLogoClick }) {
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()

  // 0 = name reveal,  1 = name fading,  2 = map zoom,  3 = done
  const [phase, setPhase] = useState(0)
  const [listVisible, setListVisible] = useState(false)
  const [triggerZoom, setTriggerZoom] = useState(false)

  useEffect(() => {
    // Timeline:
    // 0ms:    Name "Soul Nest Homestays" appears with luxury gold lines
    // 2200ms: Name begins fading out (phase 1)
    // 3200ms: Overlay gone, map revealed at India zoom (phase 2)
    // 3400ms: Map flyTo India → Jorhat begins (3s)
    // 6600ms: Homestay list slides up from bottom (phase 3)

    const t1 = setTimeout(() => setPhase(1), 2200)
    const t2 = setTimeout(() => setPhase(2), 3200)
    const t3 = setTimeout(() => setTriggerZoom(true), 3400)
    const t4 = setTimeout(() => {
      setListVisible(true)
      setPhase(3)
    }, 6600)
    
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">

      {/* Intro overlay — stays mounted, fades via opacity + pointer-events */}
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
        {/* Top gold line */}
        <div style={{
          width: phase === 0 ? "80px" : "0px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
          transition: "width 1.2s ease",
        }} />

        {/* Name */}
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

        {/* Tagline */}
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

        {/* Bottom gold line */}
        <div style={{
          width: phase === 0 ? "80px" : "0px",
          height: "1px",
          background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
          transition: "width 1.2s ease",
        }} />
      </div>

      <div ref={topRef} />
      <Navbar onWishlist={() => {}} onLogoClick={onLogoClick} />

      <div className="pt-20 flex flex-col gap-6">
        <div className="pt-4">
          <SearchBar />
        </div>

        {/* Map — always rendered at full size so Mapbox canvas works */}
        <MapSection 
          onSelectHomestay={(h) => navigate(`/homestay/${h.id}`)} 
          triggerZoom={triggerZoom}
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
        <HomestayList onSelectHomestay={(h) => navigate(`/homestay/${h.id}`)} />
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