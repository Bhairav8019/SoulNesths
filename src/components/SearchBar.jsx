import { Search, Calendar, Users, X } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { homestays } from "../data/homestays"

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)
  const [checkIn, setCheckIn] = useState("")
  const [checkOut, setCheckOut] = useState("")
  const [guests, setGuests] = useState("")
  const debounce = useRef(null)

  // Get today's date in ISO format
  const getTodayDate = () => new Date().toISOString().split("T")[0]

  // Calculate max guests from selected homestay or global max
  const getMaxGuests = () => {
    if (selectedSuggestion?.homestay) {
      const totalCapacity = selectedSuggestion.homestay.rooms.reduce(
        (sum, room) => sum + room.maxGuests,
        0
      )
      return Math.min(totalCapacity, 14)
    }
    return 14 // Global max
  }

  // Handle check-in date change with validation
  const handleCheckInChange = (value) => {
    const today = getTodayDate()
    if (value < today) return
    setCheckIn(value)
    if (checkOut && checkOut < value) {
      setCheckOut("")
    }
  }

  // Handle check-out date change with validation
  const handleCheckOutChange = (value) => {
    if (checkIn && value < checkIn) return
    if (!checkIn) {
      const today = getTodayDate()
      if (value <= today) return
    }
    setCheckOut(value)
  }

  const fetchSuggestions = async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return }

    const localMatches = homestays.filter(h =>
      h.name.toLowerCase().includes(q.toLowerCase()) ||
      h.location.toLowerCase().includes(q.toLowerCase())
    ).map(h => ({
      name: h.name,
      subtitle: h.location,
      lat: h.lat,
      lng: h.lng,
      isHomestay: true,
      homestay: h,
    }))

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&proximity=94.188933,26.768666&country=IN&limit=4`
      )
      const data = await res.json()
      const mapboxResults = (data.features || []).map(f => ({
        name: f.text,
        subtitle: f.place_name,
        lat: f.center[1],
        lng: f.center[0],
        isHomestay: false,
      }))

      setSuggestions([...localMatches, ...mapboxResults].slice(0, 6))
    } catch {
      setSuggestions(localMatches)
    }
  }

  const handleInput = (e) => {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => fetchSuggestions(val), 300)
  }

  const handleSelect = (s) => {
    setQuery(s.name)
    setSelectedSuggestion(s)
    setSuggestions([])
    // Reset guests if exceeds new homestay's capacity
    if (guests && parseInt(guests) > getMaxGuests()) {
      setGuests("")
    }
  }

  const handleGuestChange = (e) => {
    const val = e.target.value
    if (!val) {
      setGuests("")
      return
    }
    const numVal = parseInt(val)
    if (numVal <= getMaxGuests()) {
      setGuests(val)
    }
  }

  const handleSearch = () => {
    if (selectedSuggestion) {
      onSearch({
        query: selectedSuggestion.name,
        coords: { lat: selectedSuggestion.lat, lng: selectedSuggestion.lng },
        checkIn,
        checkOut,
        guests,
        homestay: selectedSuggestion.homestay || null,
      })
    } else if (suggestions.length > 0) {
      const s = suggestions[0]
      onSearch({
        query: s.name,
        coords: { lat: s.lat, lng: s.lng },
        checkIn,
        checkOut,
        guests,
        homestay: s.homestay || null,
      })
    }
  }

  const maxGuests = getMaxGuests()

  return (
    <div className="w-full max-w-3xl mx-auto px-4 relative">
      <div className="flex flex-col md:flex-row items-stretch md:items-center bg-[#2a2a2a] rounded-2xl shadow-md border border-[#3a3a3a] overflow-visible">

        {/* Location input */}
        <div className="flex items-center gap-2 px-4 py-3 flex-1 border-b md:border-b-0 md:border-r border-[#3a3a3a] relative">
          <Search size={16} className="text-[#8B6914] flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search location or homestay..."
            className="outline-none text-sm text-[#F8F5F0] placeholder-[#555] bg-transparent w-full"
          />
          {query.length > 0 && (
            <button onClick={() => { setQuery(""); setSuggestions([]); setSelectedSuggestion(null) }}>
              <X size={14} className="text-[#555] hover:text-[#F8F5F0]" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-[#3a3a3a]">
          <Calendar size={16} className="text-[#8B6914]" />
          <input type="date" value={checkIn}
            onChange={e => handleCheckInChange(e.target.value)}
            min={new Date().toISOString().split("T")[0]}
            className="outline-none text-sm text-[#9a9a9a] bg-transparent" />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-b md:border-b-0 md:border-r border-[#3a3a3a]">
          <Calendar size={16} className="text-[#8B6914]" />
          <input type="date" value={checkOut}
            onChange={e => handleCheckOutChange(e.target.value)}
            min={checkIn || new Date().toISOString().split("T")[0]}
            className="outline-none text-sm text-[#9a9a9a] bg-transparent" />
        </div>

        <div className="flex items-center gap-2 px-4 py-3 md:border-r border-[#3a3a3a]">
          <Users size={16} className="text-[#8B6914]" />
          <input type="number" min="1" max={maxGuests} value={guests}
            onChange={handleGuestChange}
            placeholder="Guests"
            className="outline-none text-sm text-[#F8F5F0] placeholder-[#555] bg-transparent w-16" />
          <span className="text-xs text-[#9a9a9a]">/ {maxGuests}</span>
        </div>

        <button onClick={handleSearch}
          className="bg-[#2D5A3D] text-white px-6 py-3 text-sm font-medium hover:bg-[#8B6914] transition rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
          Search
        </button>
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-[#1C1C1C] border border-[#3a3a3a] rounded-2xl overflow-hidden shadow-2xl z-50">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => handleSelect(s)}
              className="w-full text-left px-4 py-3 hover:bg-[#2a2a2a] transition border-b border-[#2a2a2a] last:border-0 flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${s.isHomestay ? "bg-[#2D5A3D]" : "bg-[#2a2a2a] border border-[#3a3a3a]"}`}>
                <span className="text-xs">{s.isHomestay ? "🏠" : "📍"}</span>
              </div>
              <div className="min-w-0">
                <p className="text-[#F8F5F0] text-sm font-medium truncate"
                  style={{ fontFamily: s.isHomestay ? "'Playfair Display', serif" : "inherit" }}>
                  {s.name}
                </p>
                <p className="text-[#9a9a9a] text-xs truncate">{s.subtitle}</p>
              </div>
              {s.isHomestay && (
                <span className="text-xs text-[#8B6914] border border-[#8B6914]/30 px-2 py-0.5 rounded-full flex-shrink-0">
                  Featured
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}