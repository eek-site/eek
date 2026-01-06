/**
 * Booking utilities for encoding/decoding booking data
 * and managing session state
 */

export interface BookingData {
  // Minimum required
  rego?: string
  pickupLocation: string
  dropoffLocation?: string
  price: number  // in cents (e.g., 15000 = $150.00)
  eta?: string   // e.g., "30 mins"
  
  // Supplier (towing company) - start location
  supplierName?: string       // e.g., "Sam's Auto & Towing"
  supplierAddress?: string    // Full address
  supplierCoords?: { lat: number; lng: number }
  supplierPhone?: string      // Phone number
  supplierPhoneLandline?: boolean // True if phone is landline
  supplierMobile?: string     // Mobile for SMS if landline
  supplierEmail?: string      // Supplier email
  
  // Optional pre-filled data
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  issueType?: string
  description?: string
  
  // Metadata
  createdAt: string
  createdBy: string
  bookingId: string
  expiresAt: string
}

export interface PaymentSession {
  bookingId: string
  status: 'pending' | 'processing' | 'paid_pending_details' | 'completed' | 'failed'
  submittedAt?: string
  paidAt?: string
  amount?: number
  transactionId?: string
}

// Simple encoding - in production use JWT or proper encryption
export function encodeBookingData(data: BookingData): string {
  const json = JSON.stringify(data)
  // Base64 encode and make URL safe
  return Buffer.from(json).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

export function decodeBookingData(encoded: string): BookingData | null {
  try {
    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4
    if (padding) {
      base64 += '='.repeat(4 - padding)
    }
    const json = Buffer.from(base64, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch (e) {
    console.error('Failed to decode booking data:', e)
    return null
  }
}

// Generate unique booking ID
export function generateBookingId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HT-${timestamp}-${random}`
}

// Generate unique supplier link code
export function generateSupplierCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${timestamp}${random}`
}

// Format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD'
  }).format(cents / 100)
}

// Check if booking link has expired (24 hours by default)
export function isBookingExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date()
}

// Session storage keys
const SESSION_KEY = 'hook_payment_session'
const COMPLETED_KEY = 'hook_completed_bookings'

// Get current payment session
export function getPaymentSession(bookingId: string): PaymentSession | null {
  if (typeof window === 'undefined') return null
  
  const stored = sessionStorage.getItem(`${SESSION_KEY}_${bookingId}`)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

// Save payment session
export function savePaymentSession(session: PaymentSession): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(`${SESSION_KEY}_${session.bookingId}`, JSON.stringify(session))
}

// Mark booking as completed
export function markBookingCompleted(bookingId: string): void {
  if (typeof window === 'undefined') return
  
  const completed = getCompletedBookings()
  if (!completed.includes(bookingId)) {
    completed.push(bookingId)
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(completed))
  }
  
  // Also update session
  const session = getPaymentSession(bookingId)
  if (session) {
    session.status = 'completed'
    session.paidAt = new Date().toISOString()
    savePaymentSession(session)
  }
}

// Check if booking was already completed
export function isBookingCompleted(bookingId: string): boolean {
  if (typeof window === 'undefined') return false
  
  const completed = getCompletedBookings()
  return completed.includes(bookingId)
}

// Get all completed booking IDs
export function getCompletedBookings(): string[] {
  if (typeof window === 'undefined') return []
  
  const stored = localStorage.getItem(COMPLETED_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Clear session for a booking
export function clearPaymentSession(bookingId: string): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(`${SESSION_KEY}_${bookingId}`)
}
