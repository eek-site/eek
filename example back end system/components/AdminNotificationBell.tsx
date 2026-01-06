'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2, Check } from 'lucide-react'

interface AdminNotificationBellProps {
  adminEmail: string
}

export default function AdminNotificationBell({ adminEmail }: AdminNotificationBellProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }

    setPermission(Notification.permission)

    // Check if already subscribed
    if (Notification.permission === 'granted') {
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    } catch (e) {
      console.error('Failed to check subscription:', e)
    }
  }

  const subscribe = async () => {
    setLoading(true)
    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setLoading(false)
        return
      }

      // Register admin service worker if not already
      const registration = await navigator.serviceWorker.register('/admin-sw.js')
      await navigator.serviceWorker.ready

      // Get VAPID public key
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        console.error('VAPID public key not configured')
        setLoading(false)
        return
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource
      })

      // Send subscription to server
      await fetch('/api/admin-notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          adminEmail
        })
      })

      setIsSubscribed(true)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (e) {
      console.error('Failed to subscribe:', e)
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove from server
        await fetch('/api/admin-notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminEmail })
        })
      }

      setIsSubscribed(false)
    } catch (e) {
      console.error('Failed to unsubscribe:', e)
    } finally {
      setLoading(false)
    }
  }

  // Don't show if not supported
  if (permission === 'unsupported') {
    return null
  }

  // Don't show if permission denied
  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <BellOff className="w-4 h-4" />
        <span className="hidden sm:inline">Blocked</span>
      </div>
    )
  }

  return (
    <button
      onClick={isSubscribed ? unsubscribe : subscribe}
      disabled={loading}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
        isSubscribed
          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
          : 'bg-red/20 text-red hover:bg-red/30'
      }`}
      title={isSubscribed ? 'Notifications enabled - click to disable' : 'Click to enable notifications'}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : showSuccess ? (
        <Check className="w-4 h-4" />
      ) : isSubscribed ? (
        <Bell className="w-4 h-4" />
      ) : (
        <BellOff className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">
        {loading ? '...' : showSuccess ? 'On!' : isSubscribed ? 'Alerts' : 'Alerts Off'}
      </span>
    </button>
  )
}

// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
