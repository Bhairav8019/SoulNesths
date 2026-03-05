import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"
import { Navigation } from "lucide-react"

mapboxgl.accessToken = "pk.eyJ1IjoiYmhhaXJhdjgwMTkiLCJhIjoiY21tYndveHN3MDA2ZDJxcGxxMHhpNm52NiJ9.qquvnGMlnzthqHVCynXNkQ"

export default function MapSection({ onSelectHomestay, triggerZoom = false }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [error, setError] = useState(null)

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [78.9629, 20.5937],
        zoom: 4,
      })

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

      homestays.forEach(h => {
        const el = document.createElement("button")
        el.className = "bg-[#2D5A3D] text-white text-xs px-2 py-1 rounded-full shadow-md hover:bg-[#8B6914] transition"
        el.innerText = `₹${h.startingPrice}`
        el.onclick = () => onSelectHomestay(h)

        new mapboxgl.Marker({ element: el })
          .setLngLat([h.lng, h.lat])
          .addTo(map.current)
      })
    } catch (err) {
      console.error("Map initialization error:", err)
      setError("Failed to load map")
    }
  }, [])

  // Zoom animation from India → Jorhat
  useEffect(() => {
    if (!triggerZoom || !map.current) return

    const performZoom = () => {
      if (map.current) {
        map.current.flyTo({
          center: [94.2037, 26.7509],
          zoom: 11,
          duration: 3000,
          easing: (t) => t * (2 - t),
        })
      }
    }

    // Use map.loaded() method to check if tiles are loaded
    if (map.current.loaded()) {
      performZoom()
    } else {
      map.current.once("load", performZoom)
    }
  }, [triggerZoom])

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
      {error ? (
        <div className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full bg-[#2a2a2a] flex items-center justify-center text-[#F8F5F0]">
          {error}
        </div>
      ) : (
        <div ref={mapContainer} className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full" />
      )}
    </div>
  )
}