import { initializeApp } from 'firebase/app'
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, setDoc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const firebaseApp = firebaseConfig.projectId ? initializeApp(firebaseConfig) : null
export const db = firebaseApp ? getFirestore(firebaseApp) : null
export const hasFirebase = Boolean(db)

export async function readAppState(key, fallback) {
  if (!db) return fallback
  try {
    const docRef = doc(db, 'app_state', key)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return docSnap.data()?.data ?? fallback
    }
    return fallback
  } catch (err) {
    console.error('Error reading app state from Firebase:', err)
    return fallback
  }
}

export async function hasAppState(key) {
  if (!db) return false
  try {
    const docRef = doc(db, 'app_state', key)
    const docSnap = await getDoc(docRef)
    return docSnap.exists()
  } catch (err) {
    console.error('Error checking app state in Firebase:', err)
    return false
  }
}

export async function writeAppState(key, value) {
  if (!db) return value
  try {
    const docRef = doc(db, 'app_state', key)
    await setDoc(docRef, {
      key,
      data: value,
      updated_at: new Date().toISOString()
    }, { merge: true })
    return value
  } catch (err) {
    console.error('Error writing app state to Firebase:', err)
    return value
  }
}

function mapCouponFromDoc(docData) {
  return {
    reward: docData.reward,
    code: docData.code,
    created: docData.created_at,
    expiresAt: docData.expires_at,
    amount: docData.amount,
    mobile: docData.mobile || '',
    upiRef: docData.upi_ref || '',
    redeemedAt: docData.redeemed_at,
  }
}

function mapCouponToDoc(coupon) {
  return {
    code: coupon.code,
    reward: coupon.reward,
    amount: Number(coupon.amount || 0),
    mobile: coupon.mobile || null,
    upi_ref: coupon.upiRef || null,
    created_at: coupon.created,
    expires_at: coupon.expiresAt,
    redeemed_at: coupon.redeemedAt || null,
  }
}

export async function readCoupons() {
  if (!db) return []
  try {
    const couponsRef = collection(db, 'coupons')
    const q = query(couponsRef, orderBy('created_at', 'desc'))
    const querySnapshot = await getDocs(q)
    const list = []
    querySnapshot.forEach((d) => {
      list.push(mapCouponFromDoc(d.data()))
    })
    return list
  } catch (err) {
    console.error('Error reading coupons from Firebase:', err)
    return []
  }
}

export async function writeCoupon(coupon) {
  if (!db) return coupon
  try {
    const docRef = doc(db, 'coupons', coupon.code)
    await setDoc(docRef, mapCouponToDoc(coupon), { merge: true })
    return coupon
  } catch (err) {
    console.error('Error writing coupon to Firebase:', err)
    return coupon
  }
}

export async function writeCoupons(coupons) {
  if (!db || !coupons.length) return coupons
  try {
    for (const c of coupons) {
      await writeCoupon(c)
    }
    return coupons
  } catch (err) {
    console.error('Error writing coupons to Firebase:', err)
    return coupons
  }
}

export async function markCouponRedeemed(code) {
  if (!db) return null
  const redeemedAt = new Date().toISOString()
  try {
    const docRef = doc(db, 'coupons', code)
    await updateDoc(docRef, { redeemed_at: redeemedAt })
    return redeemedAt
  } catch (err) {
    console.error('Error marking coupon redeemed in Firebase:', err)
    return null
  }
}
