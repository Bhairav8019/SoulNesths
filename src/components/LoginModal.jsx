// src/components/LoginModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Phone OTP login modal — Soul Nest Homestays
//
// Flow:
//   1. User enters phone number (Indian +91 or international)
//   2. Invisible reCAPTCHA verifies silently
//   3. Firebase sends OTP SMS
//   4. User enters 6-digit OTP
//   5. Firebase verifies — currentUser set — modal closes automatically
//
// On success: AuthContext.currentUser is populated, modal auto-closes.
// Session persists across refreshes (Firebase LOCAL persistence).
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react"
import { signInWithPhoneNumber }       from "firebase/auth"
import { X, Phone, Shield, ArrowLeft, Loader } from "lucide-react"
import { auth, createRecaptchaVerifier } from "../firebase"
import { useAuth } from "../context/AuthContext"

// ── Phone normaliser ──────────────────────────────────────────
// Accepts: 9876543210 / 09876543210 / +919876543210 / +1 555 000 1234
// Returns E.164 string or null if invalid
function normalisePhone(raw) {
  const stripped = raw.replace(/[\s\-().]/g, "")
  // Already E.164
  if (/^\+\d{7,15}$/.test(stripped)) return stripped
  // Indian 10-digit
  if (/^[6-9]\d{9}$/.test(stripped)) return `+91${stripped}`
  // Indian with 0 prefix
  if (/^0[6-9]\d{9}$/.test(stripped)) return `+91${stripped.slice(1)}`
  // Indian with 91 prefix (no +)
  if (/^91[6-9]\d{9}$/.test(stripped)) return `+${stripped}`
  return null
}

