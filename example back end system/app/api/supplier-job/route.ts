import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Supplier job data stored by short ref (e.g. SJ-ABCD1234)
export interface SupplierJobRecord {
  ref: string
  rego: string
  supplierName: string
  supplierPhone?: string
  supplierEmail?: string
  pickup: string
  dropoff?: string
  price: number // in cents (what we pay supplier)
  customerName?: string
  notes?: string
  status: 'pending' | 'accepted' | 'rejected' | 'completed'
  createdAt: string
  createdBy?: string
  acceptedAt?: string
  completedAt?: string
  bankAccount?: string
  invoiceUrl?: string
  // Index signature for Vercel KV compatibility
  [key: string]: unknown
}

// POST - Create new supplier job
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.ref) {
      return NextResponse.json({
        success: false,
        error: 'Reference is required'
      }, { status: 400 })
    }
    
    const ref = data.ref
    const key = `supplier-job:${ref}`
    
    // Create supplier job record
    const supplierJob: SupplierJobRecord = {
      ref,
      rego: data.rego || '',
      supplierName: data.supplierName || '',
      supplierPhone: data.supplierPhone || '',
      supplierEmail: data.supplierEmail || '',
      pickup: data.pickup || '',
      dropoff: data.dropoff || '',
      price: data.price || 0,
      customerName: data.customerName || '',
      notes: data.notes || '',
      status: 'pending',
      createdAt: data.createdAt || new Date().toISOString(),
      createdBy: data.createdBy
    }
    
    await kv.hset(key, supplierJob)
    
    // Index by rego for lookup
    if (data.rego) {
      await kv.sadd(`supplier-jobs:${data.rego.toUpperCase()}`, ref)
    }
    
    return NextResponse.json({
      success: true,
      supplierJob
    })
  } catch (error) {
    console.error('Supplier job creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save supplier job'
    }, { status: 500 })
  }
}
