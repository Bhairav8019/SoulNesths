// src/pages/AboutPage.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Mail, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import Navbar from "../components/Navbar"

const CONTACT_EMAIL = "abhilashgoswami12@gmail.com"

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
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      background: C.card, border: "1px solid " + C.border,
      borderRadius: 20, overflow: "hidden", marginBottom: 14,
    }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", padding: "18px 22px",
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "inherit",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          color: C.white, fontSize: 16, fontWeight: 600,
        }}>{title}</span>
        {open
          ? <ChevronUp size={16} color={C.bamboo} />
          : <ChevronDown size={16} color={C.bamboo} />}
      </button>
      {open && (
        <div style={{ padding: "0 22px 22px", color: C.grey, fontSize: 13, lineHeight: 1.8 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Para({ children, style = {} }) {
  return <p style={{ margin: "0 0 14px", ...style }}>{children}</p>
}

function Heading({ children }) {
  return (
    <p style={{
      color: C.bamboo, fontWeight: 700, fontSize: 12,
      letterSpacing: "0.1em", textTransform: "uppercase",
      margin: "18px 0 6px",
    }}>{children}</p>
  )
}

export default function AboutPage({ onLogoClick }) {
  const navigate = useNavigate()

  const handleEmail = () => {
    window.location.href =
      "mailto:" + CONTACT_EMAIL +
      "?subject=Business%20Enquiry%20%7C%20Soul%20Nest%20Homestays" +
      "&body=Hi%20Abhilash%2C%0A%0AI%20came%20across%20Soul%20Nest%20Homestays%20and%20would%20like%20to%20connect%20regarding%3A%0A%0A"
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
      <Navbar onLogoClick={onLogoClick} />

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "88px 16px 60px" }}>

        {/* Back */}
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", color: C.grey,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          fontSize: 13, fontFamily: "inherit", marginBottom: 28,
        }}>
          <ArrowLeft size={15} /> Back to Home
        </button>

        {/* Hero banner */}
        <div style={{
          background: "linear-gradient(135deg, #1a2a1a 0%, #1C1C1C 60%, #1a150a 100%)",
          border: "1px solid " + C.border,
          borderRadius: 24, padding: "36px 28px", marginBottom: 28,
          position: "relative", overflow: "hidden",
        }}>
          {/* Decorative lines */}
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: 180, height: 180,
            background: "radial-gradient(circle at 100% 0%, rgba(139,105,20,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0,
            width: 140, height: 140,
            background: "radial-gradient(circle at 0% 100%, rgba(45,90,61,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <p style={{
            color: C.bamboo, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            marginBottom: 12,
          }}>About Soul Nest</p>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white, fontSize: 26, fontWeight: 700,
            lineHeight: 1.3, margin: "0 0 20px",
          }}>
            A Retreat Rooted in<br />
            <span style={{ color: C.bamboo }}>Warmth &amp; Craft</span>
          </h1>

          <div style={{
            width: 48, height: 2,
            background: "linear-gradient(90deg, " + C.green + ", " + C.bamboo + ")",
            borderRadius: 2, marginBottom: 20,
          }} />

          <p style={{ color: C.grey, fontSize: 14, lineHeight: 1.9, margin: 0 }}>
            Hey — this is <span style={{ color: C.white, fontWeight: 600 }}>Abhilash</span> from Soul Nest. What
            started as a personal vision for a different kind of stay has grown into something we're genuinely
            proud of — a homestay in the heart of Jorhat, Assam, where every room is designed not just to
            accommodate, but to make you feel completely at home.
          </p>
        </div>

        {/* About the property */}
        <div style={{
          background: C.card, border: "1px solid " + C.border,
          borderRadius: 20, padding: "24px 26px", marginBottom: 14,
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white, fontSize: 16, fontWeight: 600, marginBottom: 16,
          }}>The Property</p>

          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.9, margin: "0 0 14px" }}>
            Soul Nest Homestay is a boutique property nestled along Malow Ali Bye Pass, Jorhat — a city that
            carries the quiet rhythm of Assam's tea heritage and warm northeastern culture. We offer four
            thoughtfully designed rooms — a cozy Standard, an elevated Deluxe, a private Premium 1BHK with a
            balcony view, and a spacious Premium 2BHK ideal for families and groups.
          </p>

          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.9, margin: "0 0 14px" }}>
            Everything at Soul Nest is built around one idea: that a great stay doesn't need to be impersonal.
            You get free WiFi, a fully equipped kitchen, smart TV, dedicated parking, and the kind of
            attentiveness that only a host who actually cares can offer. Couples are especially welcome —
            privacy, comfort, and respect are non-negotiable here.
          </p>

          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.9, margin: 0 }}>
            Beyond the rooms, our <span style={{ color: C.white, fontWeight: 500 }}>Nest Escapes</span> experiences
            — from Hangout excursions and Chef on Demand to Orchestra &amp; DJ nights — exist so you never have to
            leave the Soul Nest bubble unless you choose to.
          </p>
        </div>

        {/* About the platform */}
        <div style={{
          background: C.card, border: "1px solid " + C.border,
          borderRadius: 20, padding: "24px 26px", marginBottom: 14,
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white, fontSize: 16, fontWeight: 600, marginBottom: 16,
          }}>The Platform</p>

          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.9, margin: "0 0 14px" }}>
            This booking platform was built from scratch — no third-party marketplace, no middlemen taking a cut,
            no generic listing page. It's a direct connection between you and us. Browse rooms, check real-time
            availability, pick your dates, fill in your details, and confirm your stay in under two minutes.
            No advance payment required — you settle the full amount directly at the homestay on arrival.
          </p>

          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.9, margin: 0 }}>
            The platform is designed to be fast, transparent, and genuinely useful. Our 24/7 voice assistant (tap the mic icon on the home screen)
            is always available to answer your questions about rooms, pricing, check-in, and experiences.
          </p>
        </div>

        {/* Contact / list property CTA */}
        <div style={{
          background: "linear-gradient(135deg, #1a2a1a, #1C1C1C)",
          border: "1px solid " + C.green + "44",
          borderRadius: 20, padding: "24px 26px", marginBottom: 28,
        }}>
          <p style={{
            fontFamily: "'Playfair Display', serif",
            color: C.white, fontSize: 16, fontWeight: 600, marginBottom: 8,
          }}>Connect with Us</p>
          <p style={{ color: C.grey, fontSize: 13, lineHeight: 1.8, margin: "0 0 18px" }}>
            For business enquiries, partnership opportunities, or if you're a property owner looking to list
            your homestay on our platform — reach out directly. We'd love to hear from you.
          </p>
          <button onClick={handleEmail} style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: C.green + "22", color: C.green,
            border: "1px solid " + C.green + "44", borderRadius: 12,
            padding: "10px 20px", fontSize: 13, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
            textDecoration: "none",
          }}>
            <Mail size={14} />
            {CONTACT_EMAIL}
            <ExternalLink size={11} color={C.dim} />
          </button>
        </div>

        {/* Privacy Policy */}
        <Section title="Privacy Policy">
          <Para style={{ color: C.bamboo, fontSize: 11, letterSpacing: "0.08em" }}>
            Last updated: March 2026
          </Para>

          <Heading>1. Information We Collect</Heading>
          <Para>
            When you make a booking on Soul Nest Homestays, we collect the information you voluntarily provide:
            your full name, contact phone number, and optionally your WhatsApp number. We also collect booking
            details including check-in and check-out dates, room selection, number of guests, and total stay amount.
            Your phone number is used for Firebase Authentication (OTP-based login) to verify your identity.
          </Para>

          <Heading>2. How We Use Your Information</Heading>
          <Para>
            The information you provide is used solely to process and manage your booking, share your booking
            confirmation and ID, enable the property owner to contact you regarding your stay, and to maintain
            an accurate booking history accessible through your account. We do not use your information for
            marketing, advertising, or any purpose unrelated to your stay.
          </Para>

          <Heading>3. Data Storage</Heading>
          <Para>
            Your booking data is stored securely in Google Firebase Firestore, a cloud database service governed
            by Google's infrastructure security standards. Authentication is handled via Firebase Auth with
            phone OTP. We do not store payment card details — no advance payment is collected through this platform.
          </Para>

          <Heading>4. Data Sharing</Heading>
          <Para>
            We do not sell, rent, or trade your personal information to any third parties. Your contact details
            (name and phone number) are shared with the Soul Nest property owner solely for the purpose of
            coordinating your stay. No other sharing occurs.
          </Para>

          <Heading>5. Voice Assistant</Heading>
          <Para>
            Our 24/7 voice assistant is powered by Vapi.ai. If you choose to use the voice support feature,
            your voice input is processed by Vapi's infrastructure in accordance with their privacy policy
            (vapi.ai). We do not store voice recordings.
          </Para>

          <Heading>6. Cookies &amp; Analytics</Heading>
          <Para>
            This platform does not use tracking cookies, advertising pixels, or third-party analytics services.
            Firebase may collect minimal technical data (such as session tokens) as part of its authentication
            service.
          </Para>

          <Heading>7. Your Rights</Heading>
          <Para>
            You may request deletion of your booking records or personal data at any time by contacting us
            at {CONTACT_EMAIL}. We will process your request within 7 business days.
          </Para>

          <Heading>8. Contact</Heading>
          <Para style={{ margin: 0 }}>
            For any privacy-related questions or concerns, please contact us at{" "}
            <span style={{ color: C.bamboo }}>{CONTACT_EMAIL}</span>.
          </Para>
        </Section>

        {/* Terms of Service */}
        <Section title="Terms of Service">
          <Para style={{ color: C.bamboo, fontSize: 11, letterSpacing: "0.08em" }}>
            Last updated: March 2026
          </Para>

          <Para>
            By accessing or using the Soul Nest Homestays platform and making a booking, you agree to the
            following terms. Please read them carefully.
          </Para>

          <Heading>1. Booking &amp; Confirmation</Heading>
          <Para>
            A booking is confirmed once you receive a Booking ID via this platform. No advance payment is
            required to secure your booking. The full stay amount is payable directly at the property on
            check-in, in cash or UPI. Soul Nest Homestays reserves the right to decline a booking at its
            discretion without liability.
          </Para>

          <Heading>2. Cancellation Policy</Heading>
          <Para>
            You may cancel a confirmed booking at any time through the Bookings section of your account. Since
            no advance payment is collected through this platform, cancellation is free with no financial
            penalty. The room will be released and made available to other guests immediately upon cancellation.
            We encourage guests to cancel as early as possible if plans change.
          </Para>

          <Heading>3. Check-in &amp; Check-out</Heading>
          <Para>
            Standard check-in time is 11:00 AM and check-out time is 11:00 AM. Early check-in or late
            check-out may be accommodated subject to availability and must be confirmed directly with the
            owner. Guests must present a valid government-issued photo ID at check-in. Guests must be
            at least 21 years of age. Minors must be accompanied by a guardian at all times.
          </Para>

          <Heading>4. House Rules</Heading>
          <Para>
            All guests are expected to comply with the property's house rules, which include: no illegal
            activities or unlawful substances on the premises; no loud music or parties between 10:00 PM
            and 7:00 AM; no unregistered visitors without prior host permission; and full responsibility
            for any damage caused to the property during the stay. Soul Nest reserves the right to deny
            entry or request early departure if rules are violated, without refund.
          </Para>

          <Heading>5. Liability</Heading>
          <Para>
            Soul Nest Homestays is not liable for loss, theft, or damage to guest belongings during the
            stay. Guests use all facilities and amenities at their own risk. The platform and its operators
            are not responsible for booking failures caused by internet connectivity issues, device errors,
            or third-party service outages (including Firebase or Vapi).
          </Para>

          <Heading>6. Platform Use</Heading>
          <Para>
            This platform is provided exclusively for legitimate booking purposes by genuine guests. Any
            attempt to abuse, scrape, reverse-engineer, or manipulate the booking system is prohibited.
            Accounts found to be engaging in fraudulent bookings may be suspended without notice.
          </Para>

          <Heading>7. Intellectual Property</Heading>
          <Para>
            All content on this platform — including text, photographs, design, and code — is the property
            of Soul Nest Homestays or its respective creators. No content may be reproduced or used without
            prior written permission.
          </Para>

          <Heading>8. Modifications</Heading>
          <Para>
            We reserve the right to update these terms at any time. Continued use of the platform after
            changes are posted constitutes acceptance of the updated terms.
          </Para>

          <Heading>9. Contact</Heading>
          <Para style={{ margin: 0 }}>
            For any questions regarding these terms, contact us at{" "}
            <span style={{ color: C.bamboo }}>{CONTACT_EMAIL}</span>.
          </Para>
        </Section>

        {/* Footer signature */}
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{
            width: 40, height: 1,
            background: "linear-gradient(90deg, transparent, " + C.bamboo + ", transparent)",
            margin: "0 auto 14px",
          }} />
          <p style={{
            fontFamily: "'Playfair Display', serif",
            color: C.dim, fontSize: 12, letterSpacing: "0.12em",
          }}>
            Soul Nest Homestays · Jorhat, Assam
          </p>
        </div>

      </div>
    </div>
  )
}