import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'
import { sendInternalNotification } from '@/lib/internal-notifications'

/**
 * Add a completed job to the stories/carousel using Vercel KV
 * 
 * Called after successful payment to add the job to the carousel.
 */

export interface CompletedJob {
  id: string
  bookingId: string
  transactionId: string
  customerName: string  // First name only for privacy
  vehicle: string
  vehicleRego?: string
  vehicleVin?: string
  vehicleFuel?: string
  vehicleCc?: string
  vehicleYear?: string
  location: string
  slug: string
  issue: string
  responseTime: string
  value: number
  completedAt: string
}

// Key for the jobs list in KV
const JOBS_KEY = 'hook_completed_jobs'
const MAX_JOBS = 500  // Keep last 500 jobs

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { 
      bookingId, 
      transactionId, 
      value, 
      completedAt,
      customerName,
      customerPhone,
      customerEmail,
      vehicleMake,
      vehicleModel,
      vehicleColor,
      vehicleRego,
      vehicleYear,
      vehicleVin,
      vehicleFuel,
      vehicleCc,
      vehicleTransmission,
      vehicleBody,
      vehicleSeats,
      vehicleWofExpiry,
      vehicleRegoExpiry,
      pickupLocation,
      dropoffLocation,
      issueType,
      eta
    } = body

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })
    }

    // Create the job entry for the carousel
    const job: CompletedJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      bookingId,
      transactionId: transactionId || '',
      customerName: getFirstName(customerName || 'Customer'),
      vehicle: formatVehicle(vehicleMake, vehicleModel, vehicleColor),
      vehicleRego,
      vehicleVin,
      vehicleFuel,
      vehicleCc,
      vehicleYear,
      location: extractLocation(pickupLocation || 'New Zealand'),
      slug: createSlug(pickupLocation || 'new-zealand'),
      issue: issueType || 'Breakdown',
      responseTime: eta || '20 mins',
      value: value ? value / 100 : 0,
      completedAt: completedAt || new Date().toISOString()
    }

    // Check if Vercel KV is configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        // Add to the front of the list
        await kv.lpush(JOBS_KEY, JSON.stringify(job))
        
        // Trim to keep only the last MAX_JOBS
        await kv.ltrim(JOBS_KEY, 0, MAX_JOBS - 1)
        
        console.log('Job added to Vercel KV:', job.id)
      } catch (kvError) {
        console.error('Vercel KV error:', kvError)
        // Continue without failing - job is still logged
      }
    } else {
      console.log('Vercel KV not configured, job logged only')
    }

    // Always log the job
    console.log('COMPLETED JOB:', {
      id: job.id,
      customer: job.customerName,
      vehicle: job.vehicle,
      location: job.location,
      issue: job.issue,
      value: job.value
    })

    // Send internal notification - payment completed
    sendInternalNotification({
      type: 'payment_completed',
      bookingId,
      transactionId,
      customerName,
      customerPhone,
      customerEmail,
      pickupLocation,
      dropoffLocation,
      price: value,
      eta,
      vehicleRego,
      vehicleMake,
      vehicleModel,
      vehicleColour: vehicleColor,
      vehicleYear,
      vehicleVin,
      vehicleFuel,
      vehicleCc,
      vehicleTransmission,
      vehicleBody,
      vehicleSeats,
      vehicleWofExpiry,
      vehicleRegoExpiry
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Job added to carousel'
    })

  } catch (error) {
    console.error('Add completed job error:', error)
    return NextResponse.json(
      { error: 'Failed to add job' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch recent jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Check if Vercel KV is configured
    if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
      return NextResponse.json({ 
        jobs: [],
        message: 'Vercel KV not configured'
      })
    }

    // Get jobs from KV
    const jobStrings = await kv.lrange(JOBS_KEY, 0, limit - 1)
    const jobs: CompletedJob[] = jobStrings.map(str => 
      typeof str === 'string' ? JSON.parse(str) : str
    )

    return NextResponse.json({
      success: true,
      jobs,
      count: jobs.length
    })

  } catch (error) {
    console.error('Fetch jobs error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs', jobs: [] },
      { status: 500 }
    )
  }
}

// Helper functions
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0] || 'Customer'
}

function formatVehicle(make?: string, model?: string, color?: string): string {
  const parts = [color, make, model].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Vehicle'
}

function extractLocation(address: string): string {
  // Try to extract city/suburb from address
  // Common NZ cities
  const cities = [
    'Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Tauranga',
    'Dunedin', 'Palmerston North', 'Napier', 'Hastings', 'Nelson',
    'Rotorua', 'New Plymouth', 'Whangarei', 'Invercargill', 'Whanganui',
    'Gisborne', 'Blenheim', 'Timaru', 'Taupo', 'Queenstown'
  ]
  
  for (const city of cities) {
    if (address.toLowerCase().includes(city.toLowerCase())) {
      return city
    }
  }
  
  // Return first part of address or truncate
  const firstPart = address.split(',')[0]
  return firstPart.length > 30 ? firstPart.substring(0, 30) + '...' : firstPart
}

function createSlug(location: string): string {
  return location
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}
