// src/pages/AdminPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Soul Nest Admin Dashboard
// Protected by hardcoded admin phone number check via Firebase Auth.
// Sections: Bookings, Availability, Pricing, Reviews, Moments, Refunds
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import {
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc
} from "firebase/firestore"
import { db } from "../firebase"
import {
  getAllBookings, cancelBooking, restoreRoom
} from "../data/roomAvailability"
import { homestays } from "../data/homestays"

// ── Admin phone whitelist ────────────────────────────────────
const ADMIN_PHONES = ["+917035464202"]

// ── Soul Nest brand tokens ───────────────────────────────────
const C = {
  bg:     "#111111",
  card:   "#1C1C1C",
  card2:  "#242424",
  border: "#2e2e2e",
  green:  "#2D5A3D",
  bamboo: "#8B6914",
  white:  "#F8F5F0",
  grey:   "#9a9a9a",
  dim:    "#5a5a5a",
  red:    "#ef4444",
  amber:  "#f59e0b",
}

const HOMESTAY = homestays[0]
const ROOM_IDS = HOMESTAY.rooms.map(r => r.id)

// ── Tiny UI helpers ──────────────────────────────────────────
const Badge = ({ color, children }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
  }}>{children}</span>
)

const Btn = ({ onClick, children, color = C.green, disabled, small, danger }) => (
  <button onClick={onClick} disabled={disabled}
    style={{
      background: danger ? "#ef444422" : color + "22",
      color: danger ? C.red : color,
      border: `1px solid ${danger ? C.red : color}44`,
      borderRadius: 8, padding: small ? "4px 12px" : "8px 18px",
      fontSize: small ? 12 : 13, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1, transition: "all 0.15s",
      fontFamily: "inherit",
    }}>{children}</button>
)

const Input = ({ value, onChange, placeholder, type = "text", style = {} }) => (
  <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    style={{
      background: "#2a2a2a", border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "8px 12px", color: C.white,
      fontSize: 13, outline: "none", fontFamily: "inherit", ...style,
    }} />
)

const SectionHeader = ({ icon, title, sub }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <h2 style={{
        fontFamily: "'Playfair Display', serif", fontSize: 20,
        color: C.white, margin: 0,
      }}>{title}</h2>
    </div>
    {sub && <p style={{ color: C.grey, fontSize: 12, marginTop: 4, marginLeft: 30 }}>{sub}</p>}
  </div>
)

