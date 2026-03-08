// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth"
import { auth } from "../firebase"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [loginOpen, setLoginOpen]     = useState(false)

  useEffect(() => {
    let unsub = () => {}
    try {
      unsub = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user ?? null)
        setLoading(false)
      }, (error) => {
        // Auth error (e.g. bad config) — still let the app load
        console.error("Firebase Auth error:", error)
        setLoading(false)
      })
    } catch (e) {
      console.error("Firebase init error:", e)
      setLoading(false)
    }
    return () => unsub()
  }, [])

  const openLogin  = () => setLoginOpen(true)
  const closeLogin = () => setLoginOpen(false)

  const logout = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (e) {
      console.error("Logout error:", e)
    }
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, loading, loginOpen, openLogin, closeLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}