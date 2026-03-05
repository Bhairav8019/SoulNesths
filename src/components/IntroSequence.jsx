import { useState, useEffect } from "react"

export default function IntroSequence({ onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0: name reveal
  // phase 1: fade out name, hand off

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2000)
    const t2 = setTimeout(() => onDone(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  return (
    <div
      style={{
        opacity: phase === 1 ? 0 : 1,
        transition: "opacity 0.8s ease",
        background: "linear-gradient(160deg, #1C1C1C 0%, #1a1f1a 100%)",
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3"
    >
      {/* Top line */}
      <div style={{
        width: phase === 0 ? "60px" : "0px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
        transition: "width 1s ease",
      }} />

      {/* Main name */}
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          opacity: phase === 0 ? 1 : 0,
          transform: phase === 0 ? "translateY(0px)" : "translateY(-8px)",
          transition: "opacity 0.8s ease, transform 0.8s ease",
          transitionDelay: "0.2s",
          letterSpacing: "0.15em",
        }}
        className="text-[#F8F5F0] text-2xl md:text-3xl font-semibold text-center px-6"
      >
        Soul Nest Homestays
      </h1>

      {/* Tagline */}
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          opacity: phase === 0 ? 0.5 : 0,
          transition: "opacity 0.8s ease",
          transitionDelay: "0.5s",
          letterSpacing: "0.3em",
          fontSize: "10px",
        }}
        className="text-[#8B6914] uppercase tracking-widest"
      >
        Jorhat · Assam · India
      </p>

      {/* Bottom line */}
      <div style={{
        width: phase === 0 ? "60px" : "0px",
        height: "1px",
        background: "linear-gradient(90deg, transparent, #8B6914, transparent)",
        transition: "width 1s ease",
      }} />
    </div>
  )
}