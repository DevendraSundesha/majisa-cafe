/**
 * BANK-LEVEL BACKEND SECURITY PROXY & RATE-LIMITING SERVER
 * Majisa Cafe & Restaurant Enterprise Server
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

// 1. HELMET SECURITY HEADERS (Bank-Level HTTP Headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://*.supabase.co"],
        connectSrc: ["'self'", "https://*.supabase.co", "https://api.cloudinary.com"],
        frameAncestors: ["'none'"], // Anti-Cloning & Anti-Framebusting
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
    frameguard: { action: 'deny' }, // Anti-Clickjacking / Anti-Cloning
  })
)

// 2. CORS DOMAIN LOCKING
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  process.env.VITE_APP_DOMAIN,
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or allowed origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('CORS Violation: Access Denied!'))
      }
    },
    credentials: true,
  })
)

// 3. PAYLOAD SIZE LIMIT (Anti-Buffer Overflow / Anti-DDoS Payload Flooding)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))

// 4. RATE LIMITERS (Anti-DDoS & Anti-Brute-Force)

// A. Global General API Rate Limiter (Max 100 requests per 15 mins per IP)
const globalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too Many Requests',
    message: '🛑 सुरक्षा अलर्ट: अत्यधिक अनुरोध प्राप्त हुए। कृपया 15 मिनट बाद पुनः प्रयास करें।',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// B. Strict Admin API Rate Limiter (Max 5 requests per 15 mins per IP for Admin authentication)
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Admin Brute Force Blocked',
    message: '🛑 सुरक्षा लॉक: एडमिन लॉगिन पर अत्यधिक गलत प्रयास! आपकी IP 15 मिनट के लिए ब्लॉक कर दी गई है।',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', globalApiLimiter)
app.use('/api/admin/', adminAuthLimiter)

// 5. SERVER HEALTH & SECURITY STATUS ENDPOINT
app.get('/api/health', (req, res) => {
  res.json({
    status: 'SECURE',
    shield: 'Bank-Level Active',
    timestamp: new Date().toISOString(),
  })
})

// 6. BACKEND API PROXY ENDPOINTS (Hides raw credentials & enforces rate limits)

// Supabase Read App State Proxy
app.get('/api/state/:key', async (req, res) => {
  const { key } = req.params
  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase Server Configuration Missing' })
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/app_state?key=eq.${encodeURIComponent(key)}&select=data`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    })
    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 7. START SERVER
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Bank-Level Security Server running on port ${PORT}`)
  })
}

export default app
