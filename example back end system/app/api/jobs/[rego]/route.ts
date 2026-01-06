import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Job data stored by bookingId (primary key)
// Route param is called "rego" but accepts both rego and bookingId
export interface JobRecord {
  rego: string
  bookingId: string // Primary key - unique identifier
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  pickupCoords?: { lat: number; lng: number }
  dropoffLocation: string
  dropoffCoords?: { lat: number; lng: number }
  price: number // in cents - original quoted price
  eta?: string
  issueType?: string
  description?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  // Additional charges
  additionalCharges?: Array<{
    amount: number // in cents
    reason: string
    addedAt: string
    addedBy: string
    transactionId?: string // Stripe transaction ID if paid
    status: 'pending' | 'paid' | 'cancelled'
  }>
  totalPaid?: number // in cents - sum of all payments received
  // Supplier = towing company (start location in booking)
  supplierName?: string
  supplierAddress?: string
  supplierCoords?: { lat: number; lng: number }
  supplierPhone?: string
  supplierPhoneLandline?: boolean
  supplierMobile?: string
  supplierEmail?: string
  supplierPrice?: number
  supplierNotes?: string
  status: 'pending' | 'booked' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  expiresAt?: string
  createdBy?: string
  history: Array<{
    action: string
    timestamp: string
    by?: string
    data?: Record<string, unknown>
  }>
  // Index signature for Vercel KV compatibility
  [key: string]: unknown
}

export async function GET(
  request: NextRequest,
  { params }: { params: { rego: string } }
) {
  try {
    const id = params.rego // Can be bookingId (HT-xxx) or rego
    
    // Try direct lookup by bookingId first
    let job = await kv.hgetall(`job:${id}`) as JobRecord | null
    
    // If not found, try as rego (get most recent job for this rego)
    if (!job) {
      const rego = id.toUpperCase()
      const jobIds = await kv.lrange(`rego:${rego}:jobs`, 0, 0) as string[]
      if (jobIds.length > 0) {
        job = await kv.hgetall(`job:${jobIds[0]}`) as JobRecord | null
      }
    }
    
    // If still not found and looks like a bookingId, search through jobs:list
    if (!job && id.startsWith('HT-')) {
      const allJobKeys = await kv.lrange('jobs:list', 0, 200) as string[]
      for (const key of allJobKeys) {
        const candidate = await kv.hgetall(`job:${key}`) as JobRecord | null
        if (candidate && candidate.bookingId === id) {
          job = candidate
          break
        }
      }
    }
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      job
    })
  } catch (error) {
    console.error('Job lookup error:', error)
    
    // Demo mode if KV not configured
    if (String(error).includes('KV')) {
      return NextResponse.json({
        success: false,
        error: 'Database not configured'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to lookup job'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { rego: string } }
) {
  try {
    const id = params.rego // Can be bookingId (HT-xxx) or rego
    const updates = await request.json()
    
    // Try direct lookup by bookingId first
    let existing = await kv.hgetall(`job:${id}`) as JobRecord | null
    let jobKey = `job:${id}`
    
    // If not found, try as rego
    if (!existing) {
      const rego = id.toUpperCase()
      const jobIds = await kv.lrange(`rego:${rego}:jobs`, 0, 0) as string[]
      if (jobIds.length > 0) {
        existing = await kv.hgetall(`job:${jobIds[0]}`) as JobRecord | null
        jobKey = `job:${jobIds[0]}`
      }
    }
    
    // If still not found and looks like a bookingId, search through jobs:list
    if (!existing && id.startsWith('HT-')) {
      const allJobKeys = await kv.lrange('jobs:list', 0, 200) as string[]
      for (const key of allJobKeys) {
        const candidate = await kv.hgetall(`job:${key}`) as JobRecord | null
        if (candidate && candidate.bookingId === id) {
          existing = candidate
          jobKey = `job:${key}`
          break
        }
      }
    }
    
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    // Check if status is changing to completed
    const isBecomingCompleted = updates.status === 'completed' && existing.status !== 'completed'
    
    // Add history entry
    const history = existing.history || []
    history.push({
      action: updates.status === 'completed' ? 'completed' : 'updated',
      timestamp: new Date().toISOString(),
      by: updates._updatedBy || 'system',
      data: updates
    })
    
    // Remove internal fields
    delete updates._updatedBy
    
    // Merge updates
    const updated: JobRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
      history
    }
    
    await kv.hset(jobKey, updated)
    
    // If job just completed and no supplier invoice submitted, send buyer-created invoice
    if (isBecomingCompleted && updated.supplierName && !updated.supplierInvoiceRef) {
      // Fire and forget - don't block the response
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/api/send-supplier-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: updated.bookingId,
          rego: updated.rego
        })
      }).catch(err => console.error('Failed to trigger buyer invoice:', err))
    }
    
    return NextResponse.json({
      success: true,
      job: updated
    })
  } catch (error) {
    console.error('Job update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update job'
    }, { status: 500 })
  }
}
