import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"
import { Navigation } from "lucide-react"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function MapSection({ onSelectHomestay, searchQuery, searchCoords, triggerZoom = false, searchCheckIn = null, searchCheckOut = null, searchGuests = null }) {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const userMarker = useRef(null)
  const searchMarker = useRef(null)
  const [locationEnabled, setLocationEnabled] = useState(false)

  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 20.5937],
      zoom: 4,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Filter homestays based on search criteria
    const getFilteredHomestays = () => {
      return homestays.filter(h => {
        // Check guest capacity if searchGuests is specified
        if (searchGuests && searchGuests > 0) {
          const hasCapacity = h.rooms.some(room => room.maxGuests >= searchGuests)
          if (!hasCapacity) return false
        }
        return true
      })
    }

    // Luxury pin for each filtered homestay
    getFilteredHomestays().forEach(h => {
      const el = document.createElement("div")
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
      `
      el.innerHTML = `
        <div style="
          background: linear-gradient(135deg, #1a1f1a, #2D5A3D);
          border: 1.5px solid #8B6914;
          color: #F8F5F0;
          font-family: 'Playfair Display', serif;
          font-size: 11px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5), 0 0 8px rgba(139,105,20,0.3);
          letter-spacing: 0.03em;
        ">${h.name}</div>
        <div style="
          width: 2px;
          height: 8px;
          background: #8B6914;
        "></div>
        <div style="
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8B6914;
          box-shadow: 0 0 6px rgba(139,105,20,0.8);
        "></div>
      `
      el.onclick = () => onSelectHomestay(h)

      new mapboxgl.Marker({ element: el })
        .setLngLat([h.lng, h.lat])
        .addTo(map.current)
    })
  }, [])

  // Fly to search result
  useEffect(() => {
    if (!searchCoords || !map.current) return

    map.current.flyTo({
      center: [searchCoords.lng, searchCoords.lat],
      zoom: 14,
      duration: 1800,
      essential: true,
    })

    // Remove old search marker
    if (searchMarker.current) searchMarker.current.remove()

    // Check if it matches a homestay
    const matched = homestays.find(h =>
      h.name.toLowerCase().includes(searchQuery?.toLowerCase())
    )

    if (!matched) {
      // Show a simple location marker for non-homestay searches
      const el = document.createElement("div")
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #8B6914;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(139,105,20,0.8);
      `
      searchMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([searchCoords.lng, searchCoords.lat])
        .addTo(map.current)
    }
  }, [searchCoords])

  // Zoom animation from India → Jorhat on initial load
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

  // User location + distance line
  const enableLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords
      setLocationEnabled(true)

      if (userMarker.current) userMarker.current.remove()

      const el = document.createElement("div")
      el.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #3B82F6;
        border: 2px solid white;
        box-shadow: 0 0 10px rgba(59,130,246,0.8);
      `
      userMarker.current = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(map.current)

      // Draw distance lines to all homestays
      if (map.current.getSource("distance-lines")) {
        map.current.removeLayer("distance-layer")
        map.current.removeSource("distance-lines")
      }

      map.current.addSource("distance-lines", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: homestays.map(h => ({
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [longitude, latitude],
                [h.lng, h.lat]
              ]
            }
          }))
        }
      })

      map.current.addLayer({
        id: "distance-layer",
        type: "line",
        source: "distance-lines",
        paint: {
          "line-color": "#8B6914",
          "line-width": 1.5,
          "line-dasharray": [2, 3],
          "line-opacity": 0.7,
        }
      })

      map.current.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        duration: 1500,
      })
    })
  }

  return (
    <div className="w-full px-4">
      <div className="flex justify-center mb-3">
        <button onClick={enableLocation}
          className="flex items-center gap-2 text-sm text-[#2D5A3D] border border-[#2D5A3D] px-4 py-2 rounded-full hover:bg-[#2D5A3D] hover:text-white transition">
          <Navigation size={14} />
          {locationEnabled ? "📍 Location Active" : "Use My Location"}
        </button>
      </div>
      <div ref={mapContainer} className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full" />
    </div>
  )
}