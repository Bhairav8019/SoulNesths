import { useState, useRef } from "react"
import Map, { Marker, NavigationControl } from "react-map-gl"
import { MapPin, Navigation } from "lucide-react"
import { homestays } from "../data/homestays"
import "mapbox-gl/dist/mapbox-gl.css"

const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtby11c2VyIiwiYSI6ImNsZG1vb3BhNzBhcnYzcW1udWkxeGo2dmsifQ.demo"

export default function MapSection({ onSelectHomestay }) {
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

  const enableLocation = () => {
    navigator.geolocation.getCurrentPosition(pos => {
      setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      setLocationEnabled(true)
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
      <div className="rounded-2xl overflow-hidden shadow-md h-[420px] w-full">
        <Map
          initialViewState={{ longitude: 94.2037, latitude: 26.7509, zoom: 11 }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/light-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          <NavigationControl position="top-right" />
          {homestays.map(h => (
            <Marker key={h.id} longitude={h.lng} latitude={h.lat} anchor="bottom">
              <button onClick={() => onSelectHomestay(h)}
                className="bg-[#2D5A3D] text-white text-xs px-2 py-1 rounded-full shadow-md hover:bg-[#8B6914] transition flex items-center gap-1">
                <MapPin size={10} /> ₹{h.price}
              </button>
            </Marker>
          ))}
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat}>
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-md" />
            </Marker>
          )}
        </Map>
      </div>
    </div>
  )
}