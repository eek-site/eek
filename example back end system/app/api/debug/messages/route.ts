import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Debug endpoint to check messages in KV
// Access: /api/debug/messages?key=HT-XXXXX or /api/debug/messages?key=MZK430
export async function GET(request: NextRequest) {
  try {
    const key = request.nextUrl.searchParams.get('key')
    
    if (!key) {
      // List all message keys we can find
      const jobIds = await kv.lrange('jobs:list', 0, 50) as string[]
      const results: Record<string, number> = {}
      
      for (const jobId of jobIds) {
        const job = await kv.hgetall(`job:${jobId}`) as Record<string, unknown> | null
        if (job) {
          // Check messages by bookingId
          const bookingMsgs = await kv.llen(`messages:${job.bookingId || jobId}`)
          results[`messages:${job.bookingId || jobId}`] = bookingMsgs
          
          // Check messages by rego
          if (job.rego) {
            const regoMsgs = await kv.llen(`messages:${job.rego}`)
            results[`messages:${job.rego}`] = regoMsgs
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        messageCounts: results,
        jobIds
      })
    }
    
    // Get messages for specific key
    const messages = await kv.lrange(`messages:${key}`, 0, 100) as unknown[]
    const parsed = messages.map(m => {
      // If already an object, return as-is
      if (typeof m === 'object' && m !== null) {
        return m
      }
      // If string, try to parse
      if (typeof m === 'string') {
        try {
          return JSON.parse(m)
        } catch {
          return m
        }
      }
      return m
    })
    
    // Debug: show types
    const types = messages.map(m => typeof m)
    
    return NextResponse.json({
      success: true,
      key: `messages:${key}`,
      count: messages.length,
      types: types,
      messages: parsed
    })
  } catch (error) {
    console.error('Debug messages error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}

// Test write
export async function POST(request: NextRequest) {
  try {
    const { key, message } = await request.json()
    
    if (!key || !message) {
      return NextResponse.json({
        success: false,
        error: 'key and message required'
      }, { status: 400 })
    }
    
    const messageData = JSON.stringify({
      from: 'debug_test',
      message,
      timestamp: new Date().toISOString()
    })
    
    await kv.lpush(`messages:${key}`, messageData)
    
    // Verify it was saved
    const count = await kv.llen(`messages:${key}`)
    
    return NextResponse.json({
      success: true,
      key: `messages:${key}`,
      newCount: count
    })
  } catch (error) {
    console.error('Debug write error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
