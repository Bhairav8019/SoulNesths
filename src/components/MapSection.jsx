import { useEffect, useRef, useState, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"
import { Navigation, NavigationOff, Loader } from "lucide-react"

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

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

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km >= 1000) return `${(km / 1000).toFixed(1)}k km`
  return `${km.toFixed(1)} km`
}

const SOUL_NEST_LAT = 26.768666
const SOUL_NEST_LNG = 94.188933

const LANDMARKS = [
  { id: "kaziranga", name: "Kaziranga National Park", lat: 26.67300,  lng: 93.35594, color: "#C8860A", glowColor: "rgba(200,134,10,0.6)" },
  { id: "majuli",    name: "Majuli",                  lat: 26.94696,  lng: 94.16583, color: "#9B3A6E", glowColor: "rgba(155,58,110,0.6)" },
  { id: "sivasagar", name: "Sivasagar",               lat: 26.96728,  lng: 94.61907, color: "#1A5C8B", glowColor: "rgba(26,92,139,0.6)" },
]

const ROUTE_SOURCE = "user-route"
const ROUTE_LAYER  = "user-route-layer"

export default function MapSection({
  onSelectHomestay,
  searchQuery,
  searchCoords,
  triggerZoom = false,
  searchCheckIn = null,
  searchCheckOut = null,
  searchGuests = null,
  autoTriggerLocation = false,
}) {
  const mapContainer  = useRef(null)
  const map           = useRef(null)
  const userMarker    = useRef(null)
  const searchMarker  = useRef(null)
  const watchId       = useRef(null)
  const mapReady      = useRef(false)

  const [locState, setLocState] = useState("off")   // "off"|"loading"|"on"|"denied"
  const [distKm, setDistKm]     = useState(null)
  const [locError, setLocError] = useState("")

  const drawRoute = useCallback((userLng, userLat) => {
    if (!map.current || !mapReady.current) return
    const geojson = {
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: { type: "LineString", coordinates: [[userLng, userLat], [SOUL_NEST_LNG, SOUL_NEST_LAT]] } }]
    }
    if (map.current.getSource(ROUTE_SOURCE)) {
      map.current.getSource(ROUTE_SOURCE).setData(geojson)
    } else {
      map.current.addSource(ROUTE_SOURCE, { type: "geojson", data: geojson })
      map.current.addLayer({
        id: ROUTE_LAYER, type: "line", source: ROUTE_SOURCE,
        paint: { "line-color": "#3B82F6", "line-width": 2, "line-dasharray": [2, 3], "line-opacity": 0.85 }
      })
    }
  }, [])

  const removeRoute = useCallback(() => {
    if (!map.current) return
    if (map.current.getLayer(ROUTE_LAYER))   map.current.removeLayer(ROUTE_LAYER)
    if (map.current.getSource(ROUTE_SOURCE)) map.current.removeSource(ROUTE_SOURCE)
  }, [])

  const updateUserMarker = useCallback((lng, lat) => {
    if (!map.current) return
    if (userMarker.current) {
      userMarker.current.setLngLat([lng, lat])
    } else {
      const el = document.createElement("div")
      el.style.cssText = "position:relative;width:18px;height:18px;"
      el.innerHTML = `
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:locPulse 2s ease-out infinite;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:10px;height:10px;border-radius:50%;background:#3B82F6;border:2px solid white;box-shadow:0 0 8px rgba(59,130,246,0.9);"></div>
      `
      if (!document.getElementById("loc-pulse-style")) {
        const s = document.createElement("style")
        s.id = "loc-pulse-style"
        s.textContent = "@keyframes locPulse{0%{transform:scale(1);opacity:.8}100%{transform:scale(2.8);opacity:0}}"
        document.head.appendChild(s)
      }
      userMarker.current = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat]).addTo(map.current)
    }
  }, [])

  const onPosition = useCallback((pos) => {
    const { latitude, longitude } = pos.coords
    setLocState("on")
    setLocError("")
    const km = getDistanceKm(latitude, longitude, SOUL_NEST_LAT, SOUL_NEST_LNG)
    setDistKm(km)
    updateUserMarker(longitude, latitude)
    drawRoute(longitude, latitude)
  }, [updateUserMarker, drawRoute])

  const disableLocation = useCallback(() => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current)
      watchId.current = null
    }
    if (userMarker.current) { userMarker.current.remove(); userMarker.current = null }
    removeRoute()
    setLocState("off")
    setDistKm(null)
    if (map.current) map.current.flyTo({ center: [94.2037, 26.7509], zoom: 11, duration: 1400 })
  }, [removeRoute])

  const enableLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported on this device."); return }
    setLocState("loading")
    setLocError("")
    if (watchId.current != null) { navigator.geolocation.clearWatch(watchId.current); watchId.current = null }
    watchId.current = navigator.geolocation.watchPosition(
      onPosition,
      (err) => {
        if (err.code === 1) { setLocError("Location access denied. Allow it in your browser settings."); setLocState("denied") }
        else { setLocError("Could not get location. Try again."); setLocState("off") }
        if (userMarker.current) { userMarker.current.remove(); userMarker.current = null }
        removeRoute()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 }
    )
  }, [onPosition, removeRoute])

  // Map init
  useEffect(() => {
    if (map.current) return
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 20.5937],
      zoom: 4,
    })
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    map.current.once("load", () => { mapReady.current = true })

    const filtered = homestays.filter(h => !searchGuests || h.rooms.some(r => r.maxGuests >= searchGuests))
    filtered.forEach(h => {
      const el = document.createElement("div")
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;"
      el.innerHTML = `
        <div style="background:linear-gradient(135deg,#1a1f1a,#2D5A3D);border:1.5px solid #8B6914;color:#F8F5F0;font-family:'Playfair Display',serif;font-size:11px;font-weight:600;padding:5px 10px;border-radius:20px;white-space:nowrap;box-shadow:0 4px 15px rgba(0,0,0,0.5),0 0 8px rgba(139,105,20,0.3);letter-spacing:0.03em;">${h.name}</div>
        <div style="width:2px;height:8px;background:#8B6914;"></div>
        <div style="width:6px;height:6px;border-radius:50%;background:#8B6914;box-shadow:0 0 6px rgba(139,105,20,0.8);"></div>
      `
      el.onclick = () => onSelectHomestay(h)
      new mapboxgl.Marker({ element: el }).setLngLat([h.lng, h.lat]).addTo(map.current)
    })

    LANDMARKS.forEach(lm => {
      const distLabel = formatDist(getDistanceKm(SOUL_NEST_LAT, SOUL_NEST_LNG, lm.lat, lm.lng))
      const el = document.createElement("div")
      el.style.cssText = `display:flex;flex-direction:column;align-items:center;pointer-events:none;filter:drop-shadow(0 0 8px ${lm.glowColor});`
      el.innerHTML = `
        <div style="background:linear-gradient(135deg,rgba(10,8,6,0.95),rgba(28,20,8,0.95));border:1px solid ${lm.color};color:#F8F5F0;font-family:'Playfair Display',serif;font-size:9.5px;font-weight:700;padding:4px 10px;border-radius:20px;white-space:nowrap;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 2px 10px rgba(0,0,0,0.6);text-shadow:0 0 8px ${lm.color};display:flex;align-items:center;gap:5px;">
          <span>${lm.name}</span>
          <span style="color:${lm.color};font-size:8.5px;font-family:'Courier New',monospace;font-weight:400;opacity:0.9;">${distLabel}</span>
        </div>
        <div style="width:1.5px;height:10px;background:linear-gradient(to bottom,${lm.color},transparent);"></div>
        <div style="width:5px;height:5px;border-radius:50%;background:${lm.color};box-shadow:0 0 8px ${lm.glowColor};"></div>
      `
      new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat([lm.lng, lm.lat]).addTo(map.current)
    })
  }, [])

  // Search fly-to
  useEffect(() => {
    if (!searchCoords || !map.current) return
    map.current.flyTo({ center: [searchCoords.lng, searchCoords.lat], zoom: 14, duration: 1800, essential: true })
    if (searchMarker.current) searchMarker.current.remove()
    const matched = homestays.find(h => h.name.toLowerCase().includes(searchQuery?.toLowerCase()))
    if (!matched) {
      const el = document.createElement("div")
      el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#8B6914;border:2px solid white;box-shadow:0 0 10px rgba(139,105,20,0.8);"
      searchMarker.current = new mapboxgl.Marker({ element: el }).setLngLat([searchCoords.lng, searchCoords.lat]).addTo(map.current)
    }
  }, [searchCoords])

  // Initial zoom
  useEffect(() => {
    if (!triggerZoom || !map.current) return
    const go = () => map.current.flyTo({ center: [94.2037, 26.7509], zoom: 11, duration: 3000, easing: t => t * (2 - t) })
    if (map.current.loaded()) go(); else map.current.once("load", go)
  }, [triggerZoom])

  // Auto-trigger from HomestayPage
  useEffect(() => {
    if (!autoTriggerLocation) return
    const t = setTimeout(() => enableLocation(), 700)
    return () => clearTimeout(t)
  }, [autoTriggerLocation, enableLocation])

  // Cleanup
  useEffect(() => () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current) }, [])

  const btnLabel = () => {
    if (locState === "loading") return "Getting location..."
    if (locState === "on" && distKm != null) return `${formatDist(distKm)} from Soul Nest · Live`
    if (locState === "denied") return "Location denied"
    return "Detect My Location"
  }

  return (
    <div className="w-full px-4">
      <div className="flex flex-col items-center gap-2 mb-3">
        <div className="flex items-center gap-2">
          {locState === "on" ? (
            <button onClick={disableLocation}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium transition"
              style={{ background: "#3B82F6", color: "white", border: "1px solid #3B82F6" }}>
              <NavigationOff size={14} />
              📍 {btnLabel()}
            </button>
          ) : (
            <button onClick={enableLocation} disabled={locState === "loading"}
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-full font-medium transition"
              style={
                locState === "loading" ? { background: "transparent", color: "#9a9a9a", border: "1px solid #3a3a3a", cursor: "not-allowed" }
                : locState === "denied"  ? { background: "transparent", color: "#ef4444", border: "1px solid #ef4444" }
                : { background: "transparent", color: "#2D5A3D", border: "1px solid #2D5A3D" }
              }>
              {locState === "loading" ? <Loader size={14} className="animate-spin" /> : <Navigation size={14} />}
              {btnLabel()}
            </button>
          )}
        </div>

        {locState === "on" && distKm != null && (
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: "4px 14px", fontSize: 11, color: "#93c5fd", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6", display: "inline-block", boxShadow: "0 0 5px #3B82F6" }} />
            Live · Blue line shows route to Soul Nest · Tap button to turn off
          </div>
        )}

        {locError && (
          <p style={{ color: "#f87171", fontSize: 11, textAlign: "center", maxWidth: 280 }}>{locError}</p>
        )}
      </div>

      <div ref={mapContainer} className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full" />
    </div>
  )
}