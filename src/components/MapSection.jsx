import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"
import { Navigation } from "lucide-react"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

// Haversine distance in km
function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Soul Nest coords as reference
const SOUL_NEST_LAT = 26.768666
const SOUL_NEST_LNG = 94.188933

const LANDMARKS = [
  {
    id: "kaziranga",
    name: "Kaziranga National Park",
    lat: 26.52506,
    lng: 92.99185,
    color: "#C8860A",
    glowColor: "rgba(200,134,10,0.6)",
  },
  {
    id: "majuli",
    name: "Majuli",
    lat: 26.94696,
    lng: 94.16583,
    color: "#9B3A6E",
    glowColor: "rgba(155,58,110,0.6)",
  },
  {
    id: "sivasagar",
    name: "Sivasagar",
    lat: 26.96728,
    lng: 94.61907,
    color: "#1A5C8B",
    glowColor: "rgba(26,92,139,0.6)",
  },
]

export default function MapSection({
  onSelectHomestay,
  searchQuery,
  searchCoords,
  triggerZoom = false,
  searchCheckIn = null,
  searchCheckOut = null,
  searchGuests = null,
  defaultCenter = { lat: 26.7509, lng: 94.2037 }, // Soul Nest / Jorhat center
  defaultZoom = 9.5, // zoomed out further to show all 3 landmarks (Kaziranga, Majuli, Sivasagar)
  alwaysShowDirectionPills = false,
}) {
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
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: defaultZoom,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")

    // Filter homestays based on search criteria
    const getFilteredHomestays = () => {
      return homestays.filter(h => {
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

    // GTA-style landmark direction pills - ALWAYS SHOW
    if (alwaysShowDirectionPills) {
      LANDMARKS.forEach(landmark => {
        const distKm = getDistanceKm(SOUL_NEST_LAT, SOUL_NEST_LNG, landmark.lat, landmark.lng)
        const distLabel = distKm > 999 ? `${(distKm / 1000).toFixed(1)}k km` : `${Math.round(distKm)} km`

        const el = document.createElement("div")
        el.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
          filter: drop-shadow(0 0 8px ${landmark.glowColor});
        `

        el.innerHTML = `
          <div style="
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
          ">
            <div style="
              background: linear-gradient(135deg, rgba(10,8,6,0.95), rgba(28,20,8,0.95));
              border: 1px solid ${landmark.color};
              color: #F8F5F0;
              font-family: 'Playfair Display', serif;
              font-size: 9.5px;
              font-weight: 700;
              padding: 4px 10px;
              border-radius: 20px;
              white-space: nowrap;
              letter-spacing: 0.06em;
              text-transform: uppercase;
              box-shadow: 0 2px 10px rgba(0,0,0,0.6);
              text-shadow: 0 0 8px ${landmark.color};
              display: flex;
              align-items: center;
              gap: 5px;
            ">
              <span>${landmark.name}</span>
              <span style="
                color: ${landmark.color};
                font-size: 8.5px;
                font-family: 'Courier New', monospace;
                font-weight: 400;
                opacity: 0.9;
                letter-spacing: 0.04em;
              ">${distLabel}</span>
            </div>
            <div style="
              width: 1.5px;
              height: 10px;
              background: linear-gradient(to bottom, ${landmark.color}, transparent);
            "></div>
            <div style="
              width: 5px;
              height: 5px;
              border-radius: 50%;
              background: ${landmark.color};
              box-shadow: 0 0 8px ${landmark.glowColor};
            "></div>
          </div>
        `

        new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([landmark.lng, landmark.lat])
          .addTo(map.current)
      })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Fly to search result only when user actually searched
  useEffect(() => {
    if (!map.current) return
    const hasSearch = Boolean(searchCoords && searchQuery?.trim())

    if (!hasSearch) {
      if (searchMarker.current) {
        searchMarker.current.remove()
        searchMarker.current = null
      }
      return
    }

    map.current.flyTo({
      center: [searchCoords.lng, searchCoords.lat],
      zoom: 14,
      duration: 1800,
      essential: true,
    })

    if (searchMarker.current) searchMarker.current.remove()

    const matched = homestays.find(h =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!matched) {
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
  }, [searchCoords, searchQuery])

  // Zoom animation from India → Jorhat on initial load
  useEffect(() => {
    if (!triggerZoom || !map.current) return

    const performZoom = () => {
      if (map.current) {
        map.current.flyTo({
          center: [94.2037, 26.7509],
          zoom: 9.5,
          duration: 3000,
          easing: (t) => t * (2 - t),
        })
      }
    }

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