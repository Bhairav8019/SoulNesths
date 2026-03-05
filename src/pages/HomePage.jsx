import { useRef, useState, useEffect } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import SearchBar from "../components/SearchBar"
import MapSection from "../components/MapSection"
import HomestayList from "../components/HomestayList"
import IntroSequence from "../components/IntroSequence"

export default function HomePage({ onLogoClick }) {
  const topRef = useRef(null)
  const bottomRef = useRef(null)
  const navigate = useNavigate()
  const [introPlayed, setIntroPlayed] = useState(false)
  const [mapVisible, setMapVisible] = useState(false)
  const [listVisible, setListVisible] = useState(false)

  useEffect(() => {
    if (introPlayed) {
      // Map zooms in
      const t1 = setTimeout(() => setMapVisible(true), 100)
      // List slides up after map
      const t2 = setTimeout(() => setListVisible(true), 600)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [introPlayed])

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">

      {!introPlayed && <IntroSequence onDone={() => setIntroPlayed(true)} />}

      <div ref={topRef} />
      <Navbar onWishlist={() => {}} onLogoClick={onLogoClick} />

      <div className="pt-20 flex flex-col gap-6">
        <div className="pt-4">
          <SearchBar />
        </div>

        {/* Map with zoom-in animation */}
        <div
          style={{
            opacity: mapVisible ? 1 : 0,
            transform: mapVisible ? "scale(1)" : "scale(0.92)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
          }}
        >
          <MapSection onSelectHomestay={(h) => navigate(`/homestay/${h.id}`)} />
        </div>
      </div>

      {/* 3D Sliding sheet with slide-up animation */}
      <div
        style={{
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.5), 0 -4px 12px rgba(45,90,61,0.15)",
          transform: listVisible ? "translateY(0)" : "translateY(120px)",
          opacity: listVisible ? 1 : 0,
          transition: "transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.7s ease",
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