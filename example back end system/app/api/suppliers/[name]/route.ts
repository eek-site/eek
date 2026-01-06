import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { SupplierRecord } from '../route'

// Sanitize supplier name (must match client-side sanitization)
function sanitizeSupplierName(name: string): string {
  return name
    .replace(/[''`]/g, "'")  // Normalize apostrophes
    .replace(/[^\w\s\-&']/g, '') // Remove special chars
    .trim()
}

// Generate a random portal code
function generatePortalCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const rawName = decodeURIComponent(params.name)
    const name = sanitizeSupplierName(rawName)
    
    let supplier = await kv.hgetall(`supplier:${name}`) as SupplierRecord | null
    
    if (!supplier) {
      return NextResponse.json({
        success: false,
        error: 'Supplier not found'
      }, { status: 404 })
    }
    
    // Generate portal code if doesn't exist
    if (!supplier.portalCode) {
      const portalCode = generatePortalCode()
      supplier = {
        ...supplier,
        portalCode,
        updatedAt: new Date().toISOString()
      }
      await kv.hset(`supplier:${name}`, supplier)
      await kv.set(`supplier:portal:${portalCode}`, name)
    }
    
    // Also get their job list
    const jobs = await kv.lrange(`supplier:${name}:jobs`, 0, -1) as string[]
    
    return NextResponse.json({
      success: true,
      supplier,
      jobRegos: jobs,
      portalUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/portal/${supplier.portalCode}`
    })
  } catch (error) {
    console.error('Supplier lookup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to lookup supplier'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const rawName = decodeURIComponent(params.name)
    const name = sanitizeSupplierName(rawName)
    const updates = await request.json()
    
    const existing = await kv.hgetall(`supplier:${name}`) as SupplierRecord | null
    
    if (!existing) {
      return NextResponse.json({
        success: false,
        error: 'Supplier not found'
      }, { status: 404 })
    }
    
    // Merge updates
    const updated: SupplierRecord = {
      ...existing,
      ...updates,
      name: existing.name, // Don't allow name change
      updatedAt: new Date().toISOString()
    }
    
    await kv.hset(`supplier:${name}`, updated)
    
    return NextResponse.json({
      success: true,
      supplier: updated
    })
  } catch (error) {
    console.error('Supplier update error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update supplier'
    }, { status: 500 })
  }
}
