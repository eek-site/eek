import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      customerName, 
      customerPhone, 
      customerEmail,
      pickupLocation, 
      dropoffLocation,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      issueType,
      description,
      submittedBy // from admin form
    } = body

    // Validate required fields
    if (!customerPhone || !pickupLocation) {
      return NextResponse.json(
        { error: 'Phone and pickup location are required' },
        { status: 400 }
      )
    }

    // Generate a booking ID
    const bookingId = `HT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Prepare booking data
    const bookingData = {
      bookingId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      source: submittedBy ? 'admin' : 'website',
      submittedBy: submittedBy || 'website',
      customer: {
        name: customerName || 'Unknown',
        phone: customerPhone,
        email: customerEmail || null
      },
      location: {
        pickup: pickupLocation,
        dropoff: dropoffLocation || null
      },
      vehicle: {
        rego: vehicleRego || null,
        make: vehicleMake || null,
        model: vehicleModel || null,
        color: vehicleColor || null
      },
      job: {
        issueType: issueType || 'Other',
        description: description || null,
        priority: 'Normal'
      }
    }

    // Log for debugging (shows in Vercel logs)
    console.log('📦 NEW BOOKING REQUEST:', {
      bookingId,
      customerName,
      customerPhone,
      pickupLocation,
      issueType,
      timestamp: bookingData.createdAt,
    })

    // Store in KV for admin to see
    try {
      await kv.lpush('pending_bookings', JSON.stringify(bookingData))
      await kv.ltrim('pending_bookings', 0, 499) // Keep last 500
      console.log('✅ Booking saved to KV:', bookingId)
    } catch (kvError) {
      console.error('KV storage error (non-fatal):', kvError)
      // Continue even if KV fails
    }

    // Return success - admin will follow up with payment link
    return NextResponse.json({ 
      success: true,
      bookingId,
      message: 'Booking received! We will call you shortly to confirm details and send a payment link.'
    })

  } catch (error) {
    console.error('Booking API error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please call us directly at 0800 769 000.' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch pending bookings (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const bookings = await kv.lrange('pending_bookings', 0, limit - 1)
    const parsed = bookings.map(b => JSON.parse(b as string))

    return NextResponse.json({ 
      success: true, 
      bookings: parsed,
      count: parsed.length 
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
