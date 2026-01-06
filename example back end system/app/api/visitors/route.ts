import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { 
  VisitorSession, 
  PageView, 
  generateVisitorId, 
  parseTrackingParams, 
  getVisitorExpiry,
  getSourceLabel,
  getSourceEmoji
} from '@/lib/visitor-tracking'
import { sendInternalNotification } from '@/lib/internal-notifications'

const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60

// IP Geolocation lookup
async function getGeoLocation(ip: string): Promise<{ city?: string; region?: string; country?: string } | null> {
  try {
    // Skip localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return null
    }
    
    // Use free ipapi.co service (1000 requests/day free)
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'HookTowing/1.0' }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    if (data.error) return null
    
    return {
      city: data.city,
      region: data.region,
      country: data.country_name
    }
  } catch {
    return null
  }
}

// POST - Create or update visitor session
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { 
      visitorId, 
      url, 
      referrer, 
      title,
      device,
      event // Optional: 'pageview', 'scroll', etc.
    } = data
    
    const now = new Date().toISOString()
    let visitor: VisitorSession | null = null
    let isNewVisitor = false
    
    // Try to get existing visitor
    if (visitorId) {
      visitor = await kv.hgetall(`visitor:${visitorId}`) as VisitorSession | null
    }
    
    if (!visitor) {
      // New visitor - create session
      isNewVisitor = true
      const newId = visitorId || generateVisitorId()
      const trackingParams = parseTrackingParams(url || 'https://eek.co.nz/')
      
      visitor = {
        id: newId,
        createdAt: now,
        updatedAt: now,
        expiresAt: getVisitorExpiry(),
        source: {
          referrer: referrer || null,
          ...trackingParams,
          landingPage: trackingParams.landingPage || '/'
        },
        device: device || {
          userAgent: request.headers.get('user-agent') || '',
          platform: 'unknown',
          language: 'en',
          screenWidth: 0,
          screenHeight: 0,
          timezone: 'Pacific/Auckland',
          isMobile: false
        },
        pageViews: [],
        metrics: {
          totalPageViews: 0,
          uniquePages: 0,
          totalTimeOnSite: 0,
          lastActiveAt: now,
          sessionCount: 1,
          isReturning: false
        }
      }
      
      // Get location from Vercel's geo headers (automatic on Vercel)
      const forwarded = request.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip')
      
      // Vercel provides these headers automatically
      const city = request.headers.get('x-vercel-ip-city')
      const region = request.headers.get('x-vercel-ip-country-region')
      const country = request.headers.get('x-vercel-ip-country')
      
      visitor.location = {
        ip: ip || undefined,
        city: city ? decodeURIComponent(city) : undefined,
        region: region || undefined,
        country: country || undefined
      }
    } else {
      // Returning visitor
      visitor.updatedAt = now
      visitor.metrics.lastActiveAt = now
      
      // Check if this is a new session (more than 30 min since last activity)
      const lastActive = new Date(visitor.metrics.lastActiveAt).getTime()
      if (Date.now() - lastActive > 30 * 60 * 1000) {
        visitor.metrics.sessionCount++
        visitor.metrics.isReturning = true
      }
    }
    
    // Add page view if URL provided
    if (url) {
      try {
        const urlObj = new URL(url)
        const pageView: PageView = {
          url,
          path: urlObj.pathname,
          title: title || urlObj.pathname,
          timestamp: now,
          referrer: visitor.pageViews.length > 0 
            ? visitor.pageViews[visitor.pageViews.length - 1].path 
            : (referrer || '')
        }
        
        // Calculate time on previous page
        if (visitor.pageViews.length > 0) {
          const lastView = visitor.pageViews[visitor.pageViews.length - 1]
          const lastTime = new Date(lastView.timestamp).getTime()
          const timeOnPage = Math.round((Date.now() - lastTime) / 1000)
          // Only count if reasonable (less than 30 min)
          if (timeOnPage < 1800) {
            lastView.timeOnPage = timeOnPage
            visitor.metrics.totalTimeOnSite += timeOnPage
          }
        }
        
        visitor.pageViews.push(pageView)
        visitor.metrics.totalPageViews++
        
        // Count unique pages
        const uniquePaths = new Set(visitor.pageViews.map(pv => pv.path))
        visitor.metrics.uniquePages = uniquePaths.size
      } catch {
        // Invalid URL, skip
      }
    }
    
    // Handle scroll depth update
    if (event === 'scroll' && data.scrollDepth && visitor.pageViews.length > 0) {
      const lastView = visitor.pageViews[visitor.pageViews.length - 1]
      lastView.scrollDepth = Math.max(lastView.scrollDepth || 0, data.scrollDepth)
    }
    
    // Save visitor to KV with 30-day expiry
    await kv.hset(`visitor:${visitor.id}`, visitor)
    await kv.expire(`visitor:${visitor.id}`, THIRTY_DAYS_SECONDS)
    
    // Add to visitors list (sorted by time)
    await kv.zadd('visitors:list', {
      score: Date.now(),
      member: visitor.id
    })
    
    // Send email notification for NEW visitors only
    if (isNewVisitor) {
      const sourceLabel = getSourceLabel(visitor.source)
      const sourceEmoji = getSourceEmoji(visitor.source)
      
      // Build admin link
      const adminUrl = `https://eek.co.nz/admin?tab=visitors&observe=${visitor.id}`
      
      // Build location string
      const locationParts = [visitor.location?.city, visitor.location?.region, visitor.location?.country].filter(Boolean)
      const locationStr = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown'
      
      await sendInternalNotification({
        type: 'visitor_arrived',
        bookingId: visitor.id,
        timestamp: now,
        // Custom fields for visitor notification
        visitorId: visitor.id,
        sourceLabel,
        sourceEmoji,
        referrer: visitor.source.referrer || 'Direct',
        landingPage: visitor.source.landingPage,
        utmCampaign: visitor.source.utmCampaign || '',
        gclid: visitor.source.gclid || '',
        devicePlatform: visitor.device.platform,
        isMobile: visitor.device.isMobile ? 'Yes' : 'No',
        visitorLocation: locationStr,
        adminUrl
      })
    }
    
    return NextResponse.json({
      success: true,
      visitorId: visitor.id,
      isNew: isNewVisitor
    })
    
  } catch (error) {
    console.error('Visitor tracking error:', error)
    return NextResponse.json({
      success: false,
      error: 'Tracking failed'
    }, { status: 500 })
  }
}

// GET - List visitors (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const source = searchParams.get('source') // Filter by source type
    
    // Get visitor IDs sorted by most recent
    const visitorIds = await kv.zrange('visitors:list', offset, offset + limit - 1, {
      rev: true
    }) as string[]
    
    // Get visitor details
    const visitors: VisitorSession[] = []
    for (const id of visitorIds) {
      const visitor = await kv.hgetall(`visitor:${id}`) as VisitorSession | null
      if (visitor) {
        // Apply source filter if specified
        if (source) {
          const visitorSource = getSourceLabel(visitor.source).toLowerCase()
          if (!visitorSource.includes(source.toLowerCase())) {
            continue
          }
        }
        visitors.push(visitor)
      }
    }
    
    // Get total count
    const totalCount = await kv.zcard('visitors:list')
    
    return NextResponse.json({
      success: true,
      visitors,
      total: totalCount,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Visitor list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get visitors',
      visitors: []
    }, { status: 500 })
  }
}
