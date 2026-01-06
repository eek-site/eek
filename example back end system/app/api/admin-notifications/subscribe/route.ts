import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { subscription, adminEmail } = await request.json()

    if (!subscription || !adminEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription or adminEmail' },
        { status: 400 }
      )
    }

    // Store the push subscription for this admin
    // Use a list so multiple admins can receive notifications
    const key = `admin-push-subscription:${adminEmail}`
    await kv.set(key, JSON.stringify(subscription))
    
    // Also add to list of all admin subscriptions
    await kv.sadd('admin-push-subscriptions', adminEmail)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save admin push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { adminEmail } = await request.json()

    if (!adminEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing adminEmail' },
        { status: 400 }
      )
    }

    // Remove the push subscription
    await kv.del(`admin-push-subscription:${adminEmail}`)
    await kv.srem('admin-push-subscriptions', adminEmail)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete admin push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
