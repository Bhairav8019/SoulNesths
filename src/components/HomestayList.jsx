import { Heart, Star, PhoneCall, Info } from "lucide-react"
import { homestays } from "../data/homestays"

function sortHomestays(list) {
  const ours = list.filter(h => h.isOurs && h.available)
  const oursBooked = list.filter(h => h.isOurs && !h.available)
  const others = list.filter(h => !h.isOurs)
    .sort((a, b) => b.rating - a.rating)
  return ours.length > 0 ? [...ours, ...others] : [...oursBooked, ...others]
}

export default function HomestayList({ onSelectHomestay }) {
  const sorted = sortHomestays(homestays)

  return (
    <div className="w-full px-4 pb-8">
      <div className="max-w-3xl mx-auto">
        <p style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-[#1C1C1C] text-lg font-semibold mb-4">
          Homestays in Jorhat
        </p>
        <div className="flex flex-col gap-3">
          {sorted.map(h => (
            <button key={h.id} onClick={() => onSelectHomestay(h)}
              className="flex items-center gap-4 bg-white rounded-2xl p-3 shadow-sm border border-[#e0d9d0] hover:border-[#8B6914] transition text-left">
              <img src={h.image} alt={h.name}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p style={{ fontFamily: "'Playfair Display', serif" }}
                    className="font-semibold text-[#1C1C1C] text-sm truncate">
                    {h.name}
                  </p>
                  {h.isOurs && (
                    <span className="text-xs bg-[#2D5A3D] text-white px-2 py-0.5 rounded-full flex-shrink-0">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A4A4A] mt-0.5">{h.location}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star size={11} className="text-[#8B6914] fill-[#8B6914]" />
                  <span className="text-xs text-[#1C1C1C] font-medium">{h.rating}</span>
                  <span className="text-xs text-[#4A4A4A]">({h.reviews} reviews)</span>
                </div>
                <p className="text-sm font-semibold text-[#2D5A3D] mt-1">
                  ₹{h.price} <span className="text-xs font-normal text-[#4A4A4A]">/ night</span>
                </p>
              </div>
              <Heart size={18} className="text-[#e0d9d0] hover:text-red-500 transition flex-shrink-0" />
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-6">
          <button className="flex-1 flex items-center justify-center gap-2 border border-[#2D5A3D] text-[#2D5A3D] rounded-xl py-3 text-sm hover:bg-[#2D5A3D] hover:text-white transition">
            <PhoneCall size={15} /> Customer Support
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 border border-[#8B6914] text-[#8B6914] rounded-xl py-3 text-sm hover:bg-[#8B6914] hover:text-white transition">
            <Info size={15} /> About Us
          </button>
        </div>
      </div>
    </div>
  )
}