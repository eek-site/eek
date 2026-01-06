import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export interface BookingRecord {
  rego?: string
  bookingId: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  pickupCoords?: { lat: number; lng: number }
  dropoffLocation?: string
  dropoffCoords?: { lat: number; lng: number }
  // Supplier = towing company (start location)
  supplierName?: string
  supplierAddress?: string
  supplierCoords?: { lat: number; lng: number }
  supplierPhone?: string
  supplierPhoneLandline?: boolean
  supplierMobile?: string
  supplierEmail?: string
  price: number
  eta?: string
  issueType?: string
  description?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  status: string
  createdAt: string
  updatedAt: string
  expiresAt?: string
  createdBy?: string
  history?: Array<{
    action: string
    timestamp: string
    by?: string
  }>
  // Index signature for Vercel KV compatibility
  [key: string]: unknown
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.bookingId) {
      return NextResponse.json({
        success: false,
        error: 'Booking ID is required'
      }, { status: 400 })
    }
    
    const bookingId = data.bookingId
    const rego = data.rego?.toUpperCase() || ''
    
    // Create booking record
    const booking: BookingRecord = {
      rego,
      bookingId,
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      customerEmail: data.customerEmail || '',
      pickupLocation: data.pickupLocation || '',
      pickupCoords: data.pickupCoords,
      dropoffLocation: data.dropoffLocation || '',
      dropoffCoords: data.dropoffCoords,
      // Supplier = towing company (start location)
      supplierName: data.supplierName || '',
      supplierAddress: data.supplierAddress || '',
      supplierCoords: data.supplierCoords,
      supplierPhone: data.supplierPhone || '',
      supplierPhoneLandline: data.supplierPhoneLandline || false,
      supplierMobile: data.supplierMobile || '',
      supplierEmail: data.supplierEmail || '',
      price: data.price || 0,
      eta: data.eta || '30 mins',
      issueType: data.issueType || 'Breakdown',
      description: data.description || '',
      vehicleMake: data.vehicleMake || '',
      vehicleModel: data.vehicleModel || '',
      vehicleColor: data.vehicleColor || '',
      vehicleYear: data.vehicleYear || '',
      status: 'pending',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdBy: data.createdBy || 'system',
      history: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        by: data.createdBy || 'system'
      }]
    }
    
    // Store booking by booking ID (primary key)
    await kv.hset(`booking:${bookingId}`, booking)
    
    // Store job by booking ID with history (allows multiple jobs per rego)
    const jobRecord = {
      ...booking,
      history: [{
        action: 'created',
        timestamp: new Date().toISOString(),
        by: data.createdBy || 'system'
      }]
    }
    await kv.hset(`job:${bookingId}`, jobRecord)
    
    // Add to jobs list for enumeration
    await kv.lpush('jobs:list', bookingId)
    
    // Create rego index for lookups (maps rego -> list of booking IDs)
    if (rego) {
      await kv.lpush(`rego:${rego}:jobs`, bookingId)
    }
    
    return NextResponse.json({
      success: true,
      bookingId,
      booking
    })
  } catch (error) {
    console.error('Booking creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create booking'
    }, { status: 500 })
  }
}
