import { useState } from "react"
import LoadingScreen from "./components/LoadingScreen"
import Navbar from "./components/navbar"
import SearchBar from "./components/SearchBar"
import MapSection from "./components/MapSection"
import HomestayList from "./components/HomestayList"

export default function App() {
  const [loading, setLoading] = useState(true)
  const [selectedHomestay, setSelectedHomestay] = useState(null)

  if (loading) return <LoadingScreen onDone={() => setLoading(false)} />

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <Navbar onWishlist={() => {}} />
      <div className="pt-20 flex flex-col gap-6 pb-10">
        <div className="pt-4">
          <SearchBar />
        </div>
        <MapSection onSelectHomestay={setSelectedHomestay} />
        <HomestayList onSelectHomestay={setSelectedHomestay} />
      </div>
    </div>
  )
}