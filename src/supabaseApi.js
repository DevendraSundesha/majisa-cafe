import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
export const hasSupabase = Boolean(supabase)

// Safe wrapper to prevent crashes if Supabase project is paused or frozen
export async function readAppState(key, fallback) {
  if (!supabase) return fallback
  try {
    const { data, error } = await supabase.from('app_state').select('data').eq('key', key).maybeSingle()
    if (error) {
      console.warn(`Supabase readAppState warning for key "${key}" (project may be paused):`, error.message)
      return fallback
    }
    return data?.data ?? fallback
  } catch (err) {
    console.warn(`Supabase readAppState exception for key "${key}":`, err.message)
    return fallback
  }
}

export async function hasAppState(key) {
  if (!supabase) return false
  try {
    const { data, error } = await supabase.from('app_state').select('key').eq('key', key).maybeSingle()
    if (error) return false
    return Boolean(data)
  } catch {
    return false
  }
}

export async function writeAppState(key, value) {
  if (!supabase) return value
  try {
    const { error } = await supabase
      .from('app_state')
      .upsert({ key, data: value, updated_at: new Date().toISOString() })
    if (error) {
      console.warn(`Supabase writeAppState warning for key "${key}" (project may be paused):`, error.message)
    }
  } catch (err) {
    console.warn(`Supabase writeAppState exception for key "${key}":`, err.message)
  }
  return value
}

function mapCouponFromRow(row) {
  return {
    reward: row.reward,
    code: row.code,
    created: row.created_at,
    expiresAt: row.expires_at,
    amount: row.amount,
    mobile: row.mobile || '',
    customerPhone: row.mobile || '',
    customerName: row.customer_name || '',
    upiRef: row.upi_ref || '',
    redeemedAt: row.redeemed_at,
  }
}

function mapCouponToRow(coupon) {
  return {
    code: coupon.code,
    reward: coupon.reward,
    amount: Number(coupon.amount || 0),
    mobile: coupon.customerPhone || coupon.mobile || null,
    customer_name: coupon.customerName || null,
    upi_ref: coupon.upiRef || null,
    created_at: coupon.created,
    expires_at: coupon.expiresAt,
    redeemed_at: coupon.redeemedAt || null,
  }
}

export async function readCoupons() {
  if (!supabase) return []
  let clearedAt = localStorage.getItem('majisa-coupons-cleared-at')
  try {
    const remoteCleared = await readAppState('coupons_cleared_at', null)
    if (remoteCleared) {
      clearedAt = remoteCleared
      localStorage.setItem('majisa-coupons-cleared-at', remoteCleared)
    }
  } catch (e) {
    console.warn('Failed to read coupons_cleared_at from app_state', e.message)
  }

  try {
    const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) {
      console.warn('Supabase readCoupons warning (project may be paused):', error.message)
      return []
    }
    let coupons = (data || []).map(mapCouponFromRow)
    if (clearedAt) {
      const clearedTime = new Date(clearedAt).getTime()
      coupons = coupons.filter(c => c.created && new Date(c.created).getTime() > clearedTime)
    }
    return coupons
  } catch (err) {
    console.warn('Supabase readCoupons exception:', err.message)
    return []
  }
}

export async function writeCoupon(coupon) {
  if (!supabase) return coupon
  try {
    const { error } = await supabase.from('coupons').upsert(mapCouponToRow(coupon))
    if (error) console.warn('Supabase writeCoupon warning:', error.message)
  } catch (err) {
    console.warn('Supabase writeCoupon exception:', err.message)
  }
  return coupon
}

export async function writeCoupons(coupons) {
  if (!supabase || !coupons.length) return coupons
  try {
    const { error } = await supabase.from('coupons').upsert(coupons.map(mapCouponToRow))
    if (error) console.warn('Supabase writeCoupons warning:', error.message)
  } catch (err) {
    console.warn('Supabase writeCoupons exception:', err.message)
  }
  return coupons
}

export async function markCouponRedeemed(code) {
  if (!supabase) return null
  const redeemedAt = new Date().toISOString()
  try {
    const { error } = await supabase.from('coupons').update({ redeemed_at: redeemedAt }).eq('code', code)
    if (error) console.warn('Supabase markCouponRedeemed warning:', error.message)
  } catch (err) {
    console.warn('Supabase markCouponRedeemed exception:', err.message)
  }
  return redeemedAt
}

export async function markCouponUnredeemed(code) {
  if (!supabase) return null
  try {
    const { error } = await supabase.from('coupons').update({ redeemed_at: null }).eq('code', code)
    if (error) console.warn('Supabase markCouponUnredeemed warning:', error.message)
  } catch (err) {
    console.warn('Supabase markCouponUnredeemed exception:', err.message)
  }
  return true
}

export async function clearAllCouponsSupabase() {
  const now = new Date().toISOString()
  localStorage.setItem('majisa-coupons-cleared-at', now)
  localStorage.setItem('majisa-coupons', '[]')
  if (!supabase) return
  try {
    await writeAppState('coupons_cleared_at', now)
  } catch (e) {
    console.warn('Write coupons_cleared_at error', e)
  }
  try {
    await supabase.from('coupons').delete().neq('code', '')
  } catch (e) {
    console.warn('Coupons delete error', e)
  }
  try {
    await writeAppState('coupons', [])
  } catch (e) {
    console.warn('App state coupons clear error', e)
  }
}

export async function clearAllProductionTestData() {
  const now = new Date().toISOString()
  localStorage.setItem('majisa-coupons-cleared-at', now)
  localStorage.setItem('majisa-bills', '[]')
  localStorage.setItem('majisa-orders', '[]')
  localStorage.setItem('majisa-coupons', '[]')
  localStorage.setItem('majisa-customers', '[]')
  localStorage.removeItem('majisa-customer-phone')
  localStorage.removeItem('majisa-customer-name')
  localStorage.removeItem('majisa-reward')
  localStorage.removeItem('majisa-active-order-id')

  if (!supabase) return true

  try { await writeAppState('bills', []) } catch {}
  try { await writeAppState('orders', []) } catch {}
  try { await writeAppState('customers', []) } catch {}
  try { await writeAppState('coupons', []) } catch {}
  try { await writeAppState('coupons_cleared_at', now) } catch {}
  try { await supabase.from('coupons').delete().neq('code', '') } catch {}

  return true
}
