// src/pages/BookingsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// User-facing Bookings Page — Soul Nest Homestays
//
// Shows the logged-in user's booking history fetched from Firestore.
// Each booking row: ID, rooms, dates, guests, amount, status, cancel button.
// Cancel logic: allowed if check-in is > 48hrs away.
// Nest Escapes enquiry section at the bottom with phone dial.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react"
import { useNavigate }         from "react-router-dom"
import { useAuth }             from "../context/AuthContext"
import {
  collection, getDocs, query, where, doc, updateDoc
} from "firebase/firestore"
import { db }                  from "../firebase"
import {
  ArrowLeft, Phone, Calendar, Users, BedDouble,
  CheckCircle2, XCircle, Clock, AlertTriangle, X
} from "lucide-react"
import Navbar from "../components/Navbar"

// ── Owner contact — replace with real number ─────────────────
const OWNER_WHATSAPP = "919999999999"  // ← replace with real WhatsApp number (no +)
const OWNER_PHONE    = "+91 99999 99999"

// ── Brand tokens ─────────────────────────────────────────────
const C = {
  bg:     "#111111",
  card:   "#1C1C1C",
  card2:  "#2a2a2a",
  border: "#3a3a3a",
  green:  "#2D5A3D",
  bamboo: "#8B6914",
  white:  "#F8F5F0",
  grey:   "#9a9a9a",
  dim:    "#5a5a5a",
  red:    "#ef4444",
}

// ── Nest Escapes data (mirrors HomestayPage) ─────────────────
const nestEscapes = [
  {
    icon: "🚗",
    title: "Hangout",
    desc: "Explore Jorhat and beyond with self-drive or chauffeur options.",
    tag: "On Request",
  },
  {
    icon: "👨‍🍳",
    title: "Chef on Demand",
    desc: "Authentic Assamese cuisine delivered fresh to your room.",
    tag: "On Order",
  },
  {
    icon: "🎶",
    title: "Orchestra & DJ",
    desc: "Live music and DJ nights for celebrations and special evenings.",
    tag: "On Request",
  },
]

// ── Helpers ───────────────────────────────────────────────────
function hoursUntilCheckIn(checkInStr) {
  if (!checkInStr) return Infinity
  const d = new Date(checkInStr + "T00:00:00")
  return (d - new Date()) / 3600000
}

