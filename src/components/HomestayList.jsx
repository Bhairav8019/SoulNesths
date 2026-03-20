import { Heart, Star, PhoneCall, Info } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useWishlist } from "../context/WishlistContext"
import { homestays } from "../data/homestays"

function sortHomestays(list) {
  const ours       = list.filter(h => h.isOurs && h.available)
  const oursBooked = list.filter(h => h.isOurs && !h.available)
  const others     = list.filter(h => !h.isOurs).sort((a, b) => b.rating - a.rating)
  return ours.length > 0 ? [...ours, ...others] : [...oursBooked, ...others]
}

export default function HomestayList({
  onSelectHomestay,
  onSupportClick,
  searchCheckIn  = null,
  searchCheckOut = null,
  searchGuests   = null,
}) {
  const { toggleWishlist, isWishlisted } = useWishlist()
  const navigate = useNavigate()

  const getFilteredHomestays = () => {
    return homestays.filter(h => {
      if (searchGuests && searchGuests > 0) {
        const hasCapacity = h.rooms.some(room => room.maxGuests >= searchGuests)
        if (!hasCapacity) return false
      }
      return true
    })
  }

  const filtered = getFilteredHomestays()
  const sorted   = sortHomestays(filtered)

  return (
    <div className="w-full px-4 pb-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline gap-3 mb-4">
          <p style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[#F8F5F0] text-lg font-semibold">
            {searchGuests
              ? "Homestays for " + searchGuests + " Guest" + (searchGuests !== 1 ? "s" : "")
              : "Homestays in Jorhat"}
          </p>
          {searchGuests && (
            <span className="text-xs text-[#8B6914]">{sorted.length} available</span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {sorted.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#9a9a9a] text-sm">
                {searchGuests
                  ? "No homestays available for " + searchGuests + " guest" + (searchGuests !== 1 ? "s" : "")
                  : "No homestays found"}
              </p>
              <p className="text-xs text-[#555] mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            sorted.map(h => (
              <button key={h.id} onClick={() => onSelectHomestay(h)}
                className="flex items-center gap-4 bg-[#2a2a2a] rounded-2xl p-3 shadow-sm border border-[#3a3a3a] hover:border-[#8B6914] transition text-left w-full">
                <img src={h.image} alt={h.name}
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p style={{ fontFamily: "'Playfair Display', serif" }}
                      className="font-semibold text-[#F8F5F0] text-sm truncate">{h.name}</p>
                    {h.isOurs && (
                      <span className="text-xs bg-[#2D5A3D] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#9a9a9a] mt-0.5">{h.location}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={11} className="text-[#8B6914] fill-[#8B6914]" />
                    <span className="text-xs text-[#F8F5F0] font-medium">{h.rating}</span>
                    <span className="text-xs text-[#9a9a9a]">({h.reviews} reviews)</span>
                  </div>
                  <p className="text-sm font-semibold text-[#2D5A3D] mt-1">
                    From &#8377;{h.startingPrice}
                    <span className="text-xs font-normal text-[#9a9a9a]"> / night</span>
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleWishlist(h) }}
                  style={{ transition: "transform 0.2s ease, color 0.2s ease" }}
                  className={"flex-shrink-0 " + (isWishlisted(h.id) ? "text-red-500 scale-125" : "text-[#555]") + " hover:text-red-500"}>
                  <Heart size={18} fill={isWishlisted(h.id) ? "currentColor" : "none"} />
                </button>
              </button>
            ))
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onSupportClick && onSupportClick()}
            className="flex-1 flex items-center justify-center gap-2 border border-[#2D5A3D] text-[#2D5A3D] rounded-xl py-3 text-sm hover:bg-[#2D5A3D] hover:text-white transition">
            <PhoneCall size={15} /> Customer Support
          </button>
          <button
            onClick={() => navigate("/about")}
            className="flex-1 flex items-center justify-center gap-2 border border-[#8B6914] text-[#8B6914] rounded-xl py-3 text-sm hover:bg-[#8B6914] hover:text-white transition">
            <Info size={15} /> About Us
          </button>
        </div>
      </div>
    </div>
  )
}