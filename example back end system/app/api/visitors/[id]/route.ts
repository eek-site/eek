import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { VisitorSession } from '@/lib/visitor-tracking'

// GET - Get specific visitor session
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const visitor = await kv.hgetall(`visitor:${id}`) as VisitorSession | null
    
    if (!visitor) {
      return NextResponse.json({
        success: false,
        error: 'Visitor not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      visitor
    })
    
  } catch (error) {
    console.error('Visitor fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get visitor'
    }, { status: 500 })
  }
}

// PATCH - Update visitor (mark as observed, add notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await request.json()
    
    const visitor = await kv.hgetall(`visitor:${id}`) as VisitorSession | null
    
    if (!visitor) {
      return NextResponse.json({
        success: false,
        error: 'Visitor not found'
      }, { status: 404 })
    }
    
    // Update allowed fields
    if (data.observed) {
      visitor.observed = {
        by: data.observed.by,
        at: new Date().toISOString()
      }
    }
    
    if (data.converted) {
      visitor.converted = {
        type: data.converted.type,
        bookingId: data.converted.bookingId,
        timestamp: new Date().toISOString()
      }
    }
    
    visitor.updatedAt = new Date().toISOString()
    
    await kv.hset(`visitor:${id}`, visitor)
    
    return NextResponse.json({
      success: true,
      visitor
    })
    
  } catch (error) {
    console.error('Visitor update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update visitor'
    }, { status: 500 })
  }
}

// DELETE - Remove visitor (admin cleanup)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Remove from KV
    await kv.del(`visitor:${id}`)
    
    // Remove from sorted set
    await kv.zrem('visitors:list', id)
    
    return NextResponse.json({
      success: true
    })
    
  } catch (error) {
    console.error('Visitor delete error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete visitor'
    }, { status: 500 })
  }
}
