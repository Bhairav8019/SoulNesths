// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// Firebase initialization — Soul Nest Homestays
// Exports: db (Firestore), auth (Firebase Auth)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp }                        from "firebase/app"
import { getFirestore }                          from "firebase/firestore"
import { getAuth, RecaptchaVerifier }            from "firebase/auth"

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const db   = getFirestore(app)
export const auth = getAuth(app)

// ── Invisible reCAPTCHA verifier ──────────────────────────────
// Clears any existing instance before creating a new one.
// Call once before signInWithPhoneNumber.
export function createRecaptchaVerifier(containerId = "recaptcha-container") {
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear() } catch (_) {}
    window.recaptchaVerifier = null
  }
  window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
    callback: () => {},
    "expired-callback": () => {},
  })
  return window.recaptchaVerifier
}