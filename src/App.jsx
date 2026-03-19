// src/App.jsx
import { useState }        from "react"
import { Routes, Route }   from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import LoginModal          from "./components/LoginModal"
import LoadingScreen       from "./components/LoadingScreen"
import HomePage            from "./pages/HomePage"
import HomestayPage        from "./pages/homestayPage"
import WishlistPage        from "./pages/WishlistPage"
import MomentsPage         from "./pages/MomentsPage"
import AdminPage           from "./pages/AdminPage"
import BookingsPage        from "./pages/BookingsPage"

function AppInner() {
  const [loading, setLoading]   = useState(true)
  const { loginOpen, loading: authLoading } = useAuth()

  const handleLogoClick = () => setLoading(true)

  if (loading) return (
    <LoadingScreen onDone={() => {
      window.history.pushState({}, "", "/")
      setLoading(false)
    }} />
  )

  if (authLoading) return (
    <div className="min-h-screen bg-[#1C1C1C]" />
  )

  return (
    <>
      {loginOpen && <LoginModal />}
      <Routes>
        <Route path="/"             element={<HomePage     onLogoClick={handleLogoClick} />} />
        <Route path="/homestay/:id" element={<HomestayPage onLogoClick={handleLogoClick} />} />
        <Route path="/wishlist"     element={<WishlistPage onLogoClick={handleLogoClick} />} />
        <Route path="/moments"      element={<MomentsPage  onLogoClick={handleLogoClick} />} />
        <Route path="/bookings"     element={<BookingsPage onLogoClick={handleLogoClick} />} />
        <Route path="/admin"        element={<AdminPage />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}