export default function LoginModal() {
  const { closeLogin, currentUser } = useAuth()

  // Auto-close if user is already logged in (e.g. persisted session)
  useEffect(() => {
    if (currentUser) closeLogin()
  }, [currentUser, closeLogin])

  // ── Steps: "phone" | "otp" ────────────────────────────────
  const [step, setStep]                 = useState("phone")
  const [phone, setPhone]               = useState("")
  const [phoneError, setPhoneError]     = useState("")
  const [otp, setOtp]                   = useState(["", "", "", "", "", ""])
  const [otpError, setOtpError]         = useState("")
  const [loadingSend, setLoadingSend]   = useState(false)
  const [loadingVerify, setLoadingVerify] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const confirmationRef = useRef(null)   // Firebase ConfirmationResult
  const recaptchaRef    = useRef(null)   // RecaptchaVerifier instance
  const otpRefs         = useRef([])     // refs for 6 OTP digit inputs
  const countdownRef    = useRef(null)

  // Start resend countdown (30s)
  const startCountdown = () => {
    setResendCountdown(30)
    clearInterval(countdownRef.current)
    countdownRef.current = setInterval(() => {
      setResendCountdown(s => {
        if (s <= 1) { clearInterval(countdownRef.current); return 0 }
        return s - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(countdownRef.current), [])

  // ── Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    setPhoneError("")
    const e164 = normalisePhone(phone)
    if (!e164) {
      setPhoneError("Enter a valid Indian or international phone number")
      return
    }

    setLoadingSend(true)
    try {
      // Create / re-create reCAPTCHA verifier
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear() } catch {}
      }
      recaptchaRef.current = createRecaptchaVerifier("recaptcha-container")

      const result = await signInWithPhoneNumber(auth, e164, recaptchaRef.current)
      confirmationRef.current = result
      setStep("otp")
      startCountdown()
      // Focus first OTP box
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      console.error("OTP send error:", err)
      if (err.code === "auth/invalid-phone-number") {
        setPhoneError("Invalid phone number — check format and try again")
      } else if (err.code === "auth/too-many-requests") {
        setPhoneError("Too many attempts. Please wait a few minutes and try again.")
      } else {
        setPhoneError("Failed to send OTP. Please try again.")
      }
      try { recaptchaRef.current?.clear() } catch {}
    } finally {
      setLoadingSend(false)
    }
  }

  // ── OTP input handlers ────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setOtpError("")
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(""))
      setOtpError("")
      otpRefs.current[5]?.focus()
    }
  }

  // ── Verify OTP ────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.join("")
    if (code.length < 6) { setOtpError("Enter all 6 digits"); return }
    if (!confirmationRef.current) { setOtpError("Session expired — resend OTP"); return }

    setLoadingVerify(true)
    setOtpError("")
    try {
      await confirmationRef.current.confirm(code)
      // AuthContext.onAuthStateChanged fires → currentUser set → useEffect above closes modal
    } catch (err) {
      console.error("OTP verify error:", err)
      if (err.code === "auth/invalid-verification-code") {
        setOtpError("Incorrect OTP — double-check and try again")
      } else if (err.code === "auth/code-expired") {
        setOtpError("OTP expired — tap Resend to get a new one")
      } else {
        setOtpError("Verification failed. Please try again.")
      }
    } finally {
      setLoadingVerify(false)
    }
  }

  // ── Resend OTP ────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCountdown > 0) return
    setOtp(["", "", "", "", "", ""])
    setOtpError("")
    await handleSendOtp()
  }

  const maskedPhone = phone
    ? `+91 ****${phone.replace(/\D/g, "").slice(-4)}`
    : ""

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(8px)" }}>

      {/* Invisible reCAPTCHA mount point */}
      <div id="recaptcha-container" />

      <div className="bg-[#1C1C1C] border border-[#3a3a3a] rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">

        {/* Close */}
        <button onClick={closeLogin}
          className="absolute top-4 right-4 text-[#9a9a9a] hover:text-white transition">
          <X size={18} />
        </button>

        {/* ── STEP 1 — Phone number ── */}
        {step === "phone" && (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-[#2D5A3D] flex items-center justify-center flex-shrink-0">
                <Phone size={17} className="text-white" />
              </div>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-[#F8F5F0] text-lg font-bold leading-tight">Welcome to Soul Nest</h3>
                <p className="text-[#9a9a9a] text-xs">Sign in with your phone number</p>
              </div>
            </div>

            <div className="w-full h-px bg-[#3a3a3a] mb-5" />

            <label className="text-[#8B6914] text-xs font-medium flex items-center gap-1.5 mb-2">
              <Phone size={10} /> Phone number
              <span className="text-[#5a5a5a] font-normal">· Indian or international</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => { setPhone(e.target.value); setPhoneError("") }}
              onKeyDown={e => e.key === "Enter" && handleSendOtp()}
              placeholder="+91 98765 43210"
              autoFocus
              className="w-full bg-[#2a2a2a] text-[#F8F5F0] text-sm px-4 py-3 rounded-2xl outline-none placeholder-[#5a5a5a] mb-1"
              style={{ border: phoneError ? "1.5px solid #ef4444" : "1.5px solid #3a3a3a" }}
            />
            {phoneError && <p className="text-red-400 text-xs mb-3 ml-1">{phoneError}</p>}

            <p className="text-[#5a5a5a] text-xs mb-5 mt-2">
              We'll send a one-time verification code to this number via SMS.
            </p>

            <button onClick={handleSendOtp} disabled={loadingSend || !phone.trim()}
              className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8B6914]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {loadingSend ? <><Loader size={15} className="animate-spin" /> Sending OTP...</> : "Send OTP →"}
            </button>

            <p className="text-[#5a5a5a] text-xs text-center mt-4">
              By continuing, you agree to receive an SMS OTP. Standard rates may apply.
            </p>
          </>
        )}

        {/* ── STEP 2 — OTP entry ── */}
        {step === "otp" && (
          <>
            {/* Back + header */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setOtpError("") }}
                className="text-[#9a9a9a] hover:text-white transition flex-shrink-0">
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#2D5A3D] flex items-center justify-center flex-shrink-0">
                  <Shield size={17} className="text-white" />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif" }}
                    className="text-[#F8F5F0] text-lg font-bold leading-tight">Verify OTP</h3>
                  <p className="text-[#9a9a9a] text-xs">Sent to {maskedPhone}</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-[#3a3a3a] mb-5" />

            <p className="text-[#9a9a9a] text-xs mb-4">Enter the 6-digit code sent to your phone.</p>

            {/* OTP boxes */}
            <div className="flex gap-2 justify-between mb-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => otpRefs.current[i] = el}
                  type="tel"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-[#F8F5F0] text-lg font-bold bg-[#2a2a2a] rounded-xl outline-none transition"
                  style={{
                    border: otpError
                      ? "1.5px solid #ef4444"
                      : digit
                      ? "1.5px solid #2D5A3D"
                      : "1.5px solid #3a3a3a"
                  }}
                />
              ))}
            </div>
            {otpError && <p className="text-red-400 text-xs mb-3 ml-1">{otpError}</p>}

            {/* Resend */}
            <div className="flex items-center justify-between mb-5 mt-2">
              <span className="text-[#5a5a5a] text-xs">Didn't receive it?</span>
              <button onClick={handleResend} disabled={resendCountdown > 0}
                className="text-xs font-medium transition disabled:text-[#5a5a5a] disabled:cursor-not-allowed text-[#8B6914] hover:text-[#F8F5F0]">
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend OTP"}
              </button>
            </div>

            <button onClick={handleVerify} disabled={loadingVerify || otp.join("").length < 6}
              className="w-full bg-[#2D5A3D] text-white py-4 rounded-2xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#8B6914]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              {loadingVerify ? <><Loader size={15} className="animate-spin" /> Verifying...</> : <><Shield size={15} /> Confirm & Login</>}
            </button>

            <p className="text-[#5a5a5a] text-xs text-center mt-4 italic">
              ✦ Your session will be remembered on this device
            </p>
          </>
        )}
      </div>
    </div>
  )
}