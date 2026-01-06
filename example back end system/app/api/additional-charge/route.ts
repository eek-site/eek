import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

interface AdditionalChargeRequest {
  bookingId: string
  amount: number // in dollars (will convert to cents)
  reason: string
  sendPaymentLink?: boolean // If true, sends payment link to customer
  addedBy?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AdditionalChargeRequest = await request.json()
    const { bookingId, amount, reason, sendPaymentLink = true, addedBy = 'admin' } = body

    if (!bookingId || !amount || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bookingId, amount, reason'
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount must be greater than 0'
      }, { status: 400 })
    }

    // Find the job
    let job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null

    // If not found by bookingId, search through jobs:list
    if (!job) {
      const allJobKeys = await kv.lrange('jobs:list', 0, 200) as string[]
      for (const key of allJobKeys) {
        const candidate = await kv.hgetall(`job:${key}`) as Record<string, unknown> | null
        if (candidate && candidate.bookingId === bookingId) {
          job = candidate
          break
        }
      }
    }

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }

    const amountInCents = Math.round(amount * 100)
    
    // Create the additional charge record
    const additionalCharge = {
      amount: amountInCents,
      reason,
      addedAt: new Date().toISOString(),
      addedBy,
      status: 'pending' as const
    }

    // Add to job's additional charges array
    const existingCharges = (job.additionalCharges as typeof additionalCharge[] | undefined) || []
    const updatedCharges = [...existingCharges, additionalCharge]
    
    // Update history
    const history = (job.history as Array<{ action: string; timestamp: string; by?: string; data?: Record<string, unknown> }>) || []
    history.push({
      action: 'additional_charge_added',
      timestamp: new Date().toISOString(),
      by: addedBy,
      data: { amount: amountInCents, reason }
    })

    // Save updated job
    await kv.hset(`job:${job.bookingId}`, {
      ...job,
      additionalCharges: JSON.stringify(updatedCharges),
      updatedAt: new Date().toISOString(),
      history: JSON.stringify(history)
    })

    let paymentLink = null
    let paymentIntentId = null

    // If sendPaymentLink is true and Stripe is configured, create payment link
    if (sendPaymentLink && STRIPE_SECRET_KEY && job.customerEmail) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

        // Create a PaymentIntent for the additional charge
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: 'nzd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            bookingId: bookingId,
            type: 'additional_charge',
            reason: reason,
            originalBookingId: bookingId,
            customerName: job.customerName as string || '',
            customerPhone: job.customerPhone as string || '',
            vehicleRego: job.rego as string || ''
          },
          description: `Eek Mechanical - Additional Charge - ${reason} - ${bookingId}`,
          receipt_email: job.customerEmail as string,
        })

        paymentIntentId = paymentIntent.id
        // Create payment link using the pay page
        paymentLink = `https://www.eek.co.nz/pay/${bookingId}?additional=${amountInCents}&reason=${encodeURIComponent(reason)}&pi=${paymentIntent.id}`

        // Send notification to customer
        await sendAdditionalChargeNotification(job, amountInCents, reason, paymentLink)

        console.log('✅ Additional charge PaymentIntent created:', paymentIntent.id)
      } catch (stripeError) {
        console.error('Stripe error creating additional charge:', stripeError)
        // Don't fail the whole request, just note the error
      }
    }

    // Send internal notification
    sendInternalNotification({
      type: 'additional_charge',
      bookingId,
      customerName: job.customerName as string,
      customerPhone: job.customerPhone as string,
      customerEmail: job.customerEmail as string,
      price: amountInCents,
      pickupLocation: job.pickupLocation as string,
      vehicleRego: job.rego as string
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      message: 'Additional charge added',
      charge: additionalCharge,
      paymentLink,
      paymentIntentId
    })

  } catch (error) {
    console.error('Additional charge error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to add additional charge'
    }, { status: 500 })
  }
}

// Send additional charge notification to customer via email
async function sendAdditionalChargeNotification(
  job: Record<string, unknown>,
  amountInCents: number,
  reason: string,
  paymentLink: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'
  
  try {
    await fetch(`${baseUrl}/api/send-booking-link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: job.customerPhone,
        email: job.customerEmail,
        customerName: job.customerName || 'Customer',
        link: paymentLink,
        price: `$${(amountInCents / 100).toFixed(2)}`,
        eta: 'Additional Charge',
        method: 'both',
        pickupLocation: job.pickupLocation,
        dropoffLocation: job.dropoffLocation,
        vehicleRego: job.rego,
        isComms: true,
        commsTarget: 'customer',
        messageContent: `ADDITIONAL CHARGE: $${(amountInCents / 100).toFixed(2)} - ${reason}\n\nPlease pay at: ${paymentLink}\n\nIf you have questions, reply to this message or call 0800 769 000.`
      })
    })
  } catch (e) {
    console.error('Failed to send additional charge notification:', e)
  }
}

// GET endpoint to check pending additional charges for a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json({
        success: false,
        error: 'bookingId is required'
      }, { status: 400 })
    }

    // Find the job
    let job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null

    if (!job) {
      const allJobKeys = await kv.lrange('jobs:list', 0, 200) as string[]
      for (const key of allJobKeys) {
        const candidate = await kv.hgetall(`job:${key}`) as Record<string, unknown> | null
        if (candidate && candidate.bookingId === bookingId) {
          job = candidate
          break
        }
      }
    }

    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }

    // Parse additional charges
    let additionalCharges: Array<{ amount: number; reason: string; status: string }> = []
    if (job.additionalCharges) {
      try {
        additionalCharges = typeof job.additionalCharges === 'string' 
          ? JSON.parse(job.additionalCharges) 
          : job.additionalCharges as typeof additionalCharges
      } catch {
        additionalCharges = []
      }
    }

    const originalPrice = (job.price as number) || 0
    const totalAdditional = additionalCharges
      .filter(c => c.status === 'paid')
      .reduce((sum, c) => sum + c.amount, 0)
    const pendingAdditional = additionalCharges
      .filter(c => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0)

    return NextResponse.json({
      success: true,
      originalPrice,
      additionalCharges,
      totalAdditional,
      pendingAdditional,
      totalPaid: originalPrice + totalAdditional
    })

  } catch (error) {
    console.error('Get additional charges error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get additional charges'
    }, { status: 500 })
  }
}
