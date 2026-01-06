import { NextRequest, NextResponse } from 'next/server'
import { KM_RATE } from '@/lib/pricing'

interface DistanceRequest {
  start?: string | { lat: number; lng: number }
  pickup: string | { lat: number; lng: number }
  dropoff: string | { lat: number; lng: number }
}

interface DistanceResponse {
  success: boolean
  totalDistanceKm?: number
  distanceKm?: number // Simple pickup-to-dropoff distance
  legs?: {
    startToPickup: number
    pickupToDropoff: number
    dropoffToStart: number
  }
  kmCost?: number // in cents
  error?: string
}

// Convert location to string format for API
function locationToString(loc: string | { lat: number; lng: number }): string {
  if (typeof loc === 'string') return loc
  return `${loc.lat},${loc.lng}`
}

// Check if two locations are effectively the same
function locationsMatch(loc1: string, loc2: string): boolean {
  // Simple string comparison - if they're the same string, they match
  if (loc1 === loc2) return true
  
  // Check if both are coordinates and very close
  const coordsPattern = /^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/
  const match1 = loc1.match(coordsPattern)
  const match2 = loc2.match(coordsPattern)
  
  if (match1 && match2) {
    const lat1 = parseFloat(match1[1])
    const lng1 = parseFloat(match1[2])
    const lat2 = parseFloat(match2[1])
    const lng2 = parseFloat(match2[2])
    
    // Within ~100m
    const threshold = 0.001
    return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold
  }
  
  return false
}

