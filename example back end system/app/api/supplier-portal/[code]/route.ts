import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { SupplierRecord } from '../../suppliers/route'

interface Message {
  from: string
  message: string
  timestamp: string
}

interface HistoryEvent {
  action: string
  timestamp: string
  by?: string
  data?: Record<string, unknown>
}

interface JobData {
  rego: string
  bookingId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  price?: number
  supplierPrice?: number
  status: string
  createdAt: string
  messages?: Message[]
  history?: HistoryEvent[]
}

// GET supplier by portal code with all their jobs
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const portalCode = params.code
    
    // Look up supplier name by portal code
    const supplierName = await kv.get(`supplier:portal:${portalCode}`) as string | null
    
    if (!supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid portal code'
      }, { status: 404 })
    }
    
    // Get supplier details
    const supplier = await kv.hgetall(`supplier:${supplierName}`) as SupplierRecord | null
    
    if (!supplier) {
      return NextResponse.json({
        success: false,
        error: 'Supplier not found'
      }, { status: 404 })
    }
    
    // Get all jobs assigned to this supplier (jobs:list contains bookingIds)
    const allJobIds = await kv.lrange('jobs:list', 0, 200) as string[]
    const supplierJobs: JobData[] = []
    
    for (const jobId of allJobIds) {
      // Lookup by job ID (bookingId is the primary key)
      const job = await kv.hgetall(`job:${jobId}`) as Record<string, unknown> | null
      
      if (job && job.supplierName === supplierName) {
        // Get messages for this job (use bookingId as primary key)
        const jobRef = (job.bookingId as string) || jobId
        const rawMessages = await kv.lrange(`messages:${jobRef}`, 0, 100) as unknown[]
        // Handle both string and object formats (KV may auto-parse JSON)
        const messages = rawMessages.map(msg => {
          if (typeof msg === 'object' && msg !== null) return msg
          if (typeof msg === 'string') {
            try { return JSON.parse(msg) } catch { return null }
          }
          return null
        }).filter(Boolean).reverse() // Oldest first
        
        // Parse history if available
        let history: HistoryEvent[] = []
        if (job.history) {
          if (typeof job.history === 'string') {
            try { history = JSON.parse(job.history) } catch { /* ignore */ }
          } else if (Array.isArray(job.history)) {
            history = job.history as HistoryEvent[]
          }
        }
        
        supplierJobs.push({
          rego: job.rego as string || '',
          bookingId: job.bookingId as string,
          customerName: job.customerName as string,
          customerPhone: job.customerPhone as string,
          customerEmail: job.customerEmail as string,
          pickupLocation: job.pickupLocation as string,
          dropoffLocation: job.dropoffLocation as string,
          price: job.price as number,
          supplierPrice: job.supplierPrice as number,
          status: job.status as string || 'pending',
          createdAt: job.createdAt as string,
          messages,
          history
        })
      }
    }
    
    // Sort by most recent activity
    supplierJobs.sort((a, b) => {
      const aTime = a.messages?.[a.messages.length - 1]?.timestamp || a.createdAt
      const bTime = b.messages?.[b.messages.length - 1]?.timestamp || b.createdAt
      return bTime.localeCompare(aTime)
    })
    
    // Separate open and closed jobs
    const openJobs = supplierJobs.filter(j => !['closed', 'cancelled', 'completed'].includes(j.status))
    const closedJobs = supplierJobs.filter(j => ['closed', 'cancelled', 'completed'].includes(j.status))
    
    return NextResponse.json({
      success: true,
      supplier: {
        name: supplier.name,
        legalName: supplier.legalName,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        city: supplier.city,
        postcode: supplier.postcode,
        bankName: supplier.bankName,
        bankAccount: supplier.bankAccount,
        bankAccountName: supplier.bankAccountName,
        gstNumber: supplier.gstNumber
      },
      openJobs,
      closedJobs,
      totalJobs: supplierJobs.length
    })
  } catch (error) {
    console.error('Supplier portal error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load supplier portal'
    }, { status: 500 })
  }
}

