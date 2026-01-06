'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const VISITOR_ID_KEY = 'hook_visitor_id'
const VISITOR_EXPIRY_KEY = 'hook_visitor_expiry'

interface DeviceInfo {
  userAgent: string
  platform: string
  language: string
  screenWidth: number
  screenHeight: number
  timezone: string
  isMobile: boolean
}

function getDeviceInfo(): DeviceInfo {
  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  
  return {
    userAgent,
    platform: navigator.platform || 'unknown',
    language: navigator.language || 'en',
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    isMobile
  }
}

function getStoredVisitorId(): string | null {
  try {
    const id = localStorage.getItem(VISITOR_ID_KEY)
    const expiry = localStorage.getItem(VISITOR_EXPIRY_KEY)
    
    if (!id || !expiry) return null
    
    // Check if expired
    if (new Date(expiry).getTime() < Date.now()) {
      localStorage.removeItem(VISITOR_ID_KEY)
      localStorage.removeItem(VISITOR_EXPIRY_KEY)
      return null
    }
    
    return id
  } catch {
    return null
  }
}

function storeVisitorId(id: string): void {
  try {
    const expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    localStorage.setItem(VISITOR_ID_KEY, id)
    localStorage.setItem(VISITOR_EXPIRY_KEY, expiry)
  } catch {
    // localStorage not available
  }
}

export default function VisitorTracker() {
  const pathname = usePathname()
  const lastPathRef = useRef<string | null>(null)
  const visitorIdRef = useRef<string | null>(null)
  const scrollMaxRef = useRef<number>(0)
  
  // Track page view
  const trackPageView = useCallback(async (path: string) => {
    try {
      // Skip admin pages
      if (path.startsWith('/admin') || path.startsWith('/login')) {
        return
      }
      
      const storedId = getStoredVisitorId()
      
      const response = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: storedId,
          url: window.location.href,
          referrer: document.referrer || null,
          title: document.title,
          device: getDeviceInfo()
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.visitorId) {
        visitorIdRef.current = data.visitorId
        if (!storedId || data.isNew) {
          storeVisitorId(data.visitorId)
        }
      }
    } catch (err) {
      console.error('Visitor tracking error:', err)
    }
  }, [])
  
  // Track scroll depth
  const trackScroll = useCallback(async () => {
    if (!visitorIdRef.current) return
    
    const scrollTop = window.scrollY
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0
    
    // Only track if scroll depth increased significantly
    if (scrollPercent > scrollMaxRef.current + 10) {
      scrollMaxRef.current = scrollPercent
      
      try {
        await fetch('/api/visitors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId: visitorIdRef.current,
            event: 'scroll',
            scrollDepth: scrollPercent
          })
        })
      } catch {
        // Silent fail for scroll tracking
      }
    }
  }, [])
  
  // Initial load & page changes
  useEffect(() => {
    // Track immediately on load
    if (pathname !== lastPathRef.current) {
      lastPathRef.current = pathname
      scrollMaxRef.current = 0
      trackPageView(pathname)
    }
  }, [pathname, trackPageView])
  
  // Scroll tracking with debounce
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout
    
    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(trackScroll, 500)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
    }
  }, [trackScroll])
  
  // Track time on page when leaving
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && visitorIdRef.current) {
        // Use sendBeacon for reliable tracking on page hide
        const data = JSON.stringify({
          visitorId: visitorIdRef.current,
          event: 'page_leave'
        })
        navigator.sendBeacon('/api/visitors', data)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
  
  // Invisible component
  return null
}