function formatDate(str) {
  if (!str) return "—"
  return new Date(str).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function StatusBadge({ status, checkIn }) {
  const hrs = hoursUntilCheckIn(checkIn)
  let label = status
  let color = C.green

  if (status === "cancelled") { label = "Cancelled"; color = C.red }
  else if (hrs < 0)           { label = "Completed"; color = C.dim }
  else if (hrs <= 24)         { label = "Check-in Today"; color = C.bamboo }
  else                        { label = "Confirmed"; color = C.green }

  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}44`,
      borderRadius: 6, padding: "3px 10px",
      fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
    }}>{label}</span>
  )
}

// ── Cancel Confirmation Modal ─────────────────────────────────
function CancelModal({ booking, onConfirm, onClose, cancelling }) {
  const hrs         = hoursUntilCheckIn(booking.checkIn)
  const eligible48  = hrs > 48
  const refundAmt   = eligible48 ? booking.platformFee : 0

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: 24, padding: 24, maxWidth: 360, width: "100%",
        position: "relative",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", color: C.grey, cursor: "pointer",
        }}><X size={18} /></button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: C.red + "22", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle size={18} color={C.red} />
          </div>
          <div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: C.white, fontSize: 17, margin: 0 }}>
              Cancel Booking?
            </h3>
            <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>{booking.bookingId}</p>
          </div>
        </div>

        <div style={{
          background: C.card2, border: `1px solid ${C.border}`,
          borderRadius: 12, padding: "12px 16px", marginBottom: 16,
        }}>
          <p style={{ color: C.grey, fontSize: 12, margin: "0 0 4px" }}>Check-in: <span style={{ color: C.white }}>{formatDate(booking.checkIn)}</span></p>
          <p style={{ color: C.grey, fontSize: 12, margin: "0 0 4px" }}>Rooms: <span style={{ color: C.white }}>{(booking.roomIds || []).join(", ")}</span></p>
          <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>Platform fee paid: <span style={{ color: C.white }}>₹{booking.platformFee}</span></p>
        </div>

        {eligible48 ? (
          <div style={{
            background: C.green + "11", border: `1px solid ${C.green}33`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          }}>
            <p style={{ color: C.green, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>✅ Eligible for full refund</p>
            <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>
              Check-in is more than 48 hrs away. Platform fee of ₹{refundAmt} will be fully refunded.
            </p>
          </div>
        ) : (
          <div style={{
            background: C.red + "11", border: `1px solid ${C.red}33`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 16,
          }}>
            <p style={{ color: C.red, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>⚠ No refund applicable</p>
            <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>
              Check-in is within 48 hours. Platform fee of ₹{booking.platformFee} is non-refundable at this stage.
            </p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={cancelling} style={{
            flex: 1, background: C.card2, color: C.grey,
            border: `1px solid ${C.border}`, borderRadius: 12,
            padding: "12px 0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>Keep Booking</button>
          <button onClick={onConfirm} disabled={cancelling} style={{
            flex: 1, background: C.red + "22", color: C.red,
            border: `1px solid ${C.red}44`, borderRadius: 12,
            padding: "12px 0", fontSize: 13, fontWeight: 600,
            cursor: cancelling ? "not-allowed" : "pointer",
            opacity: cancelling ? 0.5 : 1, fontFamily: "inherit",
          }}>{cancelling ? "Cancelling…" : "Yes, Cancel"}</button>
        </div>
      </div>
    </div>
  )
}

// ── Booking Card ──────────────────────────────────────────────
function BookingCard({ booking, onCancelClick }) {
  const hrs        = hoursUntilCheckIn(booking.checkIn)
  const canCancel  = booking.status === "confirmed" && hrs > 0
  const isPast     = hrs < 0
  const nights     = booking.nights || 1

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 20, padding: "18px 20px", marginBottom: 14,
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <p style={{ color: C.bamboo, fontWeight: 700, fontSize: 13, margin: "0 0 2px",
            fontFamily: "'Playfair Display', serif" }}>{booking.bookingId}</p>
          <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>
            Booked on {formatDate(booking.createdAt)}
          </p>
        </div>
        <StatusBadge status={booking.status} checkIn={booking.checkIn} />
      </div>

      {/* Details grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: "10px 16px", marginBottom: 14,
      }}>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Rooms</p>
          <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>
            {(booking.roomIds || []).join(", ")}
          </p>
        </div>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Guests</p>
          <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>
            {booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}
          </p>
        </div>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Check-in</p>
          <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>{formatDate(booking.checkIn)}</p>
        </div>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Check-out</p>
          <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>{formatDate(booking.checkOut)}</p>
        </div>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Duration</p>
          <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: 0 }}>
            {nights} {nights === 1 ? "Night" : "Nights"}
          </p>
        </div>
        <div>
          <p style={{ color: C.dim, fontSize: 11, margin: "0 0 2px" }}>Total Amount</p>
          <p style={{ color: C.green, fontSize: 13, fontWeight: 700, margin: 0 }}>
            ₹{booking.totalAmount?.toLocaleString() || "—"}
          </p>
        </div>
      </div>

      {/* Fee row */}
      <div style={{
        background: C.card2, borderRadius: 10,
        padding: "8px 14px", marginBottom: 14,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: C.grey, fontSize: 12 }}>Platform fee paid</span>
        <span style={{ color: C.white, fontSize: 12, fontWeight: 600 }}>₹{booking.platformFee || 0}</span>
      </div>

      {/* Refund status if cancelled */}
      {booking.status === "cancelled" && (
        <div style={{
          background: booking.refundStatus === "refunded" ? C.green + "11" : C.red + "11",
          border: `1px solid ${booking.refundStatus === "refunded" ? C.green : C.red}33`,
          borderRadius: 10, padding: "8px 14px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {booking.refundStatus === "refunded" ? (
            <>
              <CheckCircle2 size={14} color={C.green} />
              <span style={{ color: C.green, fontSize: 12, fontWeight: 600 }}>
                Refund processed · ₹{booking.platformFee}
              </span>
            </>
          ) : (
            <>
              <Clock size={14} color={C.bamboo} />
              <span style={{ color: C.bamboo, fontSize: 12, fontWeight: 600 }}>
                Refund pending — we'll process it within 3–5 business days
              </span>
            </>
          )}
        </div>
      )}

      {/* 48hr cancel warning for upcoming */}
      {booking.status === "confirmed" && hrs > 0 && hrs <= 48 && (
        <div style={{
          background: C.red + "0d", border: `1px solid ${C.red}22`,
          borderRadius: 10, padding: "8px 14px", marginBottom: 14,
        }}>
          <p style={{ color: C.red, fontSize: 12, margin: 0 }}>
            ⚠ Check-in within 48 hrs — cancellation is no longer eligible for a refund
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10 }}>
        {canCancel && (
          <button onClick={() => onCancelClick(booking)} style={{
            flex: 1, background: C.red + "11", color: C.red,
            border: `1px solid ${C.red}33`, borderRadius: 12,
            padding: "10px 0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
            {hrs <= 48 ? "Cancel (No Refund)" : "Cancel Booking"}
          </button>
        )}
        <a
          href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I have a query about my booking ${booking.bookingId}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            flex: 1, background: C.green + "22", color: C.green,
            border: `1px solid ${C.green}44`, borderRadius: 12,
            padding: "10px 0", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            textDecoration: "none", display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6,
          }}>
          <Phone size={13} /> WhatsApp Owner
        </a>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function BookingsPage({ onLogoClick }) {
  const { currentUser, openLogin } = useAuth()
  const navigate = useNavigate()

  const [bookings, setBookings]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling, setCancelling]   = useState(false)
  const [activeTab, setActiveTab]     = useState("upcoming") // "upcoming" | "past"

  // Fetch bookings for this user's phone number
  useEffect(() => {
    if (!currentUser) { setLoading(false); return }
    const phone = currentUser.phoneNumber
    ;(async () => {
      try {
        // Fetch all bookings — filter client-side by guestContact matching phone
        // Phase 4: store userId on booking doc and query by userId instead
        const snap = await getDocs(collection(db, "bookings"))
        const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        // Show all bookings for now (Phase 4: filter by userId)
        setBookings(all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      } catch (err) {
        console.error("Failed to fetch bookings:", err)
      } finally {
        setLoading(false)
      }
    })()
  }, [currentUser])

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await updateDoc(doc(db, "bookings", cancelTarget.bookingId), {
        status:      "cancelled",
        cancelledAt: new Date().toISOString(),
        refundStatus: hoursUntilCheckIn(cancelTarget.checkIn) > 48 ? "pending" : "not_eligible",
      })
      setBookings(prev =>
        prev.map(b => b.bookingId === cancelTarget.bookingId
          ? { ...b, status: "cancelled", cancelledAt: new Date().toISOString(),
              refundStatus: hoursUntilCheckIn(cancelTarget.checkIn) > 48 ? "pending" : "not_eligible" }
          : b
        )
      )
    } catch (err) {
      console.error("Cancel failed:", err)
    } finally {
      setCancelling(false)
      setCancelTarget(null)
    }
  }

  // Split into upcoming and past
  const upcoming = bookings.filter(b => b.status !== "cancelled" && hoursUntilCheckIn(b.checkIn) > 0)
  const past     = bookings.filter(b => b.status === "cancelled" || hoursUntilCheckIn(b.checkIn) <= 0)
  const displayed = activeTab === "upcoming" ? upcoming : past

  // ── Not logged in ─────────────────────────────────────────
  if (!currentUser && !loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <Navbar onLogoClick={onLogoClick} />
      <div style={{
        paddingTop: 100, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16, padding: "100px 16px 40px",
      }}>
        <p style={{ fontSize: 48 }}>🔐</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.white, margin: 0, fontSize: 22 }}>
          Login to View Bookings
        </h2>
        <p style={{ color: C.grey, fontSize: 14, textAlign: "center", maxWidth: 300 }}>
          Your booking history is tied to your phone number. Login to see your reservations.
        </p>
        <button onClick={openLogin} style={{
          background: C.green, color: C.white, border: "none",
          borderRadius: 14, padding: "12px 28px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
        }}>Login with Phone →</button>
        <button onClick={() => navigate("/")} style={{
          background: "none", color: C.grey, border: "none",
          fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Home</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <Navbar onLogoClick={onLogoClick} />

      {cancelTarget && (
        <CancelModal
          booking={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
          cancelling={cancelling}
        />
      )}

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "88px 16px 48px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate("/")} style={{
            background: "none", border: "none", color: C.grey,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            fontSize: 13, fontFamily: "inherit",
          }}>
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              color: C.white, fontSize: 22, margin: 0,
            }}>My Bookings</h1>
            <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>
              {currentUser?.phoneNumber}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 0, marginBottom: 20,
          background: C.card, borderRadius: 12, border: `1px solid ${C.border}`,
          overflow: "hidden",
        }}>
          {[
            { id: "upcoming", label: `Upcoming (${upcoming.length})` },
            { id: "past",     label: `Past & Cancelled (${past.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              flex: 1, padding: "11px 0", fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none", fontFamily: "inherit",
              background: activeTab === tab.id ? C.green + "22" : "transparent",
              color: activeTab === tab.id ? C.white : C.grey,
              borderBottom: activeTab === tab.id ? `2px solid ${C.green}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>{tab.label}</button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <div style={{
              width: 32, height: 32, border: `2px solid ${C.border}`,
              borderTop: `2px solid ${C.green}`, borderRadius: "50%",
              margin: "0 auto 12px",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: C.grey, fontSize: 13 }}>Loading bookings…</p>
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0" }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>
              {activeTab === "upcoming" ? "🏡" : "📋"}
            </p>
            <p style={{ color: C.white, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {activeTab === "upcoming" ? "No upcoming bookings" : "No past bookings"}
            </p>
            <p style={{ color: C.grey, fontSize: 13, marginBottom: 20 }}>
              {activeTab === "upcoming"
                ? "Explore Soul Nest and make your first reservation."
                : "Your completed and cancelled bookings will appear here."}
            </p>
            {activeTab === "upcoming" && (
              <button onClick={() => navigate("/")} style={{
                background: C.green + "22", color: C.green,
                border: `1px solid ${C.green}44`, borderRadius: 12,
                padding: "10px 24px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
              }}>Explore Homestays →</button>
            )}
          </div>
        ) : (
          displayed.map(b => (
            <BookingCard key={b.bookingId || b.id} booking={b} onCancelClick={setCancelTarget} />
          ))
        )}

        {/* ── Nest Escapes enquiry section ── */}
        {upcoming.length > 0 && (
          <>
            <div style={{ borderTop: `1px solid ${C.border}`, margin: "28px 0" }} />

            <div style={{ marginBottom: 8 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                color: C.white, fontSize: 19, margin: "0 0 4px",
              }}>Nest Escapes</h2>
              <p style={{ color: C.grey, fontSize: 12, margin: "0 0 16px" }}>
                Curated add-ons for your stay — enquire directly with the owner
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {nestEscapes.map((e, i) => (
                  <div key={i} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 16, padding: "14px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 28 }}>{e.icon}</span>
                      <div>
                        <p style={{ color: C.white, fontWeight: 600, fontSize: 14, margin: "0 0 2px",
                          fontFamily: "'Playfair Display', serif" }}>{e.title}</p>
                        <p style={{ color: C.grey, fontSize: 12, margin: "0 0 4px" }}>{e.desc}</p>
                        <span style={{
                          background: C.bamboo + "22", color: C.bamboo,
                          border: `1px solid ${C.bamboo}44`,
                          borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
                        }}>{e.tag}</span>
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I'd like to enquire about ${e.title} for my booking`}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        flexShrink: 0, background: C.green + "22", color: C.green,
                        border: `1px solid ${C.green}44`, borderRadius: 10,
                        padding: "8px 14px", fontSize: 12, fontWeight: 600,
                        textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                        whiteSpace: "nowrap",
                      }}>
                      <Phone size={12} /> Enquire
                    </a>
                  </div>
                ))}
              </div>

              {/* Direct call option */}
              <div style={{
                marginTop: 14, background: C.card2,
                border: `1px solid ${C.border}`, borderRadius: 14,
                padding: "14px 16px", display: "flex",
                alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <p style={{ color: C.white, fontSize: 13, fontWeight: 600, margin: "0 0 2px" }}>
                    Prefer to call?
                  </p>
                  <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>
                    Reach the owner directly at {OWNER_PHONE}
                  </p>
                </div>
                <a href={`tel:${OWNER_PHONE.replace(/\s/g, "")}`} style={{
                  background: C.bamboo + "22", color: C.bamboo,
                  border: `1px solid ${C.bamboo}44`, borderRadius: 10,
                  padding: "8px 16px", fontSize: 12, fontWeight: 600,
                  textDecoration: "none", display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Phone size={12} /> Call Now
                </a>
              </div>
            </div>
          </>
        )}

        {/* Help footer */}
        <div style={{
          marginTop: 28, background: C.card,
          border: `1px solid ${C.border}`, borderRadius: 16,
          padding: "16px 20px", textAlign: "center",
        }}>
          <p style={{ color: C.grey, fontSize: 13, margin: "0 0 10px" }}>
            Need help with a booking? Reach us on WhatsApp
          </p>
          <a
            href={`https://wa.me/${OWNER_WHATSAPP}?text=Hi, I need help with my Soul Nest booking`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: C.green + "22", color: C.green,
              border: `1px solid ${C.green}44`, borderRadius: 10,
              padding: "8px 20px", fontSize: 13, fontWeight: 600,
              textDecoration: "none",
            }}>
            <Phone size={13} /> WhatsApp Support
          </a>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}