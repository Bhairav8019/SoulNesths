// src/App.jsx
import { useState }        from "react"
import { Routes, Route }   from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import LoginModal          from "./components/LoginModal"
import LoadingScreen       from "./components/LoadingScreen"
import HomePage            from "./pages/HomePage"
import HomestayPage        from "./pages/HomestayPage"
import WishlistPage        from "./pages/WishlistPage"
import MomentsPage         from "./pages/MomentsPage"

// ── Inner app — has access to AuthContext ─────────────────────
function AppInner() {
  const [loading, setLoading]   = useState(true)
  const { loginOpen, loading: authLoading } = useAuth()

  const handleLogoClick = () => setLoading(true)

  // Phase 1: Show LoadingScreen animation
  if (loading) return (
    <LoadingScreen onDone={() => {
      window.history.pushState({}, "", "/")
      setLoading(false)
    }} />
  )

  // Phase 2: LoadingScreen done, but Firebase still resolving persisted session
  // Show a minimal dark screen — never a blank white flash
  if (authLoading) return (
    <div className="min-h-screen bg-[#1C1C1C]" />
  )

  // Phase 3: Both done — render app
  return (
    <>
      {loginOpen && <LoginModal />}

      <Routes>
        <Route path="/"             element={<HomePage     onLogoClick={handleLogoClick} />} />
        <Route path="/homestay/:id" element={<HomestayPage onLogoClick={handleLogoClick} />} />
        <Route path="/wishlist"     element={<WishlistPage onLogoClick={handleLogoClick} />} />
        <Route path="/moments"      element={<MomentsPage  onLogoClick={handleLogoClick} />} />
        <Route path="/bookings"     element={<div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F8F5F0]">Bookings page coming soon</div>} />
        <Route path="/admin"        element={<div className="min-h-screen bg-[#1C1C1C] flex items-center justify-center text-[#F8F5F0]">Admin dashboard coming soon</div>} />
      </Routes>
    </>
  )
}

// ── Root — wraps everything in AuthProvider ───────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}