// POST message from supplier
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const portalCode = params.code
    const { rego, bookingId, message } = await request.json()
    
    // Use bookingId as primary key, fall back to rego
    const jobRef = bookingId || rego
    
    if (!jobRef || !message) {
      return NextResponse.json({
        success: false,
        error: 'Job reference and message are required'
      }, { status: 400 })
    }
    
    // Verify portal code
    const supplierName = await kv.get(`supplier:portal:${portalCode}`) as string | null
    
    if (!supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid portal code'
      }, { status: 404 })
    }
    
    // Store message using bookingId
    await kv.lpush(`messages:${jobRef}`, JSON.stringify({
      from: `supplier:${supplierName}`,
      message,
      timestamp: new Date().toISOString()
    }))
    
    // Send internal notification
    try {
      const { sendInternalNotification } = await import('@/lib/internal-notifications')
      await sendInternalNotification({
        type: 'supplier_message',
        rego,
        supplierName,
        message,
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      console.error('Notification error:', e)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supplier message error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send message'
    }, { status: 500 })
  }
}

// PATCH - Update supplier profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const portalCode = params.code
    const updates = await request.json()
    
    // Verify portal code and get supplier name
    const supplierName = await kv.get(`supplier:portal:${portalCode}`) as string | null
    
    if (!supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid portal code'
      }, { status: 404 })
    }
    
    // Get current supplier data
    const supplier = await kv.hgetall(`supplier:${supplierName}`) as Record<string, unknown> | null
    
    if (!supplier) {
      return NextResponse.json({
        success: false,
        error: 'Supplier not found'
      }, { status: 404 })
    }
    
    // Allowed fields that suppliers can update themselves
    const allowedFields = [
      'legalName', 'email', 'phone', 'address', 'city', 'postcode',
      'bankName', 'bankAccount', 'bankAccountName', 'gstNumber'
    ]
    
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    }
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field]
      }
    }
    
    await kv.hset(`supplier:${supplierName}`, updateData)
    
    return NextResponse.json({ 
      success: true,
      message: 'Profile updated'
    })
  } catch (error) {
    console.error('Supplier profile update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update profile'
    }, { status: 500 })
  }
}

// PUT - Submit invoice from supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const portalCode = params.code
    const { bookingId, rego, invoiceRef, invoiceAmount, xeroLink } = await request.json()
    
    const jobRef = bookingId || rego
    
    if (!jobRef || !invoiceRef) {
      return NextResponse.json({
        success: false,
        error: 'Job reference and invoice reference are required'
      }, { status: 400 })
    }
    
    // Verify portal code
    const supplierName = await kv.get(`supplier:portal:${portalCode}`) as string | null
    
    if (!supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid portal code'
      }, { status: 404 })
    }
    
    // Get the job and verify it belongs to this supplier
    const job = await kv.hgetall(`job:${jobRef}`) as Record<string, unknown> | null
    
    if (!job) {
      return NextResponse.json({
        success: false,
        error: 'Job not found'
      }, { status: 404 })
    }
    
    if (job.supplierName !== supplierName) {
      return NextResponse.json({
        success: false,
        error: 'Job does not belong to this supplier'
      }, { status: 403 })
    }
    
    // Update job with invoice data
    await kv.hset(`job:${jobRef}`, {
      supplierInvoiceRef: invoiceRef,
      supplierInvoiceAmount: invoiceAmount,
      supplierXeroLink: xeroLink || '',
      supplierInvoiceSubmittedAt: new Date().toISOString()
    })
    
    // Send internal notification
    try {
      const { sendInternalNotification } = await import('@/lib/internal-notifications')
      await sendInternalNotification({
        type: 'supplier_invoice',
        rego,
        bookingId,
        supplierName,
        invoiceRef,
        invoiceAmount,
        timestamp: new Date().toISOString()
      })
    } catch (e) {
      console.error('Notification error:', e)
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Supplier invoice error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to submit invoice'
    }, { status: 500 })
  }
}
