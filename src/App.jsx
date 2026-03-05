import { useState } from "react"
import { Routes, Route } from "react-router-dom"
import LoadingScreen from "./components/LoadingScreen"
import HomePage from "./pages/HomePage"
import HomestayPage from "./pages/HomestayPage"
import WishlistPage from "./pages/WishlistPage"

export default function App() {
  const [loading, setLoading] = useState(true)

  const handleLogoClick = () => setLoading(true)

  if (loading) return (
    <LoadingScreen onDone={() => {
      window.history.pushState({}, "", "/")
      setLoading(false)
    }} />
  )

  return (
    <Routes>
      <Route path="/" element={<HomePage onLogoClick={handleLogoClick} />} />
      <Route path="/homestay/:id" element={<HomestayPage onLogoClick={handleLogoClick} />} />
      <Route path="/wishlist" element={<WishlistPage onLogoClick={handleLogoClick} />} />
    </Routes>
  )
}