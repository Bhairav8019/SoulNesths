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
    svgIcon: `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rhino body -->
        <ellipse cx="14" cy="17" rx="9" ry="6" fill="#8B6914" stroke="#F8F5F0" stroke-width="0.8"/>
        <!-- Rhino head -->
        <ellipse cx="22" cy="14" rx="5" ry="4" fill="#8B6914" stroke="#F8F5F0" stroke-width="0.8"/>
        <!-- Horn -->
        <path d="M26 11 L28 7 L25 10 Z" fill="#F8F5F0"/>
        <!-- Eye -->
        <circle cx="24" cy="13" r="1" fill="#1C1C1C"/>
        <!-- Ear -->
        <path d="M21 11 L22 9 L23 11 Z" fill="#F8F5F0"/>
        <!-- Legs -->
        <rect x="7" y="21" width="2.5" height="4" rx="1" fill="#7A5C10"/>
        <rect x="11" y="22" width="2.5" height="3.5" rx="1" fill="#7A5C10"/>
        <rect x="15" y="22" width="2.5" height="3.5" rx="1" fill="#7A5C10"/>
        <rect x="19" y="21" width="2.5" height="4" rx="1" fill="#7A5C10"/>
        <!-- Tail -->
        <path d="M5 17 Q2 15 3 13" stroke="#F8F5F0" stroke-width="1" fill="none" stroke-linecap="round"/>
      </svg>
    `,
  },
  {
    id: "majuli",
    name: "Majuli",
    lat: 26.94696,
    lng: 94.16583,
    color: "#9B3A6E",
    glowColor: "rgba(155,58,110,0.6)",
    svgIcon: `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Bhaona mask face -->
        <ellipse cx="14" cy="15" rx="10" ry="11" fill="#8B1A1A" stroke="#F8B400" stroke-width="1"/>
        <!-- Forehead ornament -->
        <path d="M9 7 Q14 3 19 7 Q14 5 9 7Z" fill="#F8B400"/>
        <!-- Eyes - large theatrical -->
        <ellipse cx="10" cy="13" rx="3" ry="2.5" fill="#F8F5F0"/>
        <ellipse cx="18" cy="13" rx="3" ry="2.5" fill="#F8F5F0"/>
        <circle cx="10" cy="13" r="1.5" fill="#1C1C1C"/>
        <circle cx="18" cy="13" r="1.5" fill="#1C1C1C"/>
        <circle cx="10.6" cy="12.4" r="0.5" fill="white"/>
        <circle cx="18.6" cy="12.4" r="0.5" fill="white"/>
        <!-- Nose -->
        <path d="M13 16 L14 18 L15 16" stroke="#F8B400" stroke-width="1" fill="none"/>
        <!-- Mouth - dramatic smile -->
        <path d="M9 20 Q14 24 19 20" stroke="#F8B400" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <!-- Mustache -->
        <path d="M10 18 Q12 17 14 18 Q16 17 18 18" stroke="#F8F5F0" stroke-width="1" fill="none"/>
        <!-- Crown horns -->
        <path d="M7 7 L5 2 L9 6" fill="#F8B400"/>
        <path d="M21 7 L23 2 L19 6" fill="#F8B400"/>
        <path d="M14 5 L14 1 L16 5" fill="#F8B400"/>
      </svg>
    `,
  },
  {
    id: "sivasagar",
    name: "Sivasagar",
    lat: 26.96728,
    lng: 94.61907,
    color: "#1A5C8B",
    glowColor: "rgba(26,92,139,0.6)",
    svgIcon: `
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ranghar pavilion base platform -->
        <rect x="2" y="22" width="24" height="3" rx="1" fill="#8B6914" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Main structure -->
        <rect x="5" y="16" width="18" height="8" rx="0.5" fill="#2D5A3D" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Arched openings -->
        <path d="M8 24 L8 19 Q10 16.5 12 19 L12 24 Z" fill="#1C1C1C"/>
        <path d="M16 24 L16 19 Q18 16.5 20 19 L20 24 Z" fill="#1C1C1C"/>
        <!-- Second tier -->
        <rect x="7" y="11" width="14" height="6" rx="0.5" fill="#3A7A52" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Second tier arches -->
        <path d="M10 17 L10 14 Q12 11.5 14 14 L14 17 Z" fill="#1C1C1C"/>
        <!-- Roof first tier -->
        <path d="M3 16 Q14 11 25 16 Z" fill="#8B6914" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Roof second tier -->
        <path d="M6 11 Q14 7 22 11 Z" fill="#C8860A" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Top pinnacle -->
        <rect x="12" y="4" width="4" height="7" rx="0.5" fill="#2D5A3D" stroke="#F8F5F0" stroke-width="0.6"/>
        <!-- Finial -->
        <path d="M13 4 L14 1 L15 4 Z" fill="#F8B400"/>
        <circle cx="14" cy="4" r="1" fill="#F8B400"/>
        <!-- Decorative pillars -->
        <rect x="5" y="16" width="1.5" height="8" fill="#C8860A"/>
        <rect x="21.5" y="16" width="1.5" height="8" fill="#C8860A"/>
      </svg>
    `,
  },
]

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

    // GTA-style landmark icons
    LANDMARKS.forEach(landmark => {
      const distKm = getDistanceKm(SOUL_NEST_LAT, SOUL_NEST_LNG, landmark.lat, landmark.lng)
      const distLabel = distKm > 999 ? `${(distKm / 1000).toFixed(1)}k km` : `${Math.round(distKm)} km`

      const el = document.createElement("div")
      el.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        filter: drop-shadow(0 0 8px ${landmark.glowColor});
        transition: transform 0.2s ease, filter 0.2s ease;
      `

      el.innerHTML = `
        <!-- GTA-style icon container -->
        <div style="
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <!-- Name + distance label -->
          <div style="
            background: linear-gradient(135deg, rgba(10,8,6,0.95), rgba(28,20,8,0.95));
            border: 1px solid ${landmark.color};
            border-bottom: none;
            color: #F8F5F0;
            font-family: 'Playfair Display', serif;
            font-size: 9.5px;
            font-weight: 700;
            padding: 3px 8px 2px 8px;
            border-radius: 6px 6px 0 0;
            white-space: nowrap;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.6);
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

          <!-- Icon box -->
          <div style="
            width: 42px;
            height: 42px;
            background: linear-gradient(145deg, rgba(15,12,8,0.97), rgba(25,20,10,0.97));
            border: 1.5px solid ${landmark.color};
            border-radius: 0 0 8px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow:
              0 4px 20px rgba(0,0,0,0.7),
              0 0 12px ${landmark.glowColor},
              inset 0 1px 0 rgba(255,255,255,0.05);
            position: relative;
            overflow: hidden;
          ">
            <!-- Corner accents GTA style -->
            <div style="
              position: absolute;
              top: 2px; left: 2px;
              width: 6px; height: 6px;
              border-top: 1px solid ${landmark.color};
              border-left: 1px solid ${landmark.color};
              opacity: 0.7;
            "></div>
            <div style="
              position: absolute;
              top: 2px; right: 2px;
              width: 6px; height: 6px;
              border-top: 1px solid ${landmark.color};
              border-right: 1px solid ${landmark.color};
              opacity: 0.7;
            "></div>
            <div style="
              position: absolute;
              bottom: 2px; left: 2px;
              width: 6px; height: 6px;
              border-bottom: 1px solid ${landmark.color};
              border-left: 1px solid ${landmark.color};
              opacity: 0.7;
            "></div>
            <div style="
              position: absolute;
              bottom: 2px; right: 2px;
              width: 6px; height: 6px;
              border-bottom: 1px solid ${landmark.color};
              border-right: 1px solid ${landmark.color};
              opacity: 0.7;
            "></div>
            ${landmark.svgIcon}
          </div>

          <!-- Stem -->
          <div style="
            width: 1.5px;
            height: 10px;
            background: linear-gradient(to bottom, ${landmark.color}, transparent);
          "></div>
          <!-- Dot -->
          <div style="
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: ${landmark.color};
            box-shadow: 0 0 8px ${landmark.glowColor};
          "></div>
        </div>
      `

      // Hover effect
      el.onmouseenter = () => {
        el.style.transform = "scale(1.12) translateY(-3px)"
        el.style.filter = `drop-shadow(0 0 14px ${landmark.glowColor})`
        el.style.zIndex = "10"
      }
      el.onmouseleave = () => {
        el.style.transform = "scale(1)"
        el.style.filter = `drop-shadow(0 0 8px ${landmark.glowColor})`
        el.style.zIndex = "1"
      }

      new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([landmark.lng, landmark.lat])
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

    if (searchMarker.current) searchMarker.current.remove()

    const matched = homestays.find(h =>
      h.name.toLowerCase().includes(searchQuery?.toLowerCase())
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