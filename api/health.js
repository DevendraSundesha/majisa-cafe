/**
 * Vercel Serverless API: Health & Security Check
 */
export default function handler(req, res) {
  // 1. CORS & Security Headers
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.VITE_APP_DOMAIN,
  ].filter(Boolean)

  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*')
  } else {
    return res.status(403).json({ error: '🛑 Security Violation: Origin Access Denied!' })
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  res.status(200).json({
    status: 'SECURE',
    shield: 'Bank-Level Vercel Shield Active',
    timestamp: new Date().toISOString(),
  })
}
