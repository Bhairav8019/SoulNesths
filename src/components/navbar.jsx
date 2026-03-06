import { Heart, User, LogIn, LogOut, CalendarCheck, Images } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useWishlist } from "../context/WishlistContext"

export default function Navbar({ onLogoClick, loggedIn, onLogin, onLogout }) {
  const [userOpen, setUserOpen] = useState(false)
  const navigate = useNavigate()
  const { wishlist } = useWishlist()

  const hasWishlist = wishlist.length > 0

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#1C1C1C] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
      <h1
        onClick={() => { if (onLogoClick) onLogoClick(); else navigate("/") }}
        style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-[#F8F5F0] text-xl font-semibold tracking-wide cursor-pointer hover:text-[#8B6914] transition select-none">
        Soul Nest Homestays
      </h1>

      <div className="flex items-center gap-4 relative">

        {/* Wishlist button */}
        <button
          onClick={() => navigate("/wishlist")}
          style={{ transition: "color 0.3s ease, transform 0.2s ease" }}
          className={`flex items-center gap-1 text-sm transition ${hasWishlist ? "text-red-500 scale-110" : "text-[#9a9a9a] hover:text-red-500"}`}>
          <Heart size={18} fill={hasWishlist ? "currentColor" : "none"} />
          <span className="hidden md:inline">Wishlist</span>
          {hasWishlist && (
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {wishlist.length}
            </span>
          )}
        </button>

        {/* User button */}
        <button onClick={() => setUserOpen(!userOpen)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition
            ${loggedIn ? "bg-[#2D5A3D] hover:bg-[#8B6914]" : "bg-[#3a3a3a] hover:bg-[#2D5A3D]"}`}>
          <User size={16} />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-12 bg-[#2a2a2a] shadow-xl rounded-2xl w-48 overflow-hidden border border-[#3a3a3a]">

            {/* Login / Bookings — always shown */}
            {loggedIn ? (
              <button
                onClick={() => { navigate("/bookings"); setUserOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm text-[#F8F5F0] hover:bg-[#3a3a3a] transition flex items-center gap-2">
                <CalendarCheck size={15} className="text-[#2D5A3D]" /> Bookings
              </button>
            ) : (
              <button
                onClick={() => { if (onLogin) onLogin(); setUserOpen(false) }}
                className="w-full text-left px-4 py-3 text-sm text-[#F8F5F0] hover:bg-[#3a3a3a] transition flex items-center gap-2">
                <LogIn size={15} className="text-[#2D5A3D]" /> Login
              </button>
            )}

            {/* Divider */}
            <div className="h-px bg-[#3a3a3a] mx-3" />

            {/* Moments — visible to everyone */}
            <button
              onClick={() => { navigate("/moments"); setUserOpen(false) }}
              className="w-full text-left px-4 py-3 text-sm text-[#F8F5F0] hover:bg-[#3a3a3a] transition flex items-center gap-2">
              <Images size={15} className="text-[#8B6914]" />
              <span>Moments</span>
              <span className="ml-auto text-[10px] text-[#8B6914] border border-[#8B6914]/40 px-1.5 py-0.5 rounded-full tracking-wide">NEW</span>
            </button>

            {/* Divider + Logout (only when logged in) */}
            {loggedIn && (
              <>
                <div className="h-px bg-[#3a3a3a] mx-3" />
                <button
                  onClick={() => { if (onLogout) onLogout(); setUserOpen(false) }}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#3a3a3a] transition flex items-center gap-2">
                  <LogOut size={15} /> Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}