// ═══════════════════════════════════════════════════════════════
// SECTION: Bookings List
// ═══════════════════════════════════════════════════════════════
function BookingsSection() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getAllBookings().then(b => {
      setBookings(b.sort((a, z) => new Date(z.createdAt) - new Date(a.createdAt)))
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: C.grey }}>Loading bookings…</p>
  if (!bookings.length) return <p style={{ color: C.grey }}>No bookings yet.</p>

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {["Booking ID","Rooms","Check-in","Check-out","Nights","Guests","Total","Fee","Status","Created"].map(h => (
              <th key={h} style={{ color: C.bamboo, fontWeight: 600, padding: "8px 12px", textAlign: "left", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b, i) => (
            <tr key={b.bookingId} style={{
              borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? "transparent" : "#ffffff05",
            }}>
              <td style={{ padding: "10px 12px", color: C.bamboo, fontWeight: 600, whiteSpace: "nowrap" }}>{b.bookingId}</td>
              <td style={{ padding: "10px 12px", color: C.white }}>{(b.roomIds || []).join(", ")}</td>
              <td style={{ padding: "10px 12px", color: C.grey, whiteSpace: "nowrap" }}>{b.checkIn}</td>
              <td style={{ padding: "10px 12px", color: C.grey, whiteSpace: "nowrap" }}>{b.checkOut}</td>
              <td style={{ padding: "10px 12px", color: C.white, textAlign: "center" }}>{b.nights}</td>
              <td style={{ padding: "10px 12px", color: C.white, textAlign: "center" }}>{b.guests}</td>
              <td style={{ padding: "10px 12px", color: C.green, fontWeight: 600 }}>₹{b.totalAmount?.toLocaleString()}</td>
              <td style={{ padding: "10px 12px", color: C.grey }}>₹{b.platformFee}</td>
              <td style={{ padding: "10px 12px" }}>
                <Badge color={b.status === "confirmed" ? C.green : C.red}>{b.status}</Badge>
              </td>
              <td style={{ padding: "10px 12px", color: C.dim, whiteSpace: "nowrap", fontSize: 11 }}>
                {new Date(b.createdAt).toLocaleDateString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: Room Availability Toggle
// ═══════════════════════════════════════════════════════════════
function AvailabilitySection() {
  const [availability, setAvailability] = useState({})
  const [loading, setLoading]           = useState(true)
  const [saving, setSaving]             = useState(null)

  const fetchAll = async () => {
    const result = {}
    for (const roomId of ROOM_IDS) {
      const docId = `${HOMESTAY.id}_${roomId}`
      const snap  = await getDoc(doc(db, "roomAvailability", docId))
      result[roomId] = snap.exists() ? snap.data() : { booked: false, roomId, homestayId: HOMESTAY.id }
    }
    setAvailability(result)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  const toggle = async (roomId) => {
    setSaving(roomId)
    const current   = availability[roomId]
    const docId     = `${HOMESTAY.id}_${roomId}`
    const newBooked = !current.booked
    await setDoc(doc(db, "roomAvailability", docId), {
      roomId, homestayId: HOMESTAY.id,
      booked: newBooked,
      checkOutDate:      newBooked ? null : null,
      bookingId:         newBooked ? "ADMIN_BLOCK" : null,
      bookedAt:          newBooked ? new Date().toISOString() : null,
      blockedByConflict: false,
    })
    await fetchAll()
    setSaving(null)
  }

  if (loading) return <p style={{ color: C.grey }}>Loading…</p>

  const roomLabels = {
    "standard":     "Standard Room",
    "deluxe":       "Deluxe Room",
    "premium-1bhk": "Premium 1BHK",
    "premium-2bhk": "Premium 2BHK",
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
      {ROOM_IDS.map(roomId => {
        const av     = availability[roomId] || {}
        const booked = av.booked
        return (
          <div key={roomId} style={{
            background: C.card2, border: `1px solid ${booked ? C.red + "44" : C.green + "44"}`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: C.white, fontWeight: 600, fontSize: 14 }}>{roomLabels[roomId] || roomId}</span>
              <Badge color={booked ? C.red : C.green}>{booked ? "Blocked" : "Available"}</Badge>
            </div>
            {av.bookingId && av.bookingId !== "ADMIN_BLOCK" && (
              <p style={{ color: C.dim, fontSize: 11, marginBottom: 8 }}>Booking: {av.bookingId}</p>
            )}
            {av.checkOutDate && (
              <p style={{ color: C.dim, fontSize: 11, marginBottom: 8 }}>Until: {av.checkOutDate}</p>
            )}
            <Btn onClick={() => toggle(roomId)} disabled={saving === roomId} danger={!booked} color={C.green} small>
              {saving === roomId ? "…" : booked ? "Mark Available" : "Block Room"}
            </Btn>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: Pricing Manager
// Firestore collection: pricing/{homestayId_roomId}
// Fields: roomId, regularPrice, discountPrice (optional), platformFee
// HomestayPage reads this collection on load and overrides homestays.js values.
// ═══════════════════════════════════════════════════════════════
function PricingSection() {
  const [prices, setPrices]   = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)
  const [saved, setSaved]     = useState(null)

  const roomLabels = {
    "standard":     "Standard Room",
    "deluxe":       "Deluxe Room",
    "premium-1bhk": "Premium 1BHK",
    "premium-2bhk": "Premium 2BHK",
  }

  // Load current prices — Firestore first, fallback to homestays.js
  const fetchPrices = async () => {
    const result = {}
    for (const room of HOMESTAY.rooms) {
      const docId = `${HOMESTAY.id}_${room.id}`
      const snap  = await getDoc(doc(db, "pricing", docId))
      if (snap.exists()) {
        result[room.id] = snap.data()
      } else {
        // Seed from homestays.js defaults
        result[room.id] = {
          roomId:        room.id,
          homestayId:    HOMESTAY.id,
          regularPrice:  room.regularPrice,
          discountPrice: room.discountPrice || "",
          platformFee:   149,
        }
      }
    }
    setPrices(result)
    setLoading(false)
  }

  useEffect(() => { fetchPrices() }, [])

  const handleChange = (roomId, field, value) => {
    setPrices(p => ({
      ...p,
      [roomId]: { ...p[roomId], [field]: value === "" ? "" : Number(value) },
    }))
  }

  const saveRoom = async (roomId) => {
    setSaving(roomId)
    const p     = prices[roomId]
    const docId = `${HOMESTAY.id}_${roomId}`
    await setDoc(doc(db, "pricing", docId), {
      roomId,
      homestayId:    HOMESTAY.id,
      regularPrice:  Number(p.regularPrice) || 0,
      discountPrice: p.discountPrice !== "" ? Number(p.discountPrice) : null,
      platformFee:   Number(p.platformFee) || 149,
      updatedAt:     new Date().toISOString(),
    })
    setSaving(null)
    setSaved(roomId)
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading) return <p style={{ color: C.grey }}>Loading prices…</p>

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Platform fee note */}
      <div style={{
        background: C.bamboo + "11", border: `1px solid ${C.bamboo}33`,
        borderRadius: 10, padding: "12px 16px",
      }}>
        <p style={{ color: C.bamboo, fontSize: 12, margin: 0 }}>
          💡 Platform fee is charged per room selected. Changes here reflect live on the booking card.
          Leave Discount Price blank to show only the regular price.
        </p>
      </div>

      {HOMESTAY.rooms.map(room => {
        const p = prices[room.id] || {}
        return (
          <div key={room.id} style={{
            background: C.card2, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: "18px 20px",
          }}>
            <p style={{
              color: C.white, fontWeight: 600, fontSize: 15,
              fontFamily: "'Playfair Display', serif", marginBottom: 14,
            }}>{roomLabels[room.id] || room.id}</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ color: C.grey, fontSize: 11, display: "block", marginBottom: 5 }}>
                  Regular Price (₹/night)
                </label>
                <Input
                  type="number"
                  value={p.regularPrice ?? ""}
                  onChange={e => handleChange(room.id, "regularPrice", e.target.value)}
                  placeholder="e.g. 2500"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ color: C.grey, fontSize: 11, display: "block", marginBottom: 5 }}>
                  Discount Price (₹/night) <span style={{ color: C.dim }}>· optional</span>
                </label>
                <Input
                  type="number"
                  value={p.discountPrice ?? ""}
                  onChange={e => handleChange(room.id, "discountPrice", e.target.value)}
                  placeholder="Leave blank to hide"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ color: C.grey, fontSize: 11, display: "block", marginBottom: 5 }}>
                  Platform Fee (₹/room)
                </label>
                <Input
                  type="number"
                  value={p.platformFee ?? ""}
                  onChange={e => handleChange(room.id, "platformFee", e.target.value)}
                  placeholder="e.g. 149"
                  style={{ width: "100%", boxSizing: "border-box" }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{
              display: "flex", gap: 16, alignItems: "center",
              marginBottom: 14, padding: "8px 12px",
              background: "#ffffff06", borderRadius: 8,
            }}>
              <span style={{ color: C.dim, fontSize: 12 }}>Preview:</span>
              {p.discountPrice ? (
                <>
                  <span style={{ color: C.dim, fontSize: 13, textDecoration: "line-through" }}>₹{p.regularPrice?.toLocaleString()}</span>
                  <span style={{ color: C.green, fontWeight: 700, fontSize: 15 }}>₹{Number(p.discountPrice).toLocaleString()}</span>
                  <Badge color={C.green}>
                    {Math.round((1 - p.discountPrice / p.regularPrice) * 100)}% off
                  </Badge>
                </>
              ) : (
                <span style={{ color: C.white, fontWeight: 700, fontSize: 15 }}>₹{p.regularPrice?.toLocaleString()}</span>
              )}
              <span style={{ color: C.dim, fontSize: 12, marginLeft: "auto" }}>
                Platform fee: ₹{p.platformFee}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Btn onClick={() => saveRoom(room.id)} disabled={saving === room.id}>
                {saving === room.id ? "Saving…" : "Save Prices"}
              </Btn>
              {saved === room.id && (
                <span style={{ color: C.green, fontSize: 12 }}>✓ Saved</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: Reviews Manager
// ═══════════════════════════════════════════════════════════════
function ReviewsSection() {
  const [reviews, setReviews]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [form, setForm]         = useState({ name: "", location: "", text: "", rating: 5, tag: "" })
  const [saving, setSaving]     = useState(false)

  const fetchReviews = async () => {
    const snap = await getDocs(collection(db, "reviews"))
    setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    setLoading(false)
  }

  useEffect(() => { fetchReviews() }, [])

  const addReview = async () => {
    if (!form.name || !form.text || !form.rating) return
    setSaving(true)
    await addDoc(collection(db, "reviews"), {
      ...form,
      rating: Number(form.rating),
      createdAt: new Date().toISOString(),
      homestayId: HOMESTAY.id,
    })
    setForm({ name: "", location: "", text: "", rating: 5, tag: "" })
    await fetchReviews()
    setSaving(false)
  }

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review?")) return
    await deleteDoc(doc(db, "reviews", id))
    setReviews(r => r.filter(x => x.id !== id))
  }

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : "—"

  return (
    <div>
      <div style={{
        background: C.card2, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 18, marginBottom: 20,
      }}>
        <p style={{ color: C.bamboo, fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Add Review</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Guest name" />
          <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Location (e.g. Delhi)" />
          <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder='Tag (e.g. "Family Stay")' />
          <Input type="number" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} placeholder="Rating (1-5)" style={{ width: "100%" }} />
        </div>
        <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
          placeholder="Review text…" rows={3}
          style={{
            width: "100%", background: "#2a2a2a", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "8px 12px", color: C.white, fontSize: 13,
            outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box",
            marginBottom: 10,
          }} />
        <Btn onClick={addReview} disabled={saving}>{saving ? "Saving…" : "Add Review"}</Btn>
      </div>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ background: C.card2, borderRadius: 10, padding: "10px 18px", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.grey, fontSize: 11 }}>Total Reviews</span>
          <p style={{ color: C.white, fontWeight: 700, fontSize: 22, margin: 0 }}>{reviews.length}</p>
        </div>
        <div style={{ background: C.card2, borderRadius: 10, padding: "10px 18px", border: `1px solid ${C.border}` }}>
          <span style={{ color: C.grey, fontSize: 11 }}>Average Rating</span>
          <p style={{ color: C.bamboo, fontWeight: 700, fontSize: 22, margin: 0 }}>⭐ {avg}</p>
        </div>
      </div>

      {loading ? <p style={{ color: C.grey }}>Loading…</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map(r => (
            <div key={r.id} style={{
              background: C.card2, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: "12px 16px",
              display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ color: C.white, fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                  {r.location && <span style={{ color: C.dim, fontSize: 11 }}>· {r.location}</span>}
                  {r.tag && <Badge color={C.bamboo}>{r.tag}</Badge>}
                  <span style={{ color: C.bamboo, fontSize: 12 }}>{"⭐".repeat(Math.min(r.rating, 5))}</span>
                </div>
                <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>{r.text}</p>
              </div>
              <Btn onClick={() => deleteReview(r.id)} danger small>Delete</Btn>
            </div>
          ))}
          {!reviews.length && <p style={{ color: C.dim, fontSize: 13 }}>No reviews yet.</p>}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: Moments Photos Manager
// ═══════════════════════════════════════════════════════════════
function MomentsSection() {
  const [moments, setMoments] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ url: "", caption: "", tag: "" })
  const [saving, setSaving]   = useState(false)

  const fetchMoments = async () => {
    const snap = await getDocs(collection(db, "moments"))
    setMoments(snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
    setLoading(false)
  }

  useEffect(() => { fetchMoments() }, [])

  const addMoment = async () => {
    if (!form.url) return
    setSaving(true)
    await addDoc(collection(db, "moments"), {
      ...form,
      createdAt: new Date().toISOString(),
      homestayId: HOMESTAY.id,
    })
    setForm({ url: "", caption: "", tag: "" })
    await fetchMoments()
    setSaving(false)
  }

  const deleteMoment = async (id) => {
    if (!window.confirm("Delete this moment?")) return
    await deleteDoc(doc(db, "moments", id))
    setMoments(m => m.filter(x => x.id !== id))
  }

  return (
    <div>
      <div style={{
        background: C.card2, border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 18, marginBottom: 20,
      }}>
        <p style={{ color: C.bamboo, fontWeight: 600, fontSize: 13, marginBottom: 12 }}>Add Moment Photo</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="Image URL or /public path" style={{ gridColumn: "1 / -1" }} />
          <Input value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Caption" />
          <Input value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))} placeholder='Tag (e.g. "Sunrise View")' />
        </div>
        <Btn onClick={addMoment} disabled={saving}>{saving ? "Saving…" : "Add Moment"}</Btn>
      </div>

      {loading ? <p style={{ color: C.grey }}>Loading…</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {moments.map(m => (
            <div key={m.id} style={{
              background: C.card2, border: `1px solid ${C.border}`,
              borderRadius: 10, overflow: "hidden",
            }}>
              <div style={{ height: 120, background: "#2a2a2a" }}>
                <img src={m.url} alt={m.caption || ""}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { e.target.style.display = "none" }}
                />
              </div>
              <div style={{ padding: "10px 12px" }}>
                {m.tag && <Badge color={C.bamboo}>{m.tag}</Badge>}
                {m.caption && <p style={{ color: C.grey, fontSize: 11, margin: "6px 0 8px" }}>{m.caption}</p>}
                <Btn onClick={() => deleteMoment(m.id)} danger small>Delete</Btn>
              </div>
            </div>
          ))}
          {!moments.length && <p style={{ color: C.dim, fontSize: 13 }}>No moments yet.</p>}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// SECTION: Refund Alerts
// ═══════════════════════════════════════════════════════════════
function RefundsSection() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading]   = useState(true)
  const [marking, setMarking]   = useState(null)

  const fetchCancelled = async () => {
    const all = await getAllBookings()
    setBookings(all.filter(b => b.status === "cancelled")
      .sort((a, z) => new Date(z.cancelledAt || z.createdAt) - new Date(a.cancelledAt || a.createdAt)))
    setLoading(false)
  }

  useEffect(() => { fetchCancelled() }, [])

  const markRefunded = async (bookingId) => {
    setMarking(bookingId)
    await updateDoc(doc(db, "bookings", bookingId), {
      refundStatus: "refunded",
      refundedAt:   new Date().toISOString(),
    })
    await fetchCancelled()
    setMarking(null)
  }

  if (loading) return <p style={{ color: C.grey }}>Loading…</p>
  if (!bookings.length) return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <p style={{ fontSize: 32, marginBottom: 8 }}>✅</p>
      <p style={{ color: C.grey }}>No cancelled bookings. All clear.</p>
    </div>
  )

  const pending  = bookings.filter(b => b.refundStatus !== "refunded")
  const refunded = bookings.filter(b => b.refundStatus === "refunded")

  return (
    <div>
      {pending.length > 0 && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Badge color={C.red}>⚠ {pending.length} Pending Refund{pending.length > 1 ? "s" : ""}</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {pending.map(b => (
              <div key={b.bookingId} style={{
                background: "#ef444408", border: `1px solid ${C.red}33`,
                borderRadius: 10, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              }}>
                <div>
                  <p style={{ color: C.white, fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>{b.bookingId}</p>
                  <p style={{ color: C.grey, fontSize: 12, margin: "0 0 2px" }}>
                    Rooms: {(b.roomIds || []).join(", ")} · {b.checkIn} → {b.checkOut}
                  </p>
                  <p style={{ color: C.grey, fontSize: 12, margin: 0 }}>
                    Platform fee paid: <span style={{ color: C.red, fontWeight: 600 }}>₹{b.platformFee}</span>
                    {" "}· Cancelled: {b.cancelledAt ? new Date(b.cancelledAt).toLocaleDateString("en-IN") : "—"}
                  </p>
                </div>
                <Btn onClick={() => markRefunded(b.bookingId)} disabled={marking === b.bookingId} small>
                  {marking === b.bookingId ? "…" : "Mark Refunded"}
                </Btn>
              </div>
            ))}
          </div>
        </>
      )}
      {refunded.length > 0 && (
        <>
          <p style={{ color: C.dim, fontSize: 12, marginBottom: 10 }}>Refunded ({refunded.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {refunded.map(b => (
              <div key={b.bookingId} style={{
                background: C.card2, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "12px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ color: C.grey, fontSize: 12, margin: "0 0 2px", fontWeight: 600 }}>{b.bookingId}</p>
                  <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>
                    ₹{b.platformFee} · Refunded {b.refundedAt ? new Date(b.refundedAt).toLocaleDateString("en-IN") : ""}
                  </p>
                </div>
                <Badge color={C.green}>Refunded</Badge>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN: AdminPage
// ═══════════════════════════════════════════════════════════════
const TABS = [
  { id: "bookings",     icon: "📋", label: "Bookings"     },
  { id: "availability",icon: "🛏",  label: "Availability" },
  { id: "pricing",     icon: "💰", label: "Pricing"      },
  { id: "reviews",     icon: "⭐",  label: "Reviews"      },
  { id: "moments",     icon: "📸",  label: "Moments"      },
  { id: "refunds",     icon: "💸",  label: "Refunds"      },
]

export default function AdminPage() {
  const { currentUser } = useAuth()
  const navigate        = useNavigate()
  const [activeTab, setActiveTab]     = useState("bookings")
  const [authorized, setAuthorized]   = useState(null)

  useEffect(() => {
    if (!currentUser) { setAuthorized(false); return }
    setAuthorized(ADMIN_PHONES.includes(currentUser.phoneNumber))
  }, [currentUser])

  if (authorized === null) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: C.grey }}>Checking access…</p>
    </div>
  )

  if (!authorized) return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
    }}>
      <p style={{ fontSize: 40 }}>🔒</p>
      <h2 style={{ color: C.white, fontFamily: "'Playfair Display', serif", margin: 0 }}>Admin Access Only</h2>
      <p style={{ color: C.grey, fontSize: 13 }}>
        {currentUser ? `${currentUser.phoneNumber} is not authorized as admin.` : "Please log in with the admin phone number."}
      </p>
      <button onClick={() => navigate("/")}
        style={{
          background: C.green + "22", color: C.green, border: `1px solid ${C.green}44`,
          borderRadius: 8, padding: "8px 20px", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
        }}>← Back to Home</button>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* Top bar */}
      <div style={{
        background: C.card, borderBottom: `1px solid ${C.border}`,
        padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22 }}>🌿</span>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: C.white, fontSize: 18, margin: 0, lineHeight: 1 }}>
              Soul Nest Admin
            </h1>
            <p style={{ color: C.dim, fontSize: 11, margin: 0 }}>{HOMESTAY.name}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: C.dim, fontSize: 12 }}>{currentUser?.phoneNumber}</span>
          <button onClick={() => navigate("/")}
            style={{
              background: "transparent", color: C.grey, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>← Site</button>
        </div>
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 57px)" }}>

        {/* Sidebar */}
        <div style={{
          width: 200, background: C.card, borderRight: `1px solid ${C.border}`,
          padding: "20px 0", flexShrink: 0,
        }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                width: "100%", background: activeTab === tab.id ? C.green + "22" : "transparent",
                color: activeTab === tab.id ? C.white : C.grey,
                border: "none", borderLeft: activeTab === tab.id ? `3px solid ${C.green}` : "3px solid transparent",
                padding: "12px 20px", fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10,
                fontFamily: "inherit", transition: "all 0.15s",
              }}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>
          {activeTab === "bookings"     && <><SectionHeader icon="📋" title="All Bookings"      sub="Complete booking history across all rooms" /><BookingsSection /></>}
          {activeTab === "availability" && <><SectionHeader icon="🛏" title="Room Availability" sub="Manually block or unblock rooms" /><AvailabilitySection /></>}
          {activeTab === "pricing"      && <><SectionHeader icon="💰" title="Pricing Manager"   sub="Update room prices and platform fee — changes go live immediately" /><PricingSection /></>}
          {activeTab === "reviews"      && <><SectionHeader icon="⭐" title="Reviews Manager"   sub="Add or remove guest reviews" /><ReviewsSection /></>}
          {activeTab === "moments"      && <><SectionHeader icon="📸" title="Moments Photos"    sub="Manage photos shown in the Moments section" /><MomentsSection /></>}
          {activeTab === "refunds"      && <><SectionHeader icon="💸" title="Refund Alerts"     sub="Cancelled bookings requiring platform fee refund" /><RefundsSection /></>}
        </div>
      </div>
    </div>
  )
}