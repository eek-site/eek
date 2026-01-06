import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { BookingRecord } from '../route'

// GET - Fetch booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    
    // Try direct lookup by job:bookingId first
    let data = await kv.hgetall(`job:${bookingId}`) as BookingRecord | null
    
    // If not found, search jobs:list (jobs can be keyed by rego or bookingId)
    if (!data) {
      const jobIds = await kv.lrange('jobs:list', 0, 200) as string[]
      
      for (const id of jobIds) {
        const job = await kv.hgetall(`job:${id}`) as BookingRecord | null
        if (job && job.bookingId === bookingId) {
          data = job
          break
        }
      }
    }
    
    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      job: data
    })
  } catch (error) {
    console.error('Booking lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to lookup booking'
    }, { status: 500 })
  }
}

// PUT - Update booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id
    const updates = await request.json()
    
    // Get existing booking
    const existing = await kv.hgetall(`booking:${bookingId}`) as BookingRecord | null
    
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Booking not found'
      }, { status: 404 })
    }
    
    // Merge updates
    const updated: BookingRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    await kv.hset(`booking:${bookingId}`, updated)
    
    return NextResponse.json({
      success: true,
      booking: updated
    })
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update booking'
    }, { status: 500 })
  }
}
