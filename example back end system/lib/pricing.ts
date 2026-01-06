/**
 * Eek Mechanical Pricing Calculator
 */

// Rate per kilometer (one-way is Start→Pickup→Dropoff→Start)
export const KM_RATE = 4.03

// Callout fees based on time
export const CALLOUT_FEES = {
  weekday_day: 189,      // Mon-Fri 9am-5pm
  weekday_evening: 229,  // Mon-Fri 5pm-9pm
  weekday_night: 249,    // Mon-Fri 9pm-9am
  weekend: 289,          // Sat-Sun all day
} as const

export type CalloutPeriod = keyof typeof CALLOUT_FEES

// Get the current callout period based on date/time
export function getCurrentCalloutPeriod(date: Date = new Date()): CalloutPeriod {
  const day = date.getDay() // 0 = Sunday, 6 = Saturday
  const hour = date.getHours()
  
  // Weekend (Saturday or Sunday)
  if (day === 0 || day === 6) {
    return 'weekend'
  }
  
  // Weekday
  if (hour >= 9 && hour < 17) {
    return 'weekday_day'
  } else if (hour >= 17 && hour < 21) {
    return 'weekday_evening'
  } else {
    return 'weekday_night'
  }
}

// Get callout fee for current time
export function getCurrentCalloutFee(date: Date = new Date()): number {
  return CALLOUT_FEES[getCurrentCalloutPeriod(date)]
}

// Get display label for callout period
export function getCalloutPeriodLabel(period: CalloutPeriod): string {
  switch (period) {
    case 'weekday_day': return 'Weekday 9am-5pm'
    case 'weekday_evening': return 'Weekday 5pm-9pm'
    case 'weekday_night': return 'Weekday 9pm-9am'
    case 'weekend': return 'Weekend'
  }
}

// Calculate total price
export function calculateTotalPrice(distanceKm: number, calloutFee: number): number {
  const kmCost = Math.round(distanceKm * KM_RATE * 100) // in cents
  const calloutCents = calloutFee * 100
  return kmCost + calloutCents
}

// Format price breakdown for display
export function formatPriceBreakdown(distanceKm: number, calloutFee: number): {
  kmCost: number      // in cents
  calloutCost: number // in cents
  total: number       // in cents
  kmDisplay: string
  calloutDisplay: string
  totalDisplay: string
  distanceDisplay: string
} {
  const kmCost = Math.round(distanceKm * KM_RATE * 100)
  const calloutCost = calloutFee * 100
  const total = kmCost + calloutCost
  
  const formatCents = (cents: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(cents / 100)
  }
  
  return {
    kmCost,
    calloutCost,
    total,
    kmDisplay: formatCents(kmCost),
    calloutDisplay: formatCents(calloutCost),
    totalDisplay: formatCents(total),
    distanceDisplay: `${distanceKm.toFixed(1)} km`
  }
}

// Default depot location (Hamilton base)
// No default depot - admin selects towing company from Google Maps each time
export const DEFAULT_DEPOT = {
  name: '',
  address: '',
  coords: undefined as { lat: number; lng: number } | undefined
}
