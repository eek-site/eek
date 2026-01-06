import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { subscription, portalCode } = await request.json()

    if (!subscription || !portalCode) {
      return NextResponse.json(
        { success: false, error: 'Missing subscription or portalCode' },
        { status: 400 }
      )
    }

    // Store the push subscription for this supplier
    await kv.set(`push-subscription:${portalCode}`, JSON.stringify(subscription))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { portalCode } = await request.json()

    if (!portalCode) {
      return NextResponse.json(
        { success: false, error: 'Missing portalCode' },
        { status: 400 }
      )
    }

    // Remove the push subscription
    await kv.del(`push-subscription:${portalCode}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete push subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
