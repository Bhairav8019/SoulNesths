import { Heart, User } from "lucide-react"
import { useState } from "react"

export default function Navbar({ onWishlist }) {
  const [userOpen, setUserOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#F8F5F0] border-b border-[#e0d9d0] px-6 py-4 flex items-center justify-between">
      <h1 style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-[#1C1C1C] text-xl font-semibold tracking-wide">
        Soul Nest Homestays
      </h1>
      <div className="flex items-center gap-4 relative">
        <button onClick={onWishlist}
          className="flex items-center gap-1 text-[#4A4A4A] hover:text-red-500 transition text-sm">
          <Heart size={18} /> Wishlist
        </button>
        <button onClick={() => setUserOpen(!userOpen)}
          className="w-9 h-9 rounded-full bg-[#2D5A3D] flex items-center justify-center text-white hover:bg-[#8B6914] transition">
          <User size={16} />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-12 bg-white shadow-lg rounded-xl w-40 overflow-hidden border border-[#e0d9d0]">
            <button className="w-full text-left px-4 py-3 text-sm text-[#1C1C1C] hover:bg-[#F8F5F0] transition">
              Bookings
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[#F8F5F0] transition">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}