export async function POST(request: NextRequest): Promise<NextResponse<DistanceResponse>> {
  try {
    let body: DistanceRequest
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Invalid JSON body'
      }, { status: 400 })
    }
    
    const { start, pickup, dropoff } = body
    
    if (!pickup || !dropoff) {
      return NextResponse.json({
        success: false,
        error: 'Pickup and dropoff locations are required'
      }, { status: 400 })
    }
    
    const startStr = start ? locationToString(start) : null
    const pickupStr = locationToString(pickup)
    const dropoffStr = locationToString(dropoff)
    
    // Validate we have actual content
    if (!pickupStr.trim() || !dropoffStr.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Location values cannot be empty'
      }, { status: 400 })
    }
    
    // Simple mode: just pickup to dropoff (no start point)
    const simpleMode = !startStr
    
    console.log('Calculating distance:', { start: startStr, pickup: pickupStr, dropoff: dropoffStr, simpleMode })
    
    // Prefer server-side key, fallback to public key
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    
    console.log('API Key status:', apiKey ? 'Present' : 'Missing', '(Server key:', !!process.env.GOOGLE_MAPS_API_KEY, ')')
    
    if (!apiKey) {
      // Demo mode - return estimated distance based on generic values
      console.log('No Google Maps API key - using demo distance calculation')
      const demoDistance = simpleMode ? 15 : 25 // 15km for simple, 25km round trip
      return NextResponse.json({
        success: true,
        totalDistanceKm: demoDistance,
        distanceKm: simpleMode ? demoDistance : undefined, // For simple mode
        legs: simpleMode ? undefined : {
          startToPickup: 8,
          pickupToDropoff: 9,
          dropoffToStart: 8
        },
        kmCost: Math.round(demoDistance * KM_RATE * 100)
      })
    }
    
    // Pre-check: if any locations match, handle separately
    const startEqualsPickup = startStr ? locationsMatch(startStr, pickupStr) : false
    const pickupEqualsDropoff = locationsMatch(pickupStr, dropoffStr)
    const dropoffEqualsStart = startStr ? locationsMatch(dropoffStr, startStr) : false
    
    // If pickup equals dropoff, return 0
    if (pickupEqualsDropoff) {
      console.log('Pickup equals dropoff - returning 0 distance')
      return NextResponse.json({
        success: true,
        totalDistanceKm: 0,
        distanceKm: 0,
        legs: simpleMode ? undefined : {
          startToPickup: 0,
          pickupToDropoff: 0,
          dropoffToStart: 0
        },
        kmCost: 0
      })
    }
    
    // If all locations are the same (full mode), return 0
    if (!simpleMode && startEqualsPickup && pickupEqualsDropoff) {
      console.log('All locations match - returning 0 distance')
      return NextResponse.json({
        success: true,
        totalDistanceKm: 0,
        distanceKm: 0,
        legs: {
          startToPickup: 0,
          pickupToDropoff: 0,
          dropoffToStart: 0
        },
        kmCost: 0
      })
    }
    
    // Build unique locations for API call to minimize requests
    const uniqueLocations: string[] = []
    if (startStr && !uniqueLocations.includes(startStr)) uniqueLocations.push(startStr)
    if (!uniqueLocations.includes(pickupStr)) uniqueLocations.push(pickupStr)
    if (!uniqueLocations.includes(dropoffStr)) uniqueLocations.push(dropoffStr)
    
    // Call Google Distance Matrix API with unique locations
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', uniqueLocations.join('|'))
    url.searchParams.set('destinations', uniqueLocations.join('|'))
    url.searchParams.set('key', apiKey)
    url.searchParams.set('units', 'metric')
    url.searchParams.set('region', 'nz')
    
    console.log('Calling Distance Matrix API...')
    const response = await fetch(url.toString())
    const data = await response.json()
    
    if (data.status !== 'OK') {
      console.error('Distance Matrix API error:', data.status, data.error_message)
      return NextResponse.json({
        success: false,
        error: `Google API error: ${data.error_message || data.status}`
      }, { status: 500 })
    }
    
    // Build index map for quick lookup
    const locationIndex: Record<string, number> = {}
    uniqueLocations.forEach((loc, idx) => {
      locationIndex[loc] = idx
    })
    
    // Helper to get distance between two locations from the matrix
    const getDistance = (from: string, to: string): number => {
      if (from === to || locationsMatch(from, to)) return 0
      
      const fromIdx = locationIndex[from]
      const toIdx = locationIndex[to]
      
      if (fromIdx === undefined || toIdx === undefined) {
        console.error('Location not found in index:', { from, to, locationIndex })
        return 0
      }
      
      const element = data.rows[fromIdx]?.elements[toIdx]
      
      if (!element) {
        console.error('No element in matrix:', { fromIdx, toIdx })
        return 0
      }
      
      if (element.status !== 'OK') {
        console.error('Element status not OK:', element.status)
        return 0
      }
      
      return element.distance?.value || 0 // in meters
    }
    
    // Calculate each leg
    const pickupToDropoffM = getDistance(pickupStr, dropoffStr)
    
    if (simpleMode) {
      // Simple mode: just pickup to dropoff distance
      const distanceKm = pickupToDropoffM / 1000
      const kmCost = Math.round(distanceKm * KM_RATE * 100) // in cents
      
      console.log('Simple distance calculated:', {
        distanceKm: distanceKm.toFixed(1),
        kmCost
      })
      
      return NextResponse.json({
        success: true,
        distanceKm: Math.round(distanceKm * 10) / 10, // Round to 1 decimal
        totalDistanceKm: Math.round(distanceKm * 10) / 10, // Also include for compatibility
        kmCost
      })
    }
    
    // Full mode: all three legs
    const startToPickupM = getDistance(startStr!, pickupStr)
    const dropoffToStartM = getDistance(dropoffStr, startStr!)
    
    // Convert to km
    const legs = {
      startToPickup: startToPickupM / 1000,
      pickupToDropoff: pickupToDropoffM / 1000,
      dropoffToStart: dropoffToStartM / 1000
    }
    
    const totalDistanceKm = legs.startToPickup + legs.pickupToDropoff + legs.dropoffToStart
    const kmCost = Math.round(totalDistanceKm * KM_RATE * 100) // in cents
    
    console.log('Distance calculated:', {
      legs,
      totalDistanceKm: totalDistanceKm.toFixed(1),
      kmCost
    })
    
    return NextResponse.json({
      success: true,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10, // Round to 1 decimal
      distanceKm: Math.round(legs.pickupToDropoff * 10) / 10, // Just the tow distance
      legs,
      kmCost
    })
    
  } catch (error) {
    console.error('Distance calculation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate distance'
    }, { status: 500 })
  }
}
