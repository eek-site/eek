import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export interface SupplierRecord {
  name: string // Display/trading name
  legalName?: string // Legal company name for invoicing
  phone?: string
  phoneLandline?: boolean // If true, phone is a landline
  mobile?: string // Mobile number for SMS if phone is landline
  email?: string
  address?: string
  city?: string
  postcode?: string
  coords?: { lat: number; lng: number }
  website?: string
  // Banking details
  bankName?: string // e.g. "ANZ", "Westpac"
  bankAccount?: string // Full NZ bank account number (XX-XXXX-XXXXXXX-XX)
  bankAccountName?: string // Name on the bank account
  // Tax
  gstNumber?: string // NZ GST number
  // Portal
  portalCode?: string // Unique code for supplier portal access
  // Stats
  createdAt: string
  updatedAt: string
  jobCount: number
  totalPaid: number // in cents
  // Index signature for Vercel KV compatibility
  [key: string]: unknown
}

// Generate a random portal code
function generatePortalCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789' // Removed confusing chars
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    if (!data.name) {
      return NextResponse.json({
        success: false,
        error: 'Supplier name is required'
      }, { status: 400 })
    }
    
    // Sanitize supplier name for use as Redis key
    // Replace smart quotes and special chars
    const name = data.name
      .trim()
      .replace(/['']/g, "'")  // Smart quotes to regular
      .replace(/[""]/g, '"')  // Smart double quotes
    
    const key = `supplier:${name}`
    
    // Check if supplier exists
    const existing = await kv.hgetall(key) as SupplierRecord | null
    
    if (existing) {
      // Update existing supplier (merge data)
      const updated: SupplierRecord = {
        ...existing,
        legalName: data.legalName !== undefined ? data.legalName : existing.legalName,
        phone: data.phone || existing.phone,
        phoneLandline: data.phoneLandline !== undefined ? data.phoneLandline : existing.phoneLandline,
        mobile: data.mobile || existing.mobile,
        email: data.email || existing.email,
        address: data.address || existing.address,
        city: data.city || existing.city,
        postcode: data.postcode || existing.postcode,
        ...(data.coords ? { coords: data.coords } : existing.coords ? { coords: existing.coords } : {}),
        website: data.website || existing.website,
        bankName: data.bankName || existing.bankName,
        bankAccount: data.bankAccount || existing.bankAccount,
        bankAccountName: data.bankAccountName || existing.bankAccountName,
        gstNumber: data.gstNumber || existing.gstNumber,
        notes: data.notes || existing.notes,
        updatedAt: new Date().toISOString()
      }
      
      await kv.hset(key, updated)
      
      return NextResponse.json({
        success: true,
        supplier: updated,
        isNew: false
      })
    }
    
    // Create new supplier with unique portal code
    const portalCode = generatePortalCode()
    
    // Only include coords if they exist (avoid undefined in KV)
    const supplier: SupplierRecord = {
      name,
      legalName: data.legalName || '',
      phone: data.phone || '',
      phoneLandline: data.phoneLandline || false,
      mobile: data.mobile || '',
      email: data.email || '',
      address: data.address || '',
      city: data.city || '',
      postcode: data.postcode || '',
      ...(data.coords ? { coords: data.coords } : {}),
      website: data.website || '',
      bankName: data.bankName || '',
      bankAccount: data.bankAccount || '',
      bankAccountName: data.bankAccountName || '',
      gstNumber: data.gstNumber || '',
      notes: data.notes || '',
      portalCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      jobCount: 0,
      totalPaid: 0
    }
    
    await kv.hset(key, supplier)
    
    // Add to suppliers list
    await kv.sadd('suppliers:list', name)
    
    // Store reverse lookup: portal code -> supplier name
    await kv.set(`supplier:portal:${portalCode}`, name)
    
    return NextResponse.json({
      success: true,
      supplier,
      isNew: true
    })
  } catch (error) {
    console.error('Supplier creation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to save supplier'
    }, { status: 500 })
  }
}

// Get all suppliers (with optional search)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchQuery = searchParams.get('search')?.toLowerCase()
    
    // Get supplier names from set
    const names = await kv.smembers('suppliers:list') as string[]
    
    // Get details for each
    const suppliers: SupplierRecord[] = []
    for (const name of names) {
      const supplier = await kv.hgetall(`supplier:${name}`) as SupplierRecord | null
      if (supplier) {
        // If search query, filter by name or address
        if (searchQuery) {
          const matchesName = supplier.name?.toLowerCase().includes(searchQuery)
          const matchesAddress = supplier.address?.toLowerCase().includes(searchQuery)
          if (matchesName || matchesAddress) {
            suppliers.push(supplier)
          }
        } else {
          suppliers.push(supplier)
        }
      }
    }
    
    // Sort by job count descending
    suppliers.sort((a, b) => (b.jobCount || 0) - (a.jobCount || 0))
    
    return NextResponse.json({
      success: true,
      suppliers
    })
  } catch (error) {
    console.error('Suppliers list error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get suppliers',
      suppliers: []
    }, { status: 500 })
  }
}
