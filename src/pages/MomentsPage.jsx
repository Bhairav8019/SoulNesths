import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, ChevronLeft, ChevronRight, Camera, Upload, Sparkles } from "lucide-react"
import Navbar from "../components/Navbar"

// ─── ADD YOUR CURATED IMAGES HERE ───────────────────────────────────────────
// Drop images into /public/moments/ and list them below
// Each entry: { src: "/moments/filename.jpg", caption: "optional caption", location: "optional location" }
const FEATURED_MOMENTS = [
  // { src: "/moments/image1.jpg", caption: "Morning mist over Majuli", location: "Majuli, Assam" },
  // { src: "/moments/image2.jpg", caption: "Kaziranga at golden hour", location: "Kaziranga, Assam" },
  // { src: "/moments/image3.jpg", caption: "Tea garden trails", location: "Jorhat, Assam" },
]
// ────────────────────────────────────────────────────────────────────────────

// Replace with your WhatsApp number (international format, no + or spaces)
const WHATSAPP_NUMBER = "917035464202"

export default function MomentsPage({ onLogoClick, loggedIn }) {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState("right")
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadPreview, setUploadPreview] = useState(null)
  const [uploaderName, setUploaderName] = useState("")
  const [uploaderCaption, setUploaderCaption] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const fileRef = useRef(null)
  const autoRef = useRef(null)

  const hasImages = FEATURED_MOMENTS.length > 0

  const go = (dir) => {
    if (animating || !hasImages || FEATURED_MOMENTS.length < 2) return
    setDirection(dir)
    setAnimating(true)
    setTimeout(() => {
      setCurrent(prev =>
        dir === "right"
          ? (prev + 1) % FEATURED_MOMENTS.length
          : (prev - 1 + FEATURED_MOMENTS.length) % FEATURED_MOMENTS.length
      )
      setAnimating(false)
    }, 380)
  }

  // Auto-advance slideshow
  useEffect(() => {
    if (!hasImages || FEATURED_MOMENTS.length < 2) return
    autoRef.current = setInterval(() => go("right"), 5000)
    return () => clearInterval(autoRef.current)
  }, [hasImages])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadFile(file)
    setUploadPreview(URL.createObjectURL(file))
    setSubmitted(false)
  }

  const handleShare = () => {
    if (!uploadFile) return
    const name = uploaderName.trim() || "A Soul Nest Guest"
    const caption = uploaderCaption.trim() || "No caption"
    const text = encodeURIComponent(
      `✨ New Moment Submission\n\nFrom: ${name}\nCaption: "${caption}"\n\n📸 Image attached separately from Soul Nest Homestays app.`
    )
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank")
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0d0d] via-[#111410] to-[#0d0d0d]">
      <Navbar onLogoClick={onLogoClick} loggedIn={loggedIn} />

      <div className="pt-24 pb-32 max-w-4xl mx-auto px-4">

        {/* Back */}
        <button onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#9a9a9a] hover:text-[#F8F5F0] transition mb-10 text-sm">
          <ArrowLeft size={15} /> Back to Home
        </button>

        {/* ── HERO HEADING ── */}
        <div className="text-center mb-14 relative">
          {/* Decorative line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#8B6914]" />
            <Sparkles size={14} className="text-[#8B6914]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#8B6914]" />
          </div>

          <h1
            style={{ fontFamily: "'Playfair Display', serif", lineHeight: 1.2 }}
            className="text-[#F8F5F0] text-3xl md:text-5xl font-bold mb-5 tracking-wide">
            Where Every Journey
            <br />
            <span style={{
              background: "linear-gradient(90deg, #8B6914, #C8A84B, #8B6914)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Becomes a Memory
            </span>
          </h1>

          <p
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-[#9a9a9a] text-lg md:text-xl max-w-xl mx-auto leading-relaxed italic">
            You and us — sharing soulful travel experiences,
            preserved beautifully, forever.
          </p>

          {/* Decorative bottom line */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-px w-24 bg-gradient-to-r from-transparent to-[#2D5A3D]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#2D5A3D]" />
            <div className="h-px w-24 bg-gradient-to-l from-transparent to-[#2D5A3D]" />
          </div>
        </div>

        {/* ── SLIDESHOW ── */}
        <div className="relative mb-6">
          {hasImages ? (
            <>
              {/* Slideshow frame */}
              <div className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border border-[#2a2a2a] shadow-[0_0_60px_rgba(139,105,20,0.12)]">

                {/* Image */}
                <div
                  key={current}
                  style={{
                    animation: animating
                      ? direction === "right"
                        ? "slideOutLeft 0.38s ease forwards"
                        : "slideOutRight 0.38s ease forwards"
                      : direction === "right"
                        ? "slideInRight 0.38s ease forwards"
                        : "slideInLeft 0.38s ease forwards",
                  }}
                  className="absolute inset-0">
                  <img
                    src={FEATURED_MOMENTS[current].src}
                    alt={FEATURED_MOMENTS[current].caption || "Moment"}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />

                  {/* Caption */}
                  {(FEATURED_MOMENTS[current].caption || FEATURED_MOMENTS[current].location) && (
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      {FEATURED_MOMENTS[current].caption && (
                        <p
                          style={{ fontFamily: "'Playfair Display', serif" }}
                          className="text-[#F8F5F0] text-lg font-semibold mb-1">
                          {FEATURED_MOMENTS[current].caption}
                        </p>
                      )}
                      {FEATURED_MOMENTS[current].location && (
                        <p className="text-[#8B6914] text-sm tracking-widest uppercase">
                          {FEATURED_MOMENTS[current].location}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Corner ornaments */}
                {["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-6 h-6`} style={{
                    borderTop: i < 2 ? "1px solid rgba(139,105,20,0.5)" : "none",
                    borderBottom: i >= 2 ? "1px solid rgba(139,105,20,0.5)" : "none",
                    borderLeft: i % 2 === 0 ? "1px solid rgba(139,105,20,0.5)" : "none",
                    borderRight: i % 2 === 1 ? "1px solid rgba(139,105,20,0.5)" : "none",
                  }} />
                ))}
              </div>

              {/* Navigation arrows */}
              {FEATURED_MOMENTS.length > 1 && (
                <>
                  <button
                    onClick={() => go("left")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-[#8B6914]/40 bg-black/60 text-[#F8F5F0] hover:bg-[#8B6914]/30 hover:border-[#8B6914] transition backdrop-blur-sm">
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => go("right")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full flex items-center justify-center border border-[#8B6914]/40 bg-black/60 text-[#F8F5F0] hover:bg-[#8B6914]/30 hover:border-[#8B6914] transition backdrop-blur-sm">
                    <ChevronRight size={18} />
                  </button>

                  {/* Dot indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {FEATURED_MOMENTS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => { setDirection(i > current ? "right" : "left"); setCurrent(i) }}
                        className="transition-all duration-300 rounded-full"
                        style={{
                          width: i === current ? "20px" : "6px",
                          height: "6px",
                          background: i === current ? "#8B6914" : "#3a3a3a",
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            // Placeholder when no images added yet
            <div className="w-full aspect-[16/9] rounded-3xl border border-[#2a2a2a] border-dashed flex flex-col items-center justify-center gap-4 bg-[#111]">
              <Camera size={40} className="text-[#3a3a3a]" />
              <p style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[#4a4a4a] text-lg">Moments coming soon</p>
              <p className="text-[#3a3a3a] text-xs text-center max-w-xs">
                Add images to <code className="text-[#8B6914]">/public/moments/</code> and list them in <code className="text-[#8B6914]">MomentsPage.jsx</code>
              </p>
            </div>
          )}
        </div>

        {/* ── SHARE YOUR MOMENTS (logged-in only) ── */}
        {loggedIn ? (
          <div className="mt-12 border border-[#2a2a2a] rounded-3xl p-6 bg-[#111410]"
            style={{ boxShadow: "0 0 40px rgba(45,90,61,0.08)" }}>

            {/* Section header */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px w-10 bg-[#2D5A3D]" />
                <Upload size={14} className="text-[#2D5A3D]" />
                <div className="h-px w-10 bg-[#2D5A3D]" />
              </div>
              <h2
                style={{ fontFamily: "'Playfair Display', serif" }}
                className="text-[#F8F5F0] text-xl font-bold mb-1">
                Share Your Moment
              </h2>
              <p className="text-[#9a9a9a] text-sm italic">
                Get featured — your memory could inspire the next traveller's journey
              </p>
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileRef.current?.click()}
              className="relative w-full aspect-[16/7] rounded-2xl border border-dashed border-[#2D5A3D]/50 overflow-hidden cursor-pointer hover:border-[#2D5A3D] transition group mb-4 bg-[#0d0d0d]">
              {uploadPreview ? (
                <img src={uploadPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-[#2D5A3D]/50 flex items-center justify-center group-hover:border-[#2D5A3D] transition">
                    <Camera size={20} className="text-[#2D5A3D]" />
                  </div>
                  <p className="text-[#9a9a9a] text-sm">Tap to choose a photo</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Name + caption inputs */}
            <div className="flex flex-col gap-3 mb-4">
              <input
                type="text"
                placeholder="Your name (optional)"
                value={uploaderName}
                onChange={e => setUploaderName(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#F8F5F0] placeholder-[#4a4a4a] focus:outline-none focus:border-[#2D5A3D] transition"
                style={{ fontFamily: "'Playfair Display', serif" }}
              />
              <input
                type="text"
                placeholder="Caption or location (optional)"
                value={uploaderCaption}
                onChange={e => setUploaderCaption(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-[#F8F5F0] placeholder-[#4a4a4a] focus:outline-none focus:border-[#2D5A3D] transition"
                style={{ fontFamily: "'Playfair Display', serif" }}
              />
            </div>

            {/* Submit button */}
            {submitted ? (
              <div className="w-full py-4 rounded-2xl bg-[#1a2a1a] border border-[#2D5A3D]/40 flex items-center justify-center gap-2">
                <Sparkles size={15} className="text-[#2D5A3D]" />
                <span className="text-[#2D5A3D] text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Sent! We'll review and feature it soon.
                </span>
              </div>
            ) : (
              <button
                onClick={handleShare}
                disabled={!uploadFile}
                className="w-full py-4 rounded-2xl text-sm font-semibold tracking-wide transition"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  background: uploadFile
                    ? "linear-gradient(135deg, #2D5A3D, #3a7a52)"
                    : "#1a1a1a",
                  color: uploadFile ? "#F8F5F0" : "#4a4a4a",
                  border: uploadFile ? "1px solid #2D5A3D" : "1px solid #2a2a2a",
                  cursor: uploadFile ? "pointer" : "not-allowed",
                }}>
                ✦ Share Your Moments · Get Featured
              </button>
            )}

            <p className="text-center text-[#3a3a3a] text-xs mt-3">
              Submitted photos are reviewed before being featured
            </p>
          </div>
        ) : (
          // Non-logged-in teaser
          <div className="mt-12 border border-[#2a2a2a] rounded-3xl p-6 bg-[#111410] text-center">
            <Camera size={28} className="text-[#3a3a3a] mx-auto mb-3" />
            <h3
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-[#F8F5F0] text-lg font-semibold mb-1">
              Share Your Moments
            </h3>
            <p className="text-[#9a9a9a] text-sm mb-5 italic">
              Login to submit your travel photos and get featured
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-2xl text-sm font-semibold text-[#F8F5F0] border border-[#2D5A3D] hover:bg-[#2D5A3D] transition"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Login to Contribute
            </button>
          </div>
        )}
      </div>

      {/* Slideshow animation styles */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-60px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-60px); opacity: 0; }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(60px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}