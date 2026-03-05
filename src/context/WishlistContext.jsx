import { createContext, useContext, useState, useEffect } from "react"

const WishlistContext = createContext()

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([])
  const [isInitialized, setIsInitialized] = useState(false)

  // Load wishlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wishlist")
      if (saved) {
        setWishlist(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Error loading wishlist from localStorage:", error)
    }
    setIsInitialized(true)
  }, [])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("wishlist", JSON.stringify(wishlist))
      } catch (error) {
        console.error("Error saving wishlist to localStorage:", error)
      }
    }
  }, [wishlist, isInitialized])

  const toggleWishlist = (homestay) => {
    setWishlist(prev =>
      prev.find(h => h.id === homestay.id)
        ? prev.filter(h => h.id !== homestay.id)
        : [...prev, homestay]
    )
  }

  const isWishlisted = (id) => wishlist.some(h => h.id === id)

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)