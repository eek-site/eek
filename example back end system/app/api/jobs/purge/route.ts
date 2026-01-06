import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function POST(request: NextRequest) {
  try {
    const { bookingId, rego, confirmDelete } = await request.json()
    
    if (!confirmDelete) {
      return NextResponse.json({ 
        success: false, 
        error: 'Must confirm deletion' 
      }, { status: 400 })
    }
    
    if (!bookingId && !rego) {
      return NextResponse.json({ 
        success: false, 
        error: 'Booking ID or Rego required' 
      }, { status: 400 })
    }
    
    const deleted: string[] = []
    
    // SAFETY: Only delete job-specific records
    // NEVER delete: supplier:{name}, suppliers:list, or any supplier master data
    
    const idToDelete = bookingId || rego
    
    // Protect against deleting supplier data - refuse if ID looks like a supplier name
    if (idToDelete.includes('Towing') || idToDelete.includes('Auto') || idToDelete.includes('&')) {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot purge: ID appears to be a supplier name, not a job ID' 
      }, { status: 400 })
    }
    
    // Delete job:{id}
    const jobExists = await kv.exists(`job:${idToDelete}`)
    if (jobExists) {
      await kv.del(`job:${idToDelete}`)
      deleted.push(`job:${idToDelete}`)
    }
    
    // Delete booking:{id}
    const bookingExists = await kv.exists(`booking:${idToDelete}`)
    if (bookingExists) {
      await kv.del(`booking:${idToDelete}`)
      deleted.push(`booking:${idToDelete}`)
    }
    
    // Remove from jobs:list
    await kv.lrem('jobs:list', 0, idToDelete)
    
    // Remove from rego index (just this one entry, not the whole list)
    if (rego && bookingId) {
      await kv.lrem(`rego:${rego}:jobs`, 0, bookingId)
    }
    
    // Delete any supplier-job records linked to this booking
    const supplierJobExists = await kv.exists(`supplier-job:${idToDelete}`)
    if (supplierJobExists) {
      await kv.del(`supplier-job:${idToDelete}`)
      deleted.push(`supplier-job:${idToDelete}`)
    }
    
    console.log('🔥 PURGED single record:', idToDelete, 'Deleted:', deleted.join(', '))
    
    if (deleted.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No records found to delete'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      deleted,
      message: `Purged ${deleted.length} record(s) for ${idToDelete}`
    })
    
  } catch (error) {
    console.error('Purge job error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to purge job' 
    }, { status: 500 })
  }
}
