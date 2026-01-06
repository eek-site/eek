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
  tab?: string
  rego?: string
  tag?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check if VAPID keys are configured
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      console.warn('VAPID keys not configured - skipping admin push notification')
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        message: 'Push notifications not configured' 
      })
    }

    const { title, body, url, tab, rego, tag } = await request.json()

    // Get all admin subscriptions
    const adminEmails = await kv.smembers('admin-push-subscriptions') as string[]

    if (!adminEmails || adminEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sent: false,
        message: 'No admin subscriptions found' 
      })
    }

    // Prepare the notification payload
    const payload: PushPayload = {
      title: title || 'Hook Admin',
      body: body || 'You have a new notification',
      url: url || '/admin',
      tab: tab,
      rego: rego,
      tag: tag || 'hook-admin'
    }

    let sentCount = 0
    const errors: string[] = []

    // Send to all subscribed admins
    for (const email of adminEmails) {
      try {
        const subscriptionJson = await kv.get(`admin-push-subscription:${email}`)
        
        if (!subscriptionJson) continue

        const subscription = typeof subscriptionJson === 'string' 
          ? JSON.parse(subscriptionJson) 
          : subscriptionJson

        await webpush.sendNotification(subscription, JSON.stringify(payload))
        sentCount++
      } catch (error) {
        console.error(`Failed to send notification to ${email}:`, error)
        errors.push(email)
        
        // If subscription is invalid, remove it
        if (error instanceof Error && (error.message.includes('expired') || error.message.includes('410'))) {
          await kv.del(`admin-push-subscription:${email}`)
          await kv.srem('admin-push-subscriptions', email)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      total: adminEmails.length,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Failed to send admin push notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send notifications' },
      { status: 500 }
    )
  }
}
