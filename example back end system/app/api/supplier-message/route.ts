import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'
import { sendAdminNotification, AdminNotifications } from '@/lib/admin-notifications'

export async function POST(request: NextRequest) {
  try {
    const { rego, bookingId, supplierName, message } = await request.json()
    
    // Use bookingId as primary identifier, fall back to rego
    const jobRef = bookingId || rego
    
    if (!jobRef || !supplierName || !message) {
      return NextResponse.json({
        success: false,
        error: 'Job reference, supplier name, and message are required'
      }, { status: 400 })
    }
    
    // Store in messages list using bookingId
    await kv.lpush(`messages:${jobRef}`, JSON.stringify({
      from: `supplier:${supplierName}`,
      message,
      timestamp: new Date().toISOString()
    }))
    
    console.log(`Supplier message saved to messages:${jobRef}`)
    
    // Find and update job history - use bookingId as primary key
    let job = await kv.hgetall(`job:${bookingId}`) as Record<string, unknown> | null
    let jobKey = `job:${bookingId}`
    
    // If not found by bookingId, search jobs list (legacy support)
    if (!job) {
      const jobsList = await kv.lrange('jobs:list', 0, 100) as string[]
      for (const id of jobsList) {
        const j = await kv.hgetall(`job:${id}`) as Record<string, unknown> | null
        if (j && (j.bookingId === bookingId || j.rego === rego?.toUpperCase())) {
          job = j
          jobKey = `job:${id}`
          break
        }
      }
    }
    
    if (job) {
      const history = (job.history as Array<Record<string, unknown>>) || []
      history.push({
        action: 'supplier_message',
        timestamp: new Date().toISOString(),
        by: `supplier:${supplierName}`,
        data: { message }
      })
      
      await kv.hset(jobKey, {
        ...job,
        history,
        updatedAt: new Date().toISOString()
      })
    }
    
    // Send internal notification to Eek Mechanical
    await sendInternalNotification({
      type: 'supplier_message',
      bookingId: jobRef,
      rego: rego?.toUpperCase(),
      supplierName,
      message,
      timestamp: new Date().toISOString()
    })
    
    // Send push notification to admins
    try {
      await sendAdminNotification(
        AdminNotifications.newSupplierMessage(
          rego?.toUpperCase() || jobRef,
          supplierName,
          message.substring(0, 40) + (message.length > 40 ? '...' : '')
        )
      )
    } catch (e) {
      console.error('Failed to send admin notification:', e)
    }
    
    return NextResponse.json({ success: true, jobRef })
  } catch (error) {
    console.error('Supplier message error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send message'
    }, { status: 500 })
  }
}
