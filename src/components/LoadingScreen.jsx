import { useState, useEffect } from "react"

const quotes = [
  "Explore Jorhat",
  "Experience Assam",
  "Expedition North East India"
]

export default function LoadingScreen({ onDone }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (index >= quotes.length) {
      setTimeout(onDone, 600)
      return
    }
    const fadeOut = setTimeout(() => setVisible(false), 1800)
    const next = setTimeout(() => {
      setIndex(i => i + 1)
      setVisible(true)
    }, 2400)
    return () => {
      clearTimeout(fadeOut)
      clearTimeout(next)
    }
  }, [index])

  return (
    <div className="fixed inset-0 bg-[#1C1C1C] flex items-center justify-center">
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          transition: "opacity 0.6s ease",
          opacity: visible ? 1 : 0,
        }}
        className="text-[#F8F5F0] text-3xl md:text-5xl font-semibold tracking-widest text-center px-6"
      >
        {quotes[index] ?? ""}
      </p>
    </div>
  )
}