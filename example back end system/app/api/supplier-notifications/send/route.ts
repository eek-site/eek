import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import webpush from 'web-push'

export const dynamic = 'force-dynamic'

// Get VAPID keys from environment
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

// Only configure web-push if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@eek.co.nz',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

interface PushPayload {
  title: string
  body: string
  url?: string
  jobId?: string
  tab?: string
  tag?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured - skipping push notification')
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        message: 'Push notifications not configured' 
      })
    }

    const { portalCode, title, body, url, jobId, tab, tag } = await request.json()

    if (!portalCode) {
      return NextResponse.json(
        { success: false, error: 'Missing portalCode' },
        { status: 400 }
      )
    }

    // Get the subscription for this supplier
    const subscriptionJson = await kv.get(`push-subscription:${portalCode}`)

    if (!subscriptionJson) {
      return NextResponse.json({ 
        success: true, 
        sent: false,
        message: 'No subscription found for this supplier' 
      })
    }

    const subscription = typeof subscriptionJson === 'string' 
      ? JSON.parse(subscriptionJson) 
      : subscriptionJson

    // Prepare the notification payload
    const payload: PushPayload = {
      title: title || 'Eek Mechanical',
      body: body || 'You have a new notification',
      url: url,
      jobId: jobId,
      tab: tab,
      tag: tag || 'hook-towing'
    }

    // Send the push notification
    await webpush.sendNotification(subscription, JSON.stringify(payload))

    return NextResponse.json({ success: true, sent: true })
  } catch (error) {
    console.error('Failed to send push notification:', error)
    
    // If subscription is invalid, remove it
    if (error instanceof Error && error.message.includes('expired')) {
      const { portalCode } = await request.json()
      if (portalCode) {
        await kv.del(`push-subscription:${portalCode}`)
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
