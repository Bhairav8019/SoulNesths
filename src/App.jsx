import { useState } from "react"
import { Routes, Route } from "react-router-dom"
import LoadingScreen from "./components/LoadingScreen"
import HomePage from "./pages/HomePage"
import HomestayPage from "./pages/HomestayPage"
import WishlistPage from "./pages/WishlistPage"
import MomentsPage from "./pages/MomentsPage"

export default function App() {
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)

  const handleLogoClick = () => setLoading(true)
  const handleLogin = () => setLoggedIn(true)
  const handleLogout = () => setLoggedIn(false)

  if (loading) return (
    <LoadingScreen onDone={() => {
      window.history.pushState({}, "", "/")
      setLoading(false)
    }} />
  )

  return (
    <Routes>
      <Route path="/" element={
        <HomePage
          onLogoClick={handleLogoClick}
          loggedIn={loggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />}
      />
      <Route path="/homestay/:id" element={
        <HomestayPage
          onLogoClick={handleLogoClick}
          loggedIn={loggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />}
      />
      <Route path="/wishlist" element={
        <WishlistPage
          onLogoClick={handleLogoClick}
          loggedIn={loggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />}
      />
      <Route path="/moments" element={
        <MomentsPage
          onLogoClick={handleLogoClick}
          loggedIn={loggedIn}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />}
      />
    </Routes>
  )
}