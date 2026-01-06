import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * CarJam API Integration
 * Fetches vehicle details from CarJam using ABCD (cheapest at $0.04)
 * Captures ALL available vehicle data
 */

const CARJAM_API_KEY = process.env.CARJAM_API_KEY || ''
const CARJAM_BASE_URL = 'https://www.carjam.co.nz/a/vehicle:abcd'

export interface VehicleData {
  success: boolean
  // Basic info
  plate?: string
  vin?: string
  chassis?: string
  // Make/Model
  make?: string
  model?: string
  variant?: string
  series?: string
  body?: string
  // Specs
  year?: string
  cc?: string
  fuel?: string
  transmission?: string
  engineNumber?: string
  // Appearance
  colour?: string
  secondaryColour?: string
  seats?: string
  doors?: string
  // Registration
  regoExpiry?: string
  regoStatus?: string
  // WOF
  wofExpiry?: string
  wofStatus?: string
  // Other
  vehicleType?: string
  usage?: string
  imported?: string
  country?: string
  // Raw data for debugging
  raw?: Record<string, unknown>
  // Error handling
  error?: string
  isDemo?: boolean
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plate = searchParams.get('plate')

    if (!plate) {
      return NextResponse.json({ success: false, error: 'Plate is required' }, { status: 400 })
    }

    // Clean the plate - remove spaces, uppercase
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase()

    if (!CARJAM_API_KEY) {
      console.log('CarJam DEMO MODE - no API key configured')
      // Return demo data
      return NextResponse.json({
        success: true,
        plate: cleanPlate,
        make: 'Toyota',
        model: 'Hilux',
        variant: 'SR5',
        year: '2020',
        colour: 'White',
        body: 'Utility',
        cc: '2800',
        fuel: 'Diesel',
        transmission: 'Automatic',
        seats: '5',
        doors: '4',
        vehicleType: 'Passenger Car/Van',
        isDemo: true
      } as VehicleData)
    }

    // Call CarJam API
    const url = `${CARJAM_BASE_URL}?plate=${encodeURIComponent(cleanPlate)}&key=${CARJAM_API_KEY}`
    
    console.log('CarJam lookup:', cleanPlate)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    // Get response text first to debug
    const responseText = await response.text()
    
    if (!response.ok) {
      console.error('CarJam API error:', response.status, responseText)
      
      // Return a graceful "not found" for any error - don't block the customer
      return NextResponse.json({ 
        success: false, 
        error: 'Vehicle not found',
        plate: cleanPlate
      } as VehicleData)
    }

    // Try to parse JSON
    let data
    try {
      data = JSON.parse(responseText)
    } catch {
      console.error('CarJam returned non-JSON:', responseText.substring(0, 200))
      return NextResponse.json({ 
        success: false, 
        error: 'Vehicle not found',
        plate: cleanPlate
      } as VehicleData)
    }
    
    // Log raw response for debugging
    console.log('CarJam raw response keys:', Object.keys(data || {}))
    console.log('CarJam raw response:', JSON.stringify(data).substring(0, 500))
    
    // CarJam might nest vehicle data - check common wrapper fields
    let vehicleInfo = data
    if (data.vehicle) vehicleInfo = data.vehicle
    if (data.result) vehicleInfo = data.result
    if (data.data) vehicleInfo = data.data
    if (data.details) vehicleInfo = data.details
    
    // Check if CarJam returned an error or empty result
    const hasMake = vehicleInfo?.make || vehicleInfo?.vehicle_make || vehicleInfo?.Make || 
                    vehicleInfo?.MAKE || vehicleInfo?.manufacturer
    
    if (!vehicleInfo || data.error || !hasMake) {
      console.log('CarJam no vehicle found for:', cleanPlate, 'hasMake:', hasMake)
      return NextResponse.json({ 
        success: false, 
        error: 'Vehicle not found',
        plate: cleanPlate,
        debug: { keys: Object.keys(data || {}), sample: JSON.stringify(data).substring(0, 300) }
      } as VehicleData)
    }
    
    // Use the unwrapped vehicle info
    data = vehicleInfo
    
    // Extract ALL available data from CarJam ABCD response
    const result: VehicleData = {
      success: true,
      // Basic
      plate: cleanPlate,
      vin: data.vin || data.VIN || '',
      chassis: data.chassis || data.chassis_number || '',
      // Make/Model - try multiple field names
      make: data.make || data.vehicle_make || data.Make || '',
      model: data.model || data.vehicle_model || data.Model || '',
      variant: data.variant || data.model_code || data.submodel || '',
      series: data.series || data.model_series || '',
      body: data.body_style || data.body || data.Body || '',
      // Specs
      year: String(data.year_of_manufacture || data.year || data.model_year || data.Year || ''),
      cc: String(data.cc_rating || data.engine_cc || data.cc || data.engine_size || ''),
      fuel: data.fuel_type || data.fuel || data.Fuel || '',
      transmission: data.transmission || data.trans_type || '',
      engineNumber: data.engine_number || data.engine_no || '',
      // Appearance
      colour: data.main_colour || data.colour || data.Colour || data.color || '',
      secondaryColour: data.second_colour || data.secondary_colour || '',
      seats: String(data.number_of_seats || data.seats || data.seating_capacity || ''),
      doors: String(data.number_of_doors || data.doors || ''),
      // Registration
      regoExpiry: data.licence_expiry_date || data.rego_expiry || data.registration_expiry || '',
      regoStatus: data.licence_status || data.rego_status || '',
      // WOF
      wofExpiry: data.wof_expiry || data.wof_expires || data.wof_due_date || '',
      wofStatus: data.wof_status || '',
      // Other
      vehicleType: data.vehicle_type || data.type || '',
      usage: data.vehicle_usage || data.usage || '',
      imported: data.first_registration_date || data.first_nz_registration || '',
      country: data.country_of_origin || data.assembly_country || '',
      // Include raw for debugging (remove in production if too verbose)
      raw: data
    }

    console.log('CarJam result:', {
      plate: result.plate,
      make: result.make,
      model: result.model,
      year: result.year,
      colour: result.colour
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('CarJam API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to lookup vehicle' 
    } as VehicleData, { status: 500 })
  }
}
