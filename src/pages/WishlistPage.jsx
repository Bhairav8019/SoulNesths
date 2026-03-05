import { useNavigate } from "react-router-dom"
import { useWishlist } from "../context/WishlistContext"
import { ArrowLeft, Star, MapPin, Heart } from "lucide-react"
import Navbar from "../components/Navbar"

export default function WishlistPage({ onLogoClick }) {
  const navigate = useNavigate()
  const { wishlist, toggleWishlist } = useWishlist()

  return (
    <div className="soul-bg min-h-screen bg-gradient-to-b from-[#1C1C1C] via-[#2C2C2C] to-[#1a1f1a]">
      <Navbar onWishlist={() => {}} onLogoClick={onLogoClick} />
      <div className="pt-20 max-w-3xl mx-auto px-4 pb-24">

        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#9a9a9a] hover:text-[#F8F5F0] transition mt-4 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Heart size={20} className="text-red-500 fill-red-500" />
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-2xl font-bold">
            Your Wishlist
          </h1>
          {wishlist.length > 0 && (
            <span className="text-xs bg-[#2D5A3D] text-white px-2 py-0.5 rounded-full">
              {wishlist.length}
            </span>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Heart size={48} className="text-[#3a3a3a]" />
            <p style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold">
              No saved homestays yet
            </p>
            <p className="text-[#9a9a9a] text-sm text-center">
              Tap the heart on any homestay to save it here
            </p>
            <button onClick={() => navigate("/")}
              className="mt-2 bg-[#2D5A3D] text-white px-6 py-3 rounded-2xl text-sm hover:bg-[#8B6914] transition"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Explore Homestays
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {wishlist.map(h => (
              <div key={h.id}
                className="flex items-center gap-4 bg-[#2a2a2a] rounded-2xl p-3 shadow-sm border border-[#3a3a3a] hover:border-[#8B6914] transition">
                <button onClick={() => navigate(`/homestay/${h.id}`)}
                  className="flex items-center gap-4 flex-1 text-left min-w-0">
                  <img src={h.image} alt={h.name}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p style={{ fontFamily: "'Playfair Display', serif" }}
                        className="font-semibold text-[#F8F5F0] text-sm truncate">
                        {h.name}
                      </p>
                      {h.isOurs && (
                        <span className="text-xs bg-[#2D5A3D] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={11} className="text-[#8B6914]" />
                      <p className="text-xs text-[#9a9a9a] truncate">{h.location}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={11} className="text-[#8B6914] fill-[#8B6914]" />
                      <span className="text-xs text-[#F8F5F0] font-medium">{h.rating}</span>
                      <span className="text-xs text-[#9a9a9a]">({h.reviews} reviews)</span>
                    </div>
                    <p className="text-sm font-semibold text-[#2D5A3D] mt-1">
                      From ₹{h.startingPrice}
                      <span className="text-xs font-normal text-[#9a9a9a]"> / night</span>
                    </p>
                  </div>
                </button>
                <button onClick={() => toggleWishlist(h)}
                  style={{ transition: "transform 0.2s ease" }}
                  className="flex-shrink-0 text-red-500 hover:scale-125 transition">
                  <Heart size={18} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}