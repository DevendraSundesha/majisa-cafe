/**
 * BANK-LEVEL SECURITY SHIELD & RATE LIMITING MODULE
 * Majisa Cafe & Restaurant - Enterprise Anti-Tamper & Anti-Brute-Force Shield
 */

import { readAppState, writeAppState } from './supabaseApi'

// Storage key for Admin Lockout state
const LOCKOUT_STORAGE_KEY = 'majisa-admin-security-lockout'

/**
 * 1. GET & PERSIST ADMIN LOCKOUT STATE
 * Persists in LocalStorage + Supabase database to prevent cache-clearing bypass.
 */
export function getLockoutState() {
  try {
    const raw = localStorage.getItem(LOCKOUT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        failedAttempts: Number(parsed.failedAttempts || 0),
        lockoutUntil: parsed.lockoutUntil ? Number(parsed.lockoutUntil) : null,
        lockoutMinutes: Number(parsed.lockoutMinutes || 0),
        isBlocked: Boolean(parsed.isBlocked)
      }
    }
  } catch (e) {
    console.warn('Failed to read lockout state locally:', e)
  }

  return {
    failedAttempts: 0,
    lockoutUntil: null,
    lockoutMinutes: 0,
    isBlocked: false
  }
}

export function saveLockoutState(state) {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(state))
    // Sync with remote database so brute force attempts are logged centrally
    writeAppState('admin_security_lockout', state).catch(() => {})
  } catch (e) {
    console.warn('Failed to save lockout state:', e)
  }
}

export async function syncLockoutFromRemote() {
  try {
    const remote = await readAppState('admin_security_lockout', null)
    if (remote && typeof remote === 'object') {
      const local = getLockoutState()
      // Use whichever state is more restrictive
      const merged = {
        failedAttempts: Math.max(local.failedAttempts, Number(remote.failedAttempts || 0)),
        lockoutUntil: Math.max(local.lockoutUntil || 0, Number(remote.lockoutUntil || 0)) || null,
        lockoutMinutes: Math.max(local.lockoutMinutes, Number(remote.lockoutMinutes || 0)),
        isBlocked: local.isBlocked || Boolean(remote.isBlocked)
      }
      saveLockoutState(merged)
      return merged
    }
  } catch (e) {
    console.warn('Sync lockout remote failed:', e)
  }
  return getLockoutState()
}

/**
 * 2. ADMIN BRUTE FORCE ATTEMPT HANDLER
 * Rules:
 * - 1 to 3 wrong attempts: Warning with remaining attempts count
 * - 4th wrong attempt: 15 Minutes Lockout
 * - 5th wrong attempt: 30 Minutes Lockout
 * - 6th+ wrong attempt: PERMANENT BLOCK
 */
export function handleFailedAdminLogin() {
  const currentState = getLockoutState()

  // If already permanently blocked
  if (currentState.isBlocked) {
    return {
      status: 'BLOCKED',
      message: '⛔ आपका डिवाइस एडमिन एक्सेस के लिए स्थायी रूप से ब्लॉक (PERMANENTLY BLOCKED) कर दिया गया है सा! ओनर से संपर्क करें।',
      state: currentState
    }
  }

  // Increment failed attempts
  const attempts = currentState.failedAttempts + 1
  let lockoutUntil = null
  let lockoutMinutes = 0
  let isBlocked = false
  let status = 'WARNING'
  let message = ''

  if (attempts < 4) {
    status = 'WARNING'
    const remaining = 4 - attempts
    message = `⚠️ गलत पिन (PIN)! कृपया सही एडमिन पिन दर्ज करें सा। (${remaining} प्रयास शेष हैं)`
  } else if (attempts === 4) {
    status = 'LOCKED_15M'
    lockoutMinutes = 15
    lockoutUntil = Date.now() + 15 * 60 * 1000 // 15 Minutes
    message = '🛑 सुरक्षा अलर्ट: 4 बार गलत पासवर्ड दर्ज किया गया! एडमिन लॉगिन 15 मिनट के लिए लॉक कर दिया गया है सा।'
  } else if (attempts === 5) {
    status = 'LOCKED_30M'
    lockoutMinutes = 30
    lockoutUntil = Date.now() + 30 * 60 * 1000 // 30 Minutes
    message = '🛑 सुरक्षा अलर्ट: 5 बार गलत पासवर्ड दर्ज किया गया! एडमिन लॉगिन 30 मिनट के लिए लॉक कर दिया गया है सा।'
  } else {
    status = 'BLOCKED'
    isBlocked = true
    message = '⛔ 6 बार गलत पासवर्ड! आपका डिवाइस सुरक्षा कारणों से एडमिन एक्सेस के लिए स्थायी रूप से ब्लॉक (PERMANENTLY BLOCKED) कर दिया गया है सा!'
  }

  const newState = {
    failedAttempts: attempts,
    lockoutUntil,
    lockoutMinutes,
    isBlocked
  }

  saveLockoutState(newState)

  return {
    status,
    message,
    state: newState
  }
}

