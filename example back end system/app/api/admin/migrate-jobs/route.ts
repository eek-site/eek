import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

// Migration: Move all jobs from rego-based keys to bookingId-based keys
// Access: POST /api/admin/migrate-jobs
export async function POST() {
  try {
    const results = {
      scanned: 0,
      migrated: 0,
      alreadyCorrect: 0,
      errors: [] as string[],
      details: [] as string[]
    }
    
    // Get current jobs:list
    const currentList = await kv.lrange('jobs:list', 0, 500) as string[]
    results.scanned = currentList.length
    
    const newJobsList: string[] = []
    
    for (const id of currentList) {
      try {
        const job = await kv.hgetall(`job:${id}`) as Record<string, unknown> | null
        
        if (!job) {
          results.errors.push(`No job found for key job:${id}`)
          continue
        }
        
        const bookingId = job.bookingId as string
        const rego = job.rego as string
        
        // Check if this job is already stored correctly (by bookingId)
        if (bookingId && id === bookingId) {
          // Already correct
          results.alreadyCorrect++
          newJobsList.push(bookingId)
          results.details.push(`✓ ${bookingId} (${rego}) - already correct`)
          continue
        }
        
        // Job is stored by rego, needs migration
        if (bookingId) {
          // Copy to new key
          await kv.hset(`job:${bookingId}`, job)
          
          // Delete old key (only if different)
          if (id !== bookingId) {
            await kv.del(`job:${id}`)
          }
          
          results.migrated++
          newJobsList.push(bookingId)
          results.details.push(`→ Migrated ${id} (${rego}) to ${bookingId}`)
        } else {
          // No bookingId - generate one
          const newBookingId = `HT-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          const updatedJob = { ...job, bookingId: newBookingId }
          
          await kv.hset(`job:${newBookingId}`, updatedJob)
          
          if (id !== newBookingId) {
            await kv.del(`job:${id}`)
          }
          
          results.migrated++
          newJobsList.push(newBookingId)
          results.details.push(`→ Migrated ${id} (${rego}) to NEW ${newBookingId}`)
        }
      } catch (e) {
        results.errors.push(`Error processing ${id}: ${String(e)}`)
      }
    }
    
    // Replace jobs:list with corrected list (bookingIds only)
    if (newJobsList.length > 0) {
      // Clear and rebuild the list
      await kv.del('jobs:list')
      for (const bookingId of newJobsList.reverse()) { // Reverse because lpush adds to front
        await kv.lpush('jobs:list', bookingId)
      }
      results.details.push(`\n✓ Updated jobs:list with ${newJobsList.length} bookingIds`)
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration complete: ${results.migrated} migrated, ${results.alreadyCorrect} already correct`,
      results
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}

// GET to preview what would be migrated (dry run)
export async function GET() {
  try {
    const preview = {
      total: 0,
      needsMigration: [] as { currentKey: string; rego: string; bookingId: string }[],
      alreadyCorrect: [] as { key: string; rego: string }[],
      noBookingId: [] as { key: string; rego: string }[]
    }
    
    const currentList = await kv.lrange('jobs:list', 0, 500) as string[]
    preview.total = currentList.length
    
    for (const id of currentList) {
      const job = await kv.hgetall(`job:${id}`) as Record<string, unknown> | null
      
      if (!job) continue
      
      const bookingId = job.bookingId as string
      const rego = job.rego as string || 'NO_REGO'
      
      if (!bookingId) {
        preview.noBookingId.push({ key: id, rego })
      } else if (id === bookingId) {
        preview.alreadyCorrect.push({ key: id, rego })
      } else {
        preview.needsMigration.push({ currentKey: id, rego, bookingId })
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Preview: ${preview.needsMigration.length} need migration, ${preview.alreadyCorrect.length} correct, ${preview.noBookingId.length} missing bookingId`,
      preview
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
