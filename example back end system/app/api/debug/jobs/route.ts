import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const dynamic = 'force-dynamic'

// Debug endpoint to see raw database contents
// Access: /api/debug/jobs
export async function GET() {
  try {
    // Get jobs list (all booking IDs)
    const jobIds = await kv.lrange('jobs:list', 0, 100) as string[]
    
    console.log('Jobs list:', jobIds)
    
    // Get each job's data
    const jobs: Array<{
      id: string
      data: Record<string, unknown> | null
      source: string
    }> = []
    
    for (const jobId of jobIds) {
      const jobData = await kv.hgetall(`job:${jobId}`)
      jobs.push({
        id: jobId,
        data: jobData as Record<string, unknown> | null,
        source: `job:${jobId}`
      })
    }
    
    // Also check bookings list
    const bookingIds = await kv.lrange('bookings:list', 0, 100) as string[]
    
    // Check for duplicate IDs
    const uniqueJobIds = Array.from(new Set(jobIds))
    const duplicateJobIds = jobIds.filter((id, i) => jobIds.indexOf(id) !== i)
    
    // Summary
    const summary = {
      totalJobIds: jobIds.length,
      uniqueJobIds: uniqueJobIds.length,
      duplicates: duplicateJobIds,
      byStatus: {} as Record<string, number>,
      byRego: {} as Record<string, string[]>
    }
    
    for (const job of jobs) {
      if (job.data) {
        const status = job.data.status as string || 'unknown'
        summary.byStatus[status] = (summary.byStatus[status] || 0) + 1
        
        const rego = job.data.rego as string || 'no-rego'
        if (!summary.byRego[rego]) summary.byRego[rego] = []
        summary.byRego[rego].push(job.id)
      }
    }
    
    return NextResponse.json({
      success: true,
      summary,
      jobIds,
      bookingIds,
      jobs: jobs.map(j => ({
        id: j.id,
        rego: j.data?.rego,
        bookingId: j.data?.bookingId,
        status: j.data?.status,
        supplierName: j.data?.supplierName,
        customerName: j.data?.customerName,
        createdAt: j.data?.createdAt,
        pickupLocation: j.data?.pickupLocation
      }))
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