/**
 * Reset lockout state on successful admin login
 */
export function handleSuccessfulAdminLogin() {
  const clearState = {
    failedAttempts: 0,
    lockoutUntil: null,
    lockoutMinutes: 0,
    isBlocked: false
  }
  saveLockoutState(clearState)
}

/**
 * 3. CLIENT-SIDE API RATE LIMITER (TOKEN BUCKET)
 * Prevents automated scripts/bots from spamming API calls from browser
 */
class ApiRateLimiter {
  constructor(maxRequests = 40, intervalMs = 60000) {
    this.maxRequests = maxRequests
    this.intervalMs = intervalMs
    this.tokens = maxRequests
    this.lastRefill = Date.now()
  }

  checkLimit() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    if (elapsed > this.intervalMs) {
      this.tokens = this.maxRequests
      this.lastRefill = now
    }

    if (this.tokens > 0) {
      this.tokens--
      return true
    }
    return false
  }
}

export const clientApiLimiter = new ApiRateLimiter(40, 60000)

/**
 * 4. ANTI-DEVTOOLS, ANTI-INSPECT & ANTI-CLONING SHIELD
 * Protects frontend source code from Chrome inspect, cloning tools, and scraping
 */
export function initSecurityShield() {
  if (typeof window === 'undefined') return

  // A. ANTI-FRAMEBUSTING / ANTI-CLONING
  try {
    if (window.top !== window.self) {
      window.top.location = window.self.location
    }
  } catch {
    document.body.innerHTML = '<h1 style="color:red;text-align:center;padding:50px;">⚠️ Access Denied: Framing / Cloning Blocked!</h1>'
  }

  // B. DISABLE RIGHT CLICK / CONTEXT MENU
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  }, { capture: true })

  // C. DISABLE KEYBOARD SHORTCUTS FOR DEVTOOLS & SOURCE VIEWING
  document.addEventListener('keydown', (e) => {
    // F12 key
    if (e.keyCode === 123 || e.key === 'F12') {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Inspector)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Ctrl+U (View Source)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Ctrl+S (Save Page) & Ctrl+P (Print)
    if (e.ctrlKey && (e.key === 'S' || e.key === 's' || e.key === 'P' || e.key === 'p')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, { capture: true })

  // D. CONTINUOUS DEVTOOLS DETECTION & ANTI-DEBUGGER LOOP
  const devToolsTrap = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160
    const heightThreshold = window.outerHeight - window.innerHeight > 160

    if (widthThreshold || heightThreshold) {
      const startTime = performance.now()
      /* eslint-disable no-debugger */
      debugger
      /* eslint-enable no-debugger */
      const endTime = performance.now()
      if (endTime - startTime > 100) {
        console.clear()
      }
    }
  }

  setInterval(devToolsTrap, 1000)

  // E. CONSOLE WARNING
  console.log('%c⚠️ SECURITY NOTICE', 'color: red; font-size: 24px; font-weight: bold;')
  console.log('%cThis web application is protected by Bank-Level Security Shield. Unauthorized debugging, tampering, or API scraping is strictly prohibited.', 'font-size: 14px; color: #ff9800;')
}
