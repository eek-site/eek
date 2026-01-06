import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { JobRecord } from './[rego]/route'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // BookingId is now the primary key (allows multiple jobs per rego)
    if (!data.bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 })
    }
    
    const bookingId = data.bookingId
    const rego = data.rego?.toUpperCase() || ''
    
    // Create new job keyed by bookingId
    const job: JobRecord = {
      rego,
      bookingId,
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      customerEmail: data.customerEmail || '',
      pickupLocation: data.pickupLocation || '',
      pickupCoords: data.pickupCoords,
      dropoffLocation: data.dropoffLocation || '',
      dropoffCoords: data.dropoffCoords,
      // Supplier = towing company (start location in booking)
      supplierName: data.supplierName,
      supplierAddress: data.supplierAddress,
      supplierCoords: data.supplierCoords,
      supplierPhone: data.supplierPhone,
      supplierPhoneLandline: data.supplierPhoneLandline,
      supplierMobile: data.supplierMobile,
      supplierEmail: data.supplierEmail,
      price: data.price || 0,
      eta: data.eta,
      issueType: data.issueType || 'Breakdown',
      description: data.description || '',
      vehicleMake: data.vehicleMake,
      vehicleModel: data.vehicleModel,
      vehicleColor: data.vehicleColor,
      vehicleYear: data.vehicleYear,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h default
      createdBy: data.createdBy,
      history: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        by: data.createdBy || 'system'
      }]
    }
    
    // Store job by bookingId (primary key - allows multiple jobs per rego)
    await kv.hset(`job:${bookingId}`, job)
    
    // Add to jobs list for enumeration (using bookingId now)
    await kv.lpush('jobs:list', bookingId)
    
    // Create rego index for searching by rego (maps to list of bookingIds)
    if (rego) {
      await kv.lpush(`rego:${rego}:jobs`, bookingId)
    }
    
    return NextResponse.json({
      success: true,
      job
    })
  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create job'
    }, { status: 500 })
  }
}

// Get recent jobs list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const rego = searchParams.get('rego')?.toUpperCase()
    
    let jobIds: string[]
    
    if (rego) {
      // Search by rego - get all jobs for this rego
      jobIds = await kv.lrange(`rego:${rego}:jobs`, 0, limit - 1) as string[]
    } else {
      // Get recent jobs list (by bookingId)
      jobIds = await kv.lrange('jobs:list', 0, limit - 1) as string[]
    }
    
    // Get job details for each
    const jobs: JobRecord[] = []
    for (const jobId of jobIds) {
      const job = await kv.hgetall(`job:${jobId}`) as JobRecord | null
      if (job) {
        jobs.push(job)
      }
    }
    
    return NextResponse.json({
      success: true,
      jobs
    })
  } catch (error) {
    console.error('Jobs list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get jobs',
      jobs: []
    }, { status: 500 })
  }
}
