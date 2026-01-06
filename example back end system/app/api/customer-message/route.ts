import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'
import { sendSupplierNotificationByName } from '@/lib/notifications'
import { sendAdminNotification, AdminNotifications } from '@/lib/admin-notifications'

export async function POST(request: NextRequest) {
  try {
    const { rego, bookingId, customerName, message } = await request.json()
    
    // Use bookingId as primary identifier, fall back to rego
    const jobRef = bookingId || rego
    
    if (!jobRef || !message) {
      return NextResponse.json({
        success: false,
        error: 'Job reference and message are required'
      }, { status: 400 })
    }
    
    // Store in messages list using bookingId
    await kv.lpush(`messages:${jobRef}`, JSON.stringify({
      from: 'customer',
      name: customerName,
      message,
      timestamp: new Date().toISOString()
    }))
    
    console.log(`Customer message saved to messages:${jobRef}`)
    
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
        action: 'customer_message',
        timestamp: new Date().toISOString(),
        by: `customer:${customerName || 'Customer'}`,
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
      type: 'customer_message',
      bookingId: jobRef,
      rego: rego?.toUpperCase(),
      customerName,
      message,
      timestamp: new Date().toISOString()
    })
    
    // Send push notification to admins
    try {
      await sendAdminNotification(
        AdminNotifications.newCustomerMessage(
          rego?.toUpperCase() || jobRef,
          customerName || 'Customer',
          message.substring(0, 40) + (message.length > 40 ? '...' : '')
        )
      )
    } catch (e) {
      console.error('Failed to send admin notification:', e)
    }
    
    // Send push notification to assigned supplier (only if supplier is assigned and job is active)
    if (job && job.supplierName) {
      const jobStatus = job.status as string
      const activeStatuses = ['assigned', 'in_progress', 'awaiting_supplier']
      
      if (activeStatuses.includes(jobStatus)) {
        try {
          await sendSupplierNotificationByName(job.supplierName as string, {
            title: '💬 New Message',
            body: `${customerName || 'Customer'}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
            jobId: jobRef,
            tab: 'messages',
            tag: `message-${jobRef}`
          })
        } catch (e) {
          console.error('Failed to send push notification to supplier:', e)
        }
      }
    }
    
    return NextResponse.json({ success: true, jobRef })
  } catch (error) {
    console.error('Customer message error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send message'
    }, { status: 500 })
  }
}
