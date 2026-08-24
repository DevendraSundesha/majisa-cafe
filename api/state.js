/**
 * Vercel Serverless API: Supabase State Proxy
 * Protects Supabase credentials & enforces Domain Locking
 */

// Simple in-memory IP Rate Limiter (Per Serverless Instance)
const ipCache = new Map()

export default async function handler(req, res) {
  // 1. CORS Domain Locking
  const origin = req.headers.origin
  const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.VITE_APP_DOMAIN,
  ].filter(Boolean)

  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: '🛑 Security Alert: CORS Domain Blocked!' })
  }

  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // 2. IP Rate Limiting (Max 60 requests per minute per IP)
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 60

  const userRecord = ipCache.get(clientIp) || { count: 0, startTime: now }

  if (now - userRecord.startTime > windowMs) {
    userRecord.count = 1
    userRecord.startTime = now
  } else {
    userRecord.count += 1
  }

  ipCache.set(clientIp, userRecord)

  if (userRecord.count > maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: '🛑 सुरक्षा अलर्ट: अत्यधिक अनुरोध प्राप्त हुए। कृपया 1 मिनट बाद प्रयास करें।',
    })
  }

  // 3. Process Supabase Proxy Request
  const { key } = req.query
  if (!key) {
    return res.status(400).json({ error: 'Key parameter is required' })
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase Server Configuration Missing' })
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/app_state?key=eq.${encodeURIComponent(key)}&select=data`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    )
    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
