import { Search, Calendar, Users } from "lucide-react"

export default function SearchBar() {
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="flex flex-col md:flex-row items-stretch md:items-center bg-white rounded-2xl shadow-md border border-[#e0d9d0] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 flex-1 border-b md:border-b-0 md:border-r border-[#e0d9d0]">
          <Search size={16} className="text-[#8B6914]" />
          <input type="text" placeholder="Search location or homestay..."
            className="outline-none text-sm text-[#1C1C1C] placeholder-[#4A4A4A] bg-transparent w-full" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-[#e0d9d0]">
          <Calendar size={16} className="text-[#8B6914]" />
          <input type="date"
            className="outline-none text-sm text-[#4A4A4A] bg-transparent" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-[#e0d9d0]">
          <Calendar size={16} className="text-[#8B6914]" />
          <input type="date"
            className="outline-none text-sm text-[#4A4A4A] bg-transparent" />
        </div>
        <div className="flex items-center gap-2 px-4 py-3 md:border-r border-[#e0d9d0]">
          <Users size={16} className="text-[#8B6914]" />
          <input type="number" min="1" max="20" placeholder="Guests"
            className="outline-none text-sm text-[#1C1C1C] placeholder-[#4A4A4A] bg-transparent w-16" />
        </div>
        <button className="bg-[#2D5A3D] text-white px-6 py-3 text-sm font-medium hover:bg-[#8B6914] transition">
          Search
        </button>
      </div>
    </div>
  )
}