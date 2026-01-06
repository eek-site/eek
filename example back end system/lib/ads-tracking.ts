/**
 * Google Ads Multi-Account Tracking
 * 
 * Captures which Google Ads account brought the visitor and fires
 * the correct conversion tag on payment completion.
 */

// Define your Google Ads accounts and their conversion actions
export const GOOGLE_ADS_ACCOUNTS = {
  // Eek Mechanical main account
  'hook-main': {
    id: 'AW-17084465163',
    conversionLabel: 'VkFHCNfslMAbEIuAwdI_',
    name: 'Eek Mechanical Main'
  },
  // Second account (add your conversion label)
  'hook-secondary': {
    id: 'AW-17529704008',
    conversionLabel: 'YOUR_CONVERSION_LABEL_HERE', // Replace with actual label
    name: 'Eek Mechanical Secondary'
  }
} as const

export type AdsAccountKey = keyof typeof GOOGLE_ADS_ACCOUNTS

// Storage keys
const ADS_SOURCE_KEY = 'hook_ads_source'
const GCLID_KEY = 'hook_gclid'

export interface AdsTrackingData {
  accountKey: AdsAccountKey | null
  gclid: string | null
  landingPage: string
  timestamp: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

/**
 * Call this on page load to capture Google Ads source
 * Best placed in a layout or top-level component
 */
export function captureAdsSource(): AdsTrackingData | null {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const params = url.searchParams

  // Check if we already have tracking data for this session
  const existing = getAdsTrackingData()
  
  // Google Click ID - proves they came from Google Ads
  const gclid = params.get('gclid')
  
  // Custom parameter to identify which account (add to your ad URLs)
  // e.g., ?ads_src=hook-main or ?ads_src=hook-secondary
  const adsSrc = params.get('ads_src') as AdsAccountKey | null
  
  // UTM parameters
  const utmSource = params.get('utm_source') || undefined
  const utmMedium = params.get('utm_medium') || undefined
  const utmCampaign = params.get('utm_campaign') || undefined

  // If we have a gclid, this is a fresh Google Ads click
  if (gclid) {
    const trackingData: AdsTrackingData = {
      accountKey: adsSrc || detectAccountFromParams(params),
      gclid,
      landingPage: window.location.pathname,
      timestamp: new Date().toISOString(),
      utmSource,
      utmMedium,
      utmCampaign
    }

    // Store for later conversion
    saveAdsTrackingData(trackingData)
    
    console.log('📊 Google Ads source captured:', trackingData)
    return trackingData
  }

  // Return existing data if we have it
  return existing
}

/**
 * Try to detect account from URL parameters
 */
function detectAccountFromParams(params: URLSearchParams): AdsAccountKey | null {
  // Check utm_campaign for account hints
  const campaign = params.get('utm_campaign')?.toLowerCase() || ''
  
  // Add your detection logic here
  // For example, if campaigns are named with prefixes:
  if (campaign.includes('main_') || campaign.includes('primary')) {
    return 'hook-main'
  }
  if (campaign.includes('secondary_') || campaign.includes('alt_')) {
    return 'hook-secondary'
  }

  // Default to main account if we can't determine
  return 'hook-main'
}

/**
 * Save tracking data to sessionStorage
 */
function saveAdsTrackingData(data: AdsTrackingData): void {
  if (typeof window === 'undefined') return
  
  sessionStorage.setItem(ADS_SOURCE_KEY, JSON.stringify(data))
  if (data.gclid) {
    // Also store gclid in localStorage for cross-session attribution
    localStorage.setItem(GCLID_KEY, data.gclid)
  }
}

/**
 * Get stored tracking data
 */
export function getAdsTrackingData(): AdsTrackingData | null {
  if (typeof window === 'undefined') return null

  const stored = sessionStorage.getItem(ADS_SOURCE_KEY)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

/**
 * Fire conversion for ALL accounts (safest approach)
 * Google deduplicates based on transaction_id
 */
export function fireAllConversions(value: number, transactionId: string): void {
  if (typeof window === 'undefined' || !('gtag' in window)) return

  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag

  Object.entries(GOOGLE_ADS_ACCOUNTS).forEach(([key, account]) => {
    const sendTo = `${account.id}/${account.conversionLabel}`
    
    gtag('event', 'conversion', {
      'send_to': sendTo,
      'value': value,
      'currency': 'NZD',
      'transaction_id': transactionId
    })

    console.log(`🎯 Conversion fired for ${account.name}:`, {
      send_to: sendTo,
      value,
      transaction_id: transactionId
    })
  })
}

/**
 * Fire conversion for a specific account only
 */
export function fireConversion(
  accountKey: AdsAccountKey, 
  value: number, 
  transactionId: string
): void {
  if (typeof window === 'undefined' || !('gtag' in window)) return

  const account = GOOGLE_ADS_ACCOUNTS[accountKey]
  if (!account) {
    console.warn(`Unknown ads account: ${accountKey}`)
    return
  }

  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag
  const sendTo = `${account.id}/${account.conversionLabel}`

  gtag('event', 'conversion', {
    'send_to': sendTo,
    'value': value,
    'currency': 'NZD',
    'transaction_id': transactionId
  })

  console.log(`🎯 Conversion fired for ${account.name}:`, {
    send_to: sendTo,
    value,
    transaction_id: transactionId
  })
}

/**
 * Smart conversion firing - uses tracked source or fires all
 */
export function fireSmartConversion(value: number, transactionId: string): void {
  const tracking = getAdsTrackingData()

  if (tracking?.accountKey) {
    // We know which account brought them
    fireConversion(tracking.accountKey, value, transactionId)
  } else {
    // Fire all - Google will dedupe
    fireAllConversions(value, transactionId)
  }
}

/**
 * Debug: Log what Google Ads data we have
 */
export function debugAdsTracking(): void {
  if (typeof window === 'undefined') return

  const tracking = getAdsTrackingData()
  const storedGclid = localStorage.getItem(GCLID_KEY)

  console.group('🔍 Google Ads Tracking Debug')
  console.log('Session tracking data:', tracking)
  console.log('Stored GCLID:', storedGclid)
  console.log('Current URL params:', Object.fromEntries(new URL(window.location.href).searchParams))
  console.log('Configured accounts:', GOOGLE_ADS_ACCOUNTS)
  console.groupEnd()
}
