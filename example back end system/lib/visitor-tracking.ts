/**
 * Visitor Tracking System
 * Tracks website visitors, their source, and journey through the site
 * Data retained for 30 days
 */

// Visitor session data structure
export interface VisitorSession {
  id: string                        // Unique visitor ID (UUID)
  fingerprint?: string             // Browser fingerprint for identification
  createdAt: string                // First visit timestamp
  updatedAt: string                // Last activity timestamp
  expiresAt: string                // Auto-delete after 30 days
  
  // Source tracking
  source: {
    referrer: string | null        // document.referrer
    utmSource?: string             // utm_source
    utmMedium?: string             // utm_medium
    utmCampaign?: string           // utm_campaign
    utmTerm?: string               // utm_term
    utmContent?: string            // utm_content
    gclid?: string                 // Google Ads click ID
    fbclid?: string                // Facebook click ID
    msclkid?: string               // Microsoft Ads click ID
    adsSrc?: string                // Custom ads_src param
    landingPage: string            // First page visited
  }
  
  // Device info
  device: {
    userAgent: string
    platform: string
    language: string
    screenWidth: number
    screenHeight: number
    timezone: string
    isMobile: boolean
  }
  
  // Location (from IP)
  location?: {
    ip?: string
    city?: string
    region?: string
    country?: string
  }
  
  // Page views / journey
  pageViews: PageView[]
  
  // Engagement metrics
  metrics: {
    totalPageViews: number
    uniquePages: number
    totalTimeOnSite: number       // seconds
    lastActiveAt: string
    sessionCount: number          // How many sessions
    isReturning: boolean
  }
  
  // Conversion tracking
  converted?: {
    type: 'booking' | 'contact' | 'call'
    bookingId?: string
    timestamp: string
  }
  
  // Admin observation
  observed?: {
    by: string
    at: string
  }
  
  // Index signature for Vercel KV compatibility
  [key: string]: unknown
}

export interface PageView {
  url: string
  path: string
  title: string
  timestamp: string
  timeOnPage?: number             // seconds (calculated when leaving)
  scrollDepth?: number            // percentage 0-100
  referrer: string               // internal referrer (previous page)
}

export interface VisitorEvent {
  type: 'pageview' | 'click' | 'scroll' | 'form_start' | 'form_submit' | 'call_click' | 'conversion'
  timestamp: string
  data: Record<string, unknown>
}

// Generate unique visitor ID
export function generateVisitorId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `v_${timestamp}_${random}`
}

// Parse UTM and tracking params from URL
export function parseTrackingParams(url: string): Partial<VisitorSession['source']> {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
      gclid: params.get('gclid') || undefined,
      fbclid: params.get('fbclid') || undefined,
      msclkid: params.get('msclkid') || undefined,
      adsSrc: params.get('ads_src') || undefined,
      landingPage: urlObj.pathname
    }
  } catch {
    return { landingPage: '/' }
  }
}

// Determine source label from tracking data
export function getSourceLabel(source: VisitorSession['source']): string {
  if (source.gclid) return 'Google Ads'
  if (source.fbclid) return 'Facebook Ads'
  if (source.msclkid) return 'Microsoft Ads'
  if (source.utmSource) {
    const medium = source.utmMedium ? ` (${source.utmMedium})` : ''
    return `${source.utmSource}${medium}`
  }
  if (source.referrer) {
    try {
      const ref = new URL(source.referrer)
      if (ref.hostname.includes('google')) return 'Google Search'
      if (ref.hostname.includes('bing')) return 'Bing Search'
      if (ref.hostname.includes('facebook')) return 'Facebook'
      if (ref.hostname.includes('instagram')) return 'Instagram'
      if (ref.hostname.includes('linkedin')) return 'LinkedIn'
      return ref.hostname
    } catch {
      return 'Referral'
    }
  }
  return 'Direct'
}

// Get source icon/emoji
export function getSourceEmoji(source: VisitorSession['source']): string {
  if (source.gclid) return '🔵' // Google Ads
  if (source.fbclid) return '📘' // Facebook
  if (source.msclkid) return '🟢' // Microsoft
  if (source.utmSource) return '🏷️' // UTM tagged
  if (source.referrer) {
    try {
      const ref = new URL(source.referrer)
      if (ref.hostname.includes('google')) return '🔍'
      if (ref.hostname.includes('facebook')) return '📘'
      if (ref.hostname.includes('instagram')) return '📷'
      return '🔗'
    } catch {
      return '🔗'
    }
  }
  return '🎯' // Direct
}

// Calculate 30-day expiry
export function getVisitorExpiry(): string {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
}

// Format visitor for display
export function formatVisitorSummary(visitor: VisitorSession): string {
  const source = getSourceLabel(visitor.source)
  const pages = visitor.metrics.totalPageViews
  const time = Math.round(visitor.metrics.totalTimeOnSite / 60)
  return `${source} → ${pages} pages, ${time}m`
}
