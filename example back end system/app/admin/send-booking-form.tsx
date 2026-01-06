'use client'

import { useState, useEffect } from 'react'
import { 
  ISSUE_TYPES, 
  type IssueType
} from '@/lib/eek-data-schema'
import { 
  encodeBookingData, 
  generateBookingId, 
  formatPrice,
  type BookingData 
} from '@/lib/booking-utils'
import {
  KM_RATE,
  CALLOUT_FEES,
  getCurrentCalloutPeriod,
  getCurrentCalloutFee,
  getCalloutPeriodLabel,
  formatPriceBreakdown,
  type CalloutPeriod
} from '@/lib/pricing'
import AddressPicker from '@/components/AddressPicker'
import SupplierPicker, { type SupplierData } from '@/components/SupplierPicker'
import { 
  Phone, 
  MapPin, 
  Car, 
  DollarSign, 
  Clock, 
  Send, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Link as LinkIcon,
  MessageSquare,
  Mail,
  Loader2,
  Search,
  Navigation,
  Calculator,
  Building2
} from 'lucide-react'

interface Props {
  user: { email: string; name: string; role: string } | null
}

export default function SendBookingForm({ user }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  // Location state - Start location can be a supplier OR just a location
  const [supplierKnown, setSupplierKnown] = useState(true) // Toggle: true = pick supplier, false = just location
  const [supplierData, setSupplierData] = useState<SupplierData>({
    name: '',
    phone: '',
    phoneLandline: false,
    mobile: '',
    email: '',
    address: '',
    coords: undefined
  })
  // Simple start location (when supplier not known yet)
  const [simpleStartLocation, setSimpleStartLocation] = useState('')
  const [simpleStartCoords, setSimpleStartCoords] = useState<{ lat: number; lng: number } | undefined>()
  
  // Convenience accessors - use supplier data or simple location
  const startLocation = supplierKnown ? supplierData.address : simpleStartLocation
  const startCoords = supplierKnown ? supplierData.coords : simpleStartCoords
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | undefined>()
  const [dropoffLocation, setDropoffLocation] = useState('')
  const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | undefined>()
  
  // Pricing state
  const [distanceKm, setDistanceKm] = useState<number | null>(null)
  const [calculatingDistance, setCalculatingDistance] = useState(false)
  const [calloutPeriod, setCalloutPeriod] = useState<CalloutPeriod>(getCurrentCalloutPeriod())
  const [calloutFee, setCalloutFee] = useState(getCurrentCalloutFee())
  const [manualPrice, setManualPrice] = useState<string>('')  // Override total if set
  const [sentPrice, setSentPrice] = useState<number | null>(null)  // Capture price when sent
  const [eta, setEta] = useState('30')
  
  // Vehicle state
  const [rego, setRego] = useState('')
  const [lookingUpVehicle, setLookingUpVehicle] = useState(false)
  const [vehicleLookedUp, setVehicleLookedUp] = useState(false)
  
  // Optional customer details
  const [showOptional, setShowOptional] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [vehicleMake, setVehicleMake] = useState('')
  const [vehicleModel, setVehicleModel] = useState('')
  const [vehicleColor, setVehicleColor] = useState('')
  const [issueType, setIssueType] = useState<IssueType>('Breakdown')
  const [description, setDescription] = useState('')

  // Send method
  const [sendMethod, setSendMethod] = useState<'link' | 'sms' | 'email' | 'both'>('sms')

  // Update callout fee when period changes
  useEffect(() => {
    setCalloutFee(CALLOUT_FEES[calloutPeriod])
  }, [calloutPeriod])

  // Auto-calculate distance when all locations are set
  useEffect(() => {
    if (startLocation && pickupLocation && dropoffLocation) {
      calculateDistance()
    }
  }, [startCoords, pickupCoords, dropoffCoords])

  const calculateDistance = async () => {
    if (!startLocation || !pickupLocation || !dropoffLocation) return
    
    setCalculatingDistance(true)
    setError(null)
    
    try {
      const response = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: startCoords || startLocation,
          pickup: pickupCoords || pickupLocation,
          dropoff: dropoffCoords || dropoffLocation
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setDistanceKm(data.totalDistanceKm)
        console.log('📍 Distance calculated:', data)
      } else {
        setError(data.error || 'Failed to calculate distance')
      }
    } catch (e) {
      console.error('Distance calc error:', e)
      setError('Failed to calculate distance')
    } finally {
      setCalculatingDistance(false)
    }
  }

  const lookupVehicle = async () => {
    if (!rego || rego.length < 3) {
      setError('Enter a valid rego first')
      return
    }
    
    setLookingUpVehicle(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/carjam?plate=${encodeURIComponent(rego)}`)
      const data = await response.json()
      
      if (data.success) {
        if (data.make) setVehicleMake(data.make)
        if (data.model) setVehicleModel(data.model)
        if (data.colour) setVehicleColor(data.colour)
        setVehicleLookedUp(true)
        setShowOptional(true)
        console.log('🚗 Vehicle lookup:', data)
      } else {
        setError(data.error || 'Vehicle not found')
      }
    } catch (e) {
      setError('Failed to lookup vehicle')
      console.error('Vehicle lookup failed:', e)
    } finally {
      setLookingUpVehicle(false)
    }
  }

  // Calculate final price
  const getCalculatedPrice = (): number => {
    if (manualPrice) {
      return Math.round(parseFloat(manualPrice) * 100) // Convert to cents
    }
    if (distanceKm !== null) {
      const kmCost = Math.round(distanceKm * KM_RATE * 100)
      return kmCost + (calloutFee * 100)
    }
    return 0
  }

  const priceBreakdown = distanceKm !== null 
    ? formatPriceBreakdown(distanceKm, calloutFee) 
    : null

  const generateLink = (): { link: string; bookingData: BookingData } | null => {
    const finalPrice = getCalculatedPrice()
    
    if (!pickupLocation || finalPrice === 0) {
      setError('Pickup location and valid price are required')
      return null
    }

    // Generate a unique booking ID
    const bookingId = generateBookingId()

    // Use short booking ID URL instead of massive base64
    const link = `${window.location.origin}/pay/${bookingId}`
    setGeneratedLink(link)
    
    // Create booking data - include supplier only if known
    const bookingData: BookingData = {
      bookingId,
      rego: rego || undefined,
      // Supplier = towing company (only if supplier is known)
      supplierName: supplierKnown && supplierData.name ? supplierData.name : undefined,
      supplierAddress: supplierKnown ? supplierData.address : simpleStartLocation || undefined,
      supplierCoords: supplierKnown ? supplierData.coords : simpleStartCoords,
      supplierPhone: supplierKnown ? supplierData.phone : undefined,
      supplierPhoneLandline: supplierKnown ? supplierData.phoneLandline : undefined,
      supplierMobile: supplierKnown ? supplierData.mobile : undefined,
      supplierEmail: supplierKnown ? supplierData.email : undefined,
      pickupLocation,
      dropoffLocation: dropoffLocation || undefined,
      price: finalPrice,
      eta: eta ? `${eta} mins` : '30 mins',
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      customerEmail: customerEmail || undefined,
      vehicleMake: vehicleMake || undefined,
      vehicleModel: vehicleModel || undefined,
      vehicleColor: vehicleColor || undefined,
      issueType: issueType || undefined,
      description: description || undefined,
      createdAt: new Date().toISOString(),
      createdBy: user?.email || 'admin',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
    
    return { link, bookingData }
  }

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSend = async () => {
    const result = generateLink()
    if (!result) return
    
    const { link, bookingData } = result
    
    // Capture the price that was actually sent
    setSentPrice(bookingData.price)
    
    setLoading(true)
    setError(null)

    try {
      // Save booking to database by booking ID (short URL)
      await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingData,
          rego: rego?.toUpperCase() || '',
          pickupCoords,
          dropoffCoords
        })
      })
      
      if (sendMethod === 'link') {
        setSuccess(true)
        setLoading(false)
        return
      }

      // Validate contact details based on send method
      if (sendMethod === 'sms' || sendMethod === 'both') {
        if (!customerPhone) {
          setError('Phone number required for SMS')
          setLoading(false)
          return
        }
      }
      if (sendMethod === 'email' || sendMethod === 'both') {
        if (!customerEmail) {
          setError('Email required for email sending')
          setLoading(false)
          return
        }
      }
      if (!customerPhone && !customerEmail) {
        setError('Phone number or email required to send')
        setLoading(false)
        return
      }

      const response = await fetch('/api/send-booking-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link,
          phone: customerPhone,
          email: customerEmail,
          customerName: customerName,
          price: formatPrice(getCalculatedPrice()),
          eta: eta ? `${eta} mins` : '30 mins',
          method: sendMethod,
          // Include for internal notifications
          bookingId: bookingData.bookingId, // Use actual booking ID for customer portal link
          pickupLocation,
          dropoffLocation,
          vehicleRego: rego?.toUpperCase(),
          vehicleMake,
          vehicleModel,
          vehicleColour: vehicleColor,
          createdBy: user?.email
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send')
      }

      setSuccess(true)
      setGeneratedLink(link)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send booking link')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setRego('')
    setSupplierData({
      name: '',
      phone: '',
      phoneLandline: false,
      mobile: '',
      email: '',
      address: '',
      coords: undefined
    })
    setSimpleStartLocation('')
    setSimpleStartCoords(undefined)
    setSupplierKnown(true)
    setPickupLocation('')
    setPickupCoords(undefined)
    setDropoffLocation('')
    setDropoffCoords(undefined)
    setDistanceKm(null)
    setManualPrice('')
    setSentPrice(null)
    setEta('30')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setVehicleMake('')
    setVehicleModel('')
    setVehicleColor('')
    setIssueType('Breakdown')
    setDescription('')
    setGeneratedLink(null)
    setSuccess(false)
    setError(null)
    setVehicleLookedUp(false)
  }

  if (success && generatedLink) {
    return (
      <div className="max-w-xl mx-auto text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {sendMethod === 'link' ? 'Link Generated!' : 'Sent Successfully!'}
        </h2>
        <p className="text-zinc-400 mb-6">
          {sendMethod === 'link' 
            ? 'Copy the link below and send to customer'
            : `Booking link sent to ${customerPhone || customerEmail}`
          }
        </p>
        
        {/* Price Summary */}
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-4 text-left">
          <div className="flex justify-between font-bold">
            <span>{manualPrice ? 'Price (Override)' : 'Total'}</span>
            <span className="text-green-500">{formatPrice(sentPrice || 0)}</span>
          </div>
        </div>
        
        {/* Link display */}
        <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
          <p className="text-xs text-zinc-500 mb-2">Payment Link:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={generatedLink}
              readOnly
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`p-2 rounded-lg transition-colors ${
                copied ? 'bg-green-500 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-white'
              }`}
            >
              {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={resetForm}
            className="bg-red hover:bg-red-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Create Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Locations Section */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
            <Navigation className="w-5 h-5 text-red" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Route & Pricing</h2>
            <p className="text-zinc-500 text-sm">Auto-calculated based on distance</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Start Location - Toggle between Supplier or Just Location */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-orange-500" />
                <label className="text-sm font-medium">Start Location <span className="text-red">*</span></label>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-xs ${supplierKnown ? 'text-zinc-500' : 'text-orange-500'}`}>Location only</span>
                <div 
                  onClick={() => setSupplierKnown(!supplierKnown)}
                  className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${supplierKnown ? 'bg-orange-500' : 'bg-zinc-600'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${supplierKnown ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className={`text-xs ${supplierKnown ? 'text-orange-500' : 'text-zinc-500'}`}>Supplier</span>
              </label>
            </div>
            
            {supplierKnown ? (
              <>
                <SupplierPicker
                  value={supplierData}
                  onChange={(supplier) => setSupplierData(supplier)}
                  placeholder="Search towing company on Google Maps..."
                />
                {supplierData.name && (
                  <div className="mt-2 text-xs text-zinc-500">
                    Truck travels from here → Pickup → Dropoff
                  </div>
                )}
              </>
            ) : (
              <>
                <AddressPicker
                  value={simpleStartLocation}
                  onChange={(address, coords) => {
                    setSimpleStartLocation(address)
                    setSimpleStartCoords(coords)
                  }}
                  placeholder="Enter starting location (e.g. Hamilton)"
                  showMap={true}
                />
                <div className="mt-2 text-xs text-amber-500">
                  ⚠️ Supplier can be assigned later in Book Supplier
                </div>
              </>
            )}
          </div>

          {/* Pickup Location */}
          <AddressPicker
            label="Pickup Location"
            required
            value={pickupLocation}
            onChange={(address, coords) => {
              setPickupLocation(address)
              setPickupCoords(coords)
            }}
            placeholder="Customer vehicle location"
            showMap={true}
            error={!pickupLocation && error?.includes('Pickup') ? error : undefined}
          />

          {/* Dropoff Location */}
          <AddressPicker
            label="Drop-off Location"
            required
            value={dropoffLocation}
            onChange={(address, coords) => {
              setDropoffLocation(address)
              setDropoffCoords(coords)
            }}
            placeholder="Where to take the vehicle"
            showMap={true}
          />

          {/* Calculate Button */}
          {(!distanceKm || calculatingDistance) && startLocation && pickupLocation && dropoffLocation && (
            <button
              type="button"
              onClick={calculateDistance}
              disabled={calculatingDistance}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {calculatingDistance ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Calculating route...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  Calculate Distance & Price
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      {distanceKm !== null && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Price Breakdown</h2>
              <p className="text-zinc-500 text-sm">Round trip: {distanceKm.toFixed(1)} km @ ${KM_RATE}/km</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Distance Cost */}
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-xl p-4">
              <div>
                <p className="font-medium">Distance</p>
                <p className="text-zinc-500 text-sm">{distanceKm.toFixed(1)} km × ${KM_RATE}</p>
              </div>
              <p className="font-bold text-lg">{priceBreakdown?.kmDisplay}</p>
            </div>

            {/* Callout Fee */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium">Callout Fee</p>
                  <p className="text-zinc-500 text-sm">Adjustable</p>
                </div>
                <p className="font-bold text-lg">${calloutFee}</p>
              </div>
              
              {/* Period selector */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(Object.keys(CALLOUT_FEES) as CalloutPeriod[]).map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setCalloutPeriod(period)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      calloutPeriod === period 
                        ? 'bg-red text-white' 
                        : 'bg-zinc-700 hover:bg-zinc-600'
                    }`}
                  >
                    {getCalloutPeriodLabel(period)} - ${CALLOUT_FEES[period]}
                  </button>
                ))}
              </div>
              
              {/* Custom callout fee */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 text-sm">Or enter custom:</span>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    value={calloutFee}
                    onChange={(e) => setCalloutFee(parseInt(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-4 py-2 text-white"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <div>
                <p className="font-bold text-lg">Total</p>
                <p className="text-zinc-400 text-sm">Distance + Callout</p>
              </div>
              <p className="font-bold text-2xl text-green-500">{priceBreakdown?.totalDisplay}</p>
            </div>

            {/* Manual Override */}
            <div className="flex items-center gap-3 text-sm">
              <div 
                onClick={() => setManualPrice(manualPrice ? '' : (getCalculatedPrice() / 100).toString())}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${manualPrice ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${manualPrice ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-zinc-400 group-hover:text-white transition-colors">Override price</span>
              </div>
              {manualPrice && (
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                  <input
                    type="number"
                    value={manualPrice}
                    onChange={(e) => setManualPrice(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-8 pr-4 py-2 text-white"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ETA & Vehicle */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              ETA (minutes)
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="number"
                value={eta}
                onChange={(e) => setEta(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="30"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rego</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={rego}
                onChange={(e) => {
                  setRego(e.target.value.toUpperCase())
                  setVehicleLookedUp(false)
                }}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red uppercase"
                placeholder="ABC123"
              />
              <button
                type="button"
                onClick={lookupVehicle}
                disabled={lookingUpVehicle || !rego}
                className="px-4 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-lg transition-colors flex items-center gap-2"
                title="Lookup vehicle details from CarJam"
              >
                {lookingUpVehicle ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : vehicleLookedUp ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
            {vehicleLookedUp && <p className="text-green-500 text-xs mt-1">✓ Vehicle details fetched</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Customer Phone <span className="text-zinc-500">(for SMS)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="021 123 4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value as IssueType)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red"
            >
              {ISSUE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Optional Details Toggle */}
      <button
        onClick={() => setShowOptional(!showOptional)}
        className="w-full text-left mb-4 px-4 py-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50 hover:bg-zinc-800 transition-colors flex items-center justify-between"
      >
        <span className="text-zinc-400 text-sm">
          {showOptional ? 'Hide' : 'Show'} optional details (customer info, vehicle)
        </span>
        <span className="text-zinc-500">{showOptional ? '−' : '+'}</span>
      </button>

      {/* Optional Details */}
      {showOptional && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-zinc-400" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Additional Details</h2>
              <p className="text-zinc-500 text-sm">Pre-fill customer data (optional)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Customer Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Make</label>
              <input
                type="text"
                value={vehicleMake}
                onChange={(e) => setVehicleMake(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="Toyota"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Model</label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="Corolla"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Colour</label>
              <input
                type="text"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                placeholder="Silver"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red resize-none"
                rows={2}
                placeholder="Any additional notes..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Send Method */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
            <Send className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Send Method</h2>
            <p className="text-zinc-500 text-sm">How to deliver the booking link</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { value: 'link', icon: LinkIcon, label: 'Copy Link' },
            { value: 'sms', icon: MessageSquare, label: 'SMS' },
            { value: 'email', icon: Mail, label: 'Email' },
            { value: 'both', icon: Send, label: 'Both' },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setSendMethod(value as typeof sendMethod)}
              className={`p-3 rounded-xl border transition-colors flex flex-col items-center gap-2 ${
                sendMethod === value
                  ? 'bg-red/20 border-red text-white'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSend}
        disabled={loading || !pickupLocation || getCalculatedPrice() === 0}
        className="w-full bg-red hover:bg-red-dark disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold text-lg py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="w-6 h-6" />
            {sendMethod === 'link' ? 'Generate Link' : 'Send Booking Link'}
            {getCalculatedPrice() > 0 && ` - ${formatPrice(getCalculatedPrice())}`}
          </>
        )}
      </button>
    </div>
  )
}
