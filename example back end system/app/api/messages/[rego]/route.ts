import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// This route handles messages by job reference (bookingId or rego as fallback)
// The [rego] param name is legacy - it's actually the job reference

export async function GET(
  request: NextRequest,
  { params }: { params: { rego: string } }
) {
  try {
    const jobRef = params.rego // Could be bookingId (HT-XXXXX) or rego
    
    console.log(`GET messages for jobRef: "${jobRef}"`)
    
    // Get messages from list using job reference (bookingId)
    // Note: Vercel KV may return objects or strings depending on how data was stored
    // Do NOT fallback to rego - multiple jobs can share same rego
    const rawMessages = await kv.lrange(`messages:${jobRef}`, 0, 100) as unknown[]
    console.log(`Found ${rawMessages.length} raw messages for messages:${jobRef}`)
    
    // Parse messages - handle both string and object formats (KV may auto-parse JSON)
    const messages = rawMessages.map(msg => {
      // If already an object, return as-is
      if (typeof msg === 'object' && msg !== null) {
        return msg
      }
      // If string, try to parse
      if (typeof msg === 'string') {
        try {
          return JSON.parse(msg)
        } catch {
          return null
        }
      }
      return null
    }).filter(Boolean)
    
    return NextResponse.json({
      success: true,
      messages,
      jobRef,
      rawCount: rawMessages.length,
      parsedCount: messages.length
    })
  } catch (error) {
    console.error('Messages fetch error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch messages',
      messages: []
    }, { status: 500 })
  }
}

// Send message from Eek Mechanical to job thread
export async function POST(
  request: NextRequest,
  { params }: { params: { rego: string } }
) {
  const jobRef = params.rego // Could be bookingId (HT-XXXXX) or rego
  
  try {
    const body = await request.json()
    const { message, from } = body
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 })
    }
    
    const messageData = JSON.stringify({
      from: from || 'hook_towing',
      message,
      timestamp: new Date().toISOString()
    })
    
    // Add to messages list using job reference - ONLY save under bookingId
    // Do NOT save under rego - multiple jobs can have same rego (causes duplicates)
    await kv.lpush(`messages:${jobRef}`, messageData)
    console.log(`Message saved to messages:${jobRef}`)
    
    // Return success immediately - don't block on job history update
    // Job history update is nice-to-have but not critical
    updateJobHistoryAsync(jobRef, message, from).catch(e => {
      console.error('Job history update failed (non-critical):', e)
    })
    
    return NextResponse.json({ success: true, jobRef })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Non-blocking job history update
async function updateJobHistoryAsync(jobRef: string, message: string, from?: string) {
  try {
    // Try direct lookup first
    let job = await kv.hgetall(`job:${jobRef}`) as Record<string, unknown> | null
    let jobKey = `job:${jobRef}`
    
    // If not found, try to find by searching (but limit to avoid timeout)
    if (!job) {
      // jobs:list is a list, not a set - use lrange
      const jobsList = await kv.lrange('jobs:list', 0, 50) as string[]
      for (const rego of jobsList) {
        const j = await kv.hgetall(`job:${rego}`) as Record<string, unknown> | null
        if (j && (j.bookingId === jobRef || j.rego === jobRef)) {
          job = j
          jobKey = `job:${rego}`
          break
        }
      }
    }
    
    if (job) {
      const history = (job.history as Array<Record<string, unknown>>) || []
      history.push({
        action: 'hook_message',
        timestamp: new Date().toISOString(),
        by: from || 'hook_towing',
        data: { message }
      })
      
      await kv.hset(jobKey, {
        ...job,
        history,
        updatedAt: new Date().toISOString()
      })
      console.log(`Job history updated for ${jobKey}`)
    }
  } catch (e) {
    console.error('updateJobHistoryAsync error:', e)
  }
}
