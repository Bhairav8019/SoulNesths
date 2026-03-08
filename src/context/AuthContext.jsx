// src/context/AuthContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Firebase Auth context for Soul Nest Homestays.
//
// Provides:
//   currentUser  — Firebase User object (null if not logged in)
//   loading      — true while Firebase resolves persisted session on first load
//   openLogin()  — call from anywhere to open the LoginModal
//   closeLogin() — close LoginModal
//   loginOpen    — bool, controls LoginModal visibility
//   logout()     — signs out + clears user
//
// Usage:
//   const { currentUser, openLogin, logout } = useAuth()
//
// Session persistence:
//   Firebase Auth uses LOCAL persistence by default — user stays logged in
//   across browser refreshes and tab closes until they explicitly log out.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "../firebase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)   // resolving persisted session
  const [loginOpen, setLoginOpen]     = useState(false)

  // Listen to Firebase auth state — fires on load (persisted session) and on login/logout
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })
    return unsub
  }, [])

  const openLogin  = () => setLoginOpen(true)
  const closeLogin = () => setLoginOpen(false)

  const logout = async () => {
    await firebaseSignOut(auth)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, loginOpen, openLogin, closeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}