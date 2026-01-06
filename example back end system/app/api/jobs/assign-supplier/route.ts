import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { JobRecord } from '../[rego]/route'
import { sendSupplierNotificationByName } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const { rego, bookingId, supplierName, supplierPhone, supplierMobile, supplierEmail, supplierPrice, notes, updatedData, sendingNotification } = await request.json()
    
    if (!supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Supplier name is required'
      }, { status: 400 })
    }
    
    // Find job - scan jobs:list to find matching rego or bookingId
    // Jobs can be keyed by either rego or bookingId depending on how they were created
    let job: JobRecord | null = null
    let jobKey = ''
    
    // Get all job IDs from the list
    const jobIds = await kv.lrange('jobs:list', 0, -1) as string[]
    
    for (const id of jobIds) {
      const j = await kv.hgetall(`job:${id}`) as JobRecord | null
      if (j) {
        // Match by bookingId or rego
        const matches = (bookingId && j.bookingId === bookingId) || 
                       (rego && j.rego?.toUpperCase() === rego.toUpperCase())
        if (matches) {
          job = j
          jobKey = `job:${id}`
          break
        }
      }
    }
    
    if (!job || !jobKey) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    // Add history entry
    const history = job.history || []
    const previousSupplier = job.supplierName
    history.push({
      action: previousSupplier ? 'supplier_reassigned' : 'supplier_assigned',
      timestamp: new Date().toISOString(),
      by: 'admin',
      data: { 
        supplierName, 
        supplierPrice, 
        notes,
        previousSupplier: previousSupplier || null
      }
    })
    
    // Update job with supplier info and any updated data
    // If sending notification, status is 'awaiting_supplier' until they accept
    // If not sending notification (direct assignment), status is 'assigned'
    const newStatus = sendingNotification ? 'awaiting_supplier' : 'assigned'
    
    const updated: JobRecord = {
      ...job,
      supplierName,
      supplierPhone: supplierPhone || job.supplierPhone,
      supplierMobile: supplierMobile || job.supplierMobile,
      supplierEmail: supplierEmail || job.supplierEmail,
      supplierPrice: supplierPrice || job.supplierPrice || 0,
      supplierNotes: notes || job.supplierNotes || '',
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history,
      // Apply any updated data (customer, vehicle, locations)
      ...(updatedData?.customerName && { customerName: updatedData.customerName }),
      ...(updatedData?.customerPhone && { customerPhone: updatedData.customerPhone }),
      ...(updatedData?.customerEmail && { customerEmail: updatedData.customerEmail }),
      ...(updatedData?.pickupLocation && { pickupLocation: updatedData.pickupLocation }),
      ...(updatedData?.dropoffLocation && { dropoffLocation: updatedData.dropoffLocation }),
      ...(updatedData?.vehicleMake && { vehicleMake: updatedData.vehicleMake }),
      ...(updatedData?.vehicleModel && { vehicleModel: updatedData.vehicleModel }),
      ...(updatedData?.vehicleColor && { vehicleColor: updatedData.vehicleColor }),
    }
    
    await kv.hset(jobKey, updated)
    
    // Also link supplier to this job
    await kv.lpush(`supplier:${supplierName}:jobs`, job.rego || bookingId)
    
    // Send push notification to supplier
    try {
      await sendSupplierNotificationByName(supplierName, {
        title: '🚗 New Job Assigned',
        body: `You've been assigned a job: ${job.rego} - ${job.pickupLocation?.split(',')[0] || 'Pickup'}`,
        jobId: job.bookingId || job.rego,
        tab: 'timeline',
        tag: `job-${job.rego}`
      })
    } catch (e) {
      // Don't fail the assignment if notification fails
      console.error('Failed to send push notification:', e)
    }
    
    return NextResponse.json({
      success: true,
      job: updated
    })
  } catch (error) {
    console.error('Assign supplier error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to assign supplier'
    }, { status: 500 })
  }
}
