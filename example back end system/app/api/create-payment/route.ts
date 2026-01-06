import { NextRequest, NextResponse } from 'next/server'
import { sendInternalNotification } from '@/lib/internal-notifications'

/**
 * Create a Stripe PaymentIntent for inline payment collection
 */

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || ''

interface PaymentRequest {
  bookingId: string
  amount: number  // in cents
  customerName: string
  customerPhone: string
  customerEmail?: string
  vehicleRego?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  vehicleVin?: string
  vehicleFuel?: string
  vehicleCc?: string
  vehicleTransmission?: string
  vehicleBody?: string
  vehicleSeats?: string
  vehicleWofExpiry?: string
  vehicleRegoExpiry?: string
  issueType?: string
  pickupLocation: string
  dropoffLocation?: string
  eta?: string
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentRequest = await request.json()
    
    const { 
      bookingId, 
      amount, 
      customerName, 
      customerPhone, 
      customerEmail,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleYear,
      vehicleVin,
      vehicleFuel,
      vehicleCc,
      vehicleTransmission,
      vehicleBody,
      vehicleSeats,
      vehicleWofExpiry,
      vehicleRegoExpiry,
      issueType,
      pickupLocation,
      dropoffLocation,
      eta
    } = body

    // Validate required fields
    if (!bookingId || !amount || !customerName || !customerPhone || !pickupLocation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log the booking
    console.log('PAYMENT INTENT REQUEST:', {
      bookingId,
      amount: amount / 100,
      customerName,
      customerPhone,
      pickupLocation,
      issueType
    })

    // Send internal notification - payment started
    sendInternalNotification({
      type: 'payment_started',
      bookingId,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropoffLocation,
      price: amount,
      eta,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColour: vehicleColor,
      vehicleYear,
      vehicleVin,
      vehicleFuel,
      vehicleCc,
      vehicleTransmission,
      vehicleBody,
      vehicleSeats,
      vehicleWofExpiry,
      vehicleRegoExpiry
    }).catch(() => {})

    // If Stripe is configured, create a real PaymentIntent
    if (STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

        // Build metadata - include all vehicle data
        const metadata: Record<string, string> = {
          bookingId,
          customerName,
          customerPhone,
          pickupLocation,
          eta: eta || '30 mins'
        }

        if (customerEmail) metadata.customerEmail = customerEmail
        if (vehicleRego) metadata.vehicleRego = vehicleRego
        if (vehicleMake) metadata.vehicleMake = vehicleMake
        if (vehicleModel) metadata.vehicleModel = vehicleModel
        if (vehicleColor) metadata.vehicleColor = vehicleColor
        if (vehicleYear) metadata.vehicleYear = vehicleYear
        if (vehicleVin) metadata.vehicleVin = vehicleVin
        if (vehicleFuel) metadata.vehicleFuel = vehicleFuel
        if (vehicleCc) metadata.vehicleCc = vehicleCc
        if (vehicleTransmission) metadata.vehicleTransmission = vehicleTransmission
        if (vehicleBody) metadata.vehicleBody = vehicleBody
        if (issueType) metadata.issueType = issueType
        if (dropoffLocation) metadata.dropoffLocation = dropoffLocation

        // Create PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'nzd',
          automatic_payment_methods: {
            enabled: true,
          },
          metadata,
          description: `Eek Mechanical - ${issueType || 'Towing'} - ${bookingId}`,
          receipt_email: customerEmail || undefined,
        })

        console.log('✅ PaymentIntent created:', paymentIntent.id)

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        })

      } catch (stripeError) {
        console.error('Stripe error:', stripeError)
        return NextResponse.json(
          { error: 'Payment processing failed. Please call us directly.' },
          { status: 500 }
        )
      }
    }

    // Demo mode - return mock client secret
    console.log('🎭 DEMO MODE: Returning mock payment intent')
    
    return NextResponse.json({
      success: true,
      clientSecret: 'demo_secret_' + Date.now(),
      paymentIntentId: 'demo_pi_' + Date.now(),
      isDemo: true
    })

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: 'Payment failed. Please call us at 0800 769 000.' },
      { status: 500 }
    )
  }
}
