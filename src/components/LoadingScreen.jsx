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
    <div className="fixed inset-0 bg-[#1C1C1C] flex flex-col items-center justify-center gap-6">

      {/* Luxury loading circle */}
      <div className="relative w-10 h-10">
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "1.5px solid transparent",
          borderTopColor: "#8B6914",
          borderRightColor: "#2D5A3D",
          animation: "spin 1.4s linear infinite",
        }} />
        <div style={{
          position: "absolute",
          inset: "5px",
          borderRadius: "50%",
          border: "1px solid transparent",
          borderTopColor: "#8B6914",
          opacity: 0.4,
          animation: "spin 2s linear infinite reverse",
        }} />
      </div>

      {/* Quote text */}
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          transition: "opacity 0.6s ease",
          opacity: visible ? 1 : 0,
          fontSize: "clamp(13px, 3.5vw, 18px)",
          whiteSpace: "nowrap",
        }}
        className="text-[#F8F5F0] font-medium tracking-widest text-center px-4"
      >
        {quotes[index] ?? ""}
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}