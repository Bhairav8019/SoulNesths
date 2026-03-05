import { useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronUp, ChevronDown } from "lucide-react"
import Navbar from "../components/navbar"
import SearchBar from "../components/SearchBar"
import MapSection from "../components/MapSection"
import HomestayList from "../components/HomestayList"

export default function HomePage({ onLogoClick }) {
  const navigate = useNavigate()
  const topRef = useRef(null)
  const bottomRef = useRef(null)

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">
      <div ref={topRef} />
      <Navbar onWishlist={() => {}} onLogoClick={onLogoClick} />
      <div className="pt-20 flex flex-col gap-6">
        <div className="pt-4">
          <SearchBar />
        </div>
        <MapSection onSelectHomestay={(h) => navigate(`/homestay/${h.id}`)} />
      </div>
      <div
        style={{
          borderRadius: "28px 28px 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.5), 0 -4px 12px rgba(45,90,61,0.15)",
          transform: "translateZ(0)",
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