import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { name, phone, location, issue } = body

    // Validate required fields
    if (!name || !phone || !location || !issue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Prepare submission data
    const contactData = {
      id: `C-${Date.now().toString(36).toUpperCase()}`,
      type: 'help_request',
      createdAt: new Date().toISOString(),
      status: 'pending',
      name,
      phone,
      location,
      issue
    }

    // Log for debugging (shows in Vercel logs)
    console.log('🚨 NEW HELP REQUEST:', contactData)

    // Store in KV for admin to see
    try {
      await kv.lpush('contact_requests', JSON.stringify(contactData))
      await kv.ltrim('contact_requests', 0, 199) // Keep last 200
      console.log('✅ Contact saved to KV:', contactData.id)
    } catch (kvError) {
      console.error('KV storage error (non-fatal):', kvError)
      // Continue even if KV fails
    }

    return NextResponse.json({ 
      success: true,
      message: 'Request received. We will call you shortly.'
    })

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please call us directly.' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch contact requests (for admin)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const contacts = await kv.lrange('contact_requests', 0, limit - 1)
    const parsed = contacts.map(c => JSON.parse(c as string))

    return NextResponse.json({ 
      success: true, 
      contacts: parsed,
      count: parsed.length 
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}
