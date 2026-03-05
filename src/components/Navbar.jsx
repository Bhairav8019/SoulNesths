import { Heart, User, LogIn, LogOut, CalendarCheck } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"


export default function Navbar({ onWishlist, onLogoClick }) {
  const [userOpen, setUserOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => { setLoggedIn(true); setUserOpen(false) }
  const handleLogout = () => { setLoggedIn(false); setUserOpen(false) }

  const handleLogo = () => {
    if (onLogoClick) { onLogoClick(); return }
    navigate("/")
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-[#1C1C1C] border-b border-[#2a2a2a] px-6 py-4 flex items-center justify-between">
      <h1
        onClick={handleLogo}
        style={{ fontFamily: "'Playfair Display', serif" }}
        className="text-[#F8F5F0] text-xl font-semibold tracking-wide cursor-pointer hover:text-[#8B6914] transition select-none">
        Soul Nest Homestays
      </h1>
      <div className="flex items-center gap-4 relative">
        <button onClick={onWishlist}
          className="flex items-center gap-1 text-[#9a9a9a] hover:text-red-500 transition text-sm">
          <Heart size={18} /> Wishlist
        </button>
        <button onClick={() => setUserOpen(!userOpen)}
          className={`w-9 h-9 rounded-full flex items-center justify-center text-white transition
            ${loggedIn ? "bg-[#2D5A3D] hover:bg-[#8B6914]" : "bg-[#3a3a3a] hover:bg-[#2D5A3D]"}`}>
          <User size={16} />
        </button>
        {userOpen && (
          <div className="absolute right-0 top-12 bg-[#2a2a2a] shadow-xl rounded-2xl w-44 overflow-hidden border border-[#3a3a3a]">
            {loggedIn ? (
              <>
                <button onClick={() => setUserOpen(false)}
                  className="w-full text-left px-4 py-3 text-sm text-[#F8F5F0] hover:bg-[#3a3a3a] transition flex items-center gap-2">
                  <CalendarCheck size={15} className="text-[#2D5A3D]" /> Bookings
                </button>
                <button onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-[#3a3a3a] transition flex items-center gap-2">
                  <LogOut size={15} /> Logout
                </button>
              </>
            ) : (
              <button onClick={handleLogin}
                className="w-full text-left px-4 py-3 text-sm text-[#F8F5F0] hover:bg-[#3a3a3a] transition flex items-center gap-2">
                <LogIn size={15} className="text-[#2D5A3D]" /> Login
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}