import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"
import { Navigation } from "lucide-react"

mapboxgl.accessToken = "pk.eyJ1IjoiYmhhaXJhdjgwMTkiLCJhIjoiY21tYndveHN3MDA2ZDJxcGxxMHhpNm52NiJ9.qquvnGMlnzthqHVCynXNkQ"

export default function MapSection({ onSelectHomestay }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [locationEnabled, setLocationEnabled] = useState(false)

  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [94.2037, 26.7509],
      zoom: 11,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    homestays.forEach(h => {
      const el = document.createElement("button")
      el.className = "bg-[#2D5A3D] text-white text-xs px-2 py-1 rounded-full shadow-md hover:bg-[#8B6914] transition"
      el.innerText = `₹${h.price}`
      el.onclick = () => onSelectHomestay(h)

      new mapboxgl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .addTo(map.current)
    })
  }, [])

  const enableLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      setLocationEnabled(true)
      new mapboxgl.Marker({ color: "#3B82F6" })
        .setLngLat([longitude, latitude])
        .addTo(map.current)
      map.current.flyTo({ center: [longitude, latitude], zoom: 12 })
    })
  }

  return (
    <div className="w-full px-4">
      <div className="flex justify-center mb-3">
        <button onClick={enableLocation}
          className="flex items-center gap-2 text-sm text-[#2D5A3D] border border-[#2D5A3D] px-4 py-2 rounded-full hover:bg-[#2D5A3D] hover:text-white transition">
          <Navigation size={14} />
          {locationEnabled ? "Location Active" : "Use My Location"}
        </button>
      </div>
      <div ref={mapContainer} className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full" />
    </div>
  )
}