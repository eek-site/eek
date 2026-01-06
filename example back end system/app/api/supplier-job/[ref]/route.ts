import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { SupplierJobRecord } from '../route'

// GET - Fetch supplier job by ref
export async function GET(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const ref = params.ref
    
    // First try supplier-job: (manually created via admin)
    let supplierJob = await kv.hgetall(`supplier-job:${ref}`) as SupplierJobRecord | null
    
    // If not found, try supplier-link: (auto-created from confirm-booking)
    if (!supplierJob) {
      const supplierLink = await kv.hgetall(`supplier-link:${ref}`) as Record<string, unknown> | null
      
      if (supplierLink) {
        // Convert supplier-link format to supplier-job format
        supplierJob = {
          ref: String(supplierLink.code || ref),
          rego: String(supplierLink.rego || ''),
          supplierName: String(supplierLink.supplierName || ''),
          supplierPhone: String(supplierLink.supplierPhone || supplierLink.supplierMobile || ''),
          supplierEmail: String(supplierLink.supplierEmail || ''),
          pickup: String(supplierLink.pickup || ''),
          dropoff: String(supplierLink.dropoff || ''),
          price: Number(supplierLink.price) || 0,
          customerName: String(supplierLink.customerName || ''),
          customerPhone: String(supplierLink.customerPhone || ''),
          notes: '',
          status: (supplierLink.status as SupplierJobRecord['status']) || 'pending',
          createdAt: String(supplierLink.createdAt || new Date().toISOString()),
          bookingId: String(supplierLink.bookingId || '')
        }
      }
    }
    
    if (!supplierJob) {
      return NextResponse.json({
        success: false,
        error: 'Supplier job not found'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      supplierJob
    })
  } catch (error) {
    console.error('Supplier job lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to lookup supplier job'
    }, { status: 500 })
  }
}

// PUT - Update supplier job (e.g. accept, add bank details, upload invoice)
export async function PUT(
  request: NextRequest,
  { params }: { params: { ref: string } }
) {
  try {
    const ref = params.ref
    const updates = await request.json()
    
    // Check which key exists: supplier-job or supplier-link
    let existing = await kv.hgetall(`supplier-job:${ref}`) as SupplierJobRecord | null
    let keyToUpdate = `supplier-job:${ref}`
    
    // If not in supplier-job, try supplier-link
    if (!existing) {
      const supplierLink = await kv.hgetall(`supplier-link:${ref}`) as Record<string, unknown> | null
      if (supplierLink) {
        keyToUpdate = `supplier-link:${ref}`
        // Convert to SupplierJobRecord format for consistency
        existing = {
          ref: String(supplierLink.code || ref),
          rego: String(supplierLink.rego || ''),
          supplierName: String(supplierLink.supplierName || ''),
          supplierPhone: String(supplierLink.supplierPhone || supplierLink.supplierMobile || ''),
          supplierEmail: String(supplierLink.supplierEmail || ''),
          pickup: String(supplierLink.pickup || ''),
          dropoff: String(supplierLink.dropoff || ''),
          price: Number(supplierLink.price) || 0,
          customerName: String(supplierLink.customerName || ''),
          notes: '',
          status: (supplierLink.status as SupplierJobRecord['status']) || 'pending',
          createdAt: String(supplierLink.createdAt || new Date().toISOString())
        }
      }
    }
    
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Supplier job not found'
      }, { status: 404 })
    }
    
    const updated: SupplierJobRecord = {
      ...existing,
      ...updates
    }
    
    // Set timestamps based on status changes
    if (updates.status === 'accepted' && !existing.acceptedAt) {
      updated.acceptedAt = new Date().toISOString()
    }
    if (updates.status === 'completed' && !existing.completedAt) {
      updated.completedAt = new Date().toISOString()
    }
    
    await kv.hset(keyToUpdate, updated)
    
    return NextResponse.json({
      success: true,
      supplierJob: updated
    })
  } catch (error) {
    console.error('Supplier job update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update supplier job'
    }, { status: 500 })
  }
}
