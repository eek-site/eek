'use client'

import { useState } from 'react'
import JobPicker from '@/components/JobPicker'
import SupplierPicker, { type SupplierData } from '@/components/SupplierPicker'
import { 
  Building2,
  DollarSign, 
  Send, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Link as LinkIcon,
  MessageSquare,
  Mail,
  Loader2,
  FileText,
  Truck,
  MapPin,
  User,
  Phone,
  Car,
  Plus,
  CreditCard
} from 'lucide-react'

interface Props {
  user: { email: string; name: string; role: string } | null
}

interface JobData {
  rego: string
  bookingId: string
  pickupLocation: string
  dropoffLocation: string
  customerName: string
  customerPhone: string
  customerEmail: string
  price: number // Original price paid by customer (cents)
  eta: string
  issueType: string
  description: string
  vehicleMake: string
  vehicleModel: string
  vehicleColor: string
  // Supplier from booking (start location = towing company)
  supplierName?: string
  supplierAddress?: string
  supplierCoords?: { lat: number; lng: number }
}

export default function SupplierBookingForm({ user }: Props) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [sendResults, setSendResults] = useState<{ sms: boolean; email: boolean } | null>(null)
  
  // Job lookup
  const [regoSearch, setRegoSearch] = useState('')
  const [jobFound, setJobFound] = useState(false)
  const [originalJobData, setOriginalJobData] = useState<JobData | null>(null) // Keep original for price comparison
  
  // Editable job details (auto-filled from selected job)
  const [formData, setFormData] = useState({
    rego: '',
    bookingId: '',
    pickupLocation: '',
    dropoffLocation: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    eta: '',
    issueType: '',
    description: ''
  })
  
  // Supplier data
  const [supplierData, setSupplierData] = useState<SupplierData>({
    name: '',
    phone: '',
    phoneLandline: false,
    mobile: '',
    email: '',
    address: ''
  })
  const [isExistingSupplier, setIsExistingSupplier] = useState(false)
  
  // Pricing
  const [supplierPrice, setSupplierPrice] = useState('')
  const [additionalCharge, setAdditionalCharge] = useState('') // Extra charge for customer
  const [sendAdditionalPaymentLink, setSendAdditionalPaymentLink] = useState(false)
  const [notes, setNotes] = useState('')
  
  // Send method
  const [sendMethod, setSendMethod] = useState<'link' | 'sms' | 'email' | 'both'>('both')
  
  // Calculate prices
  const originalPriceCents = originalJobData?.price || 0
  const additionalChargeCents = (parseInt(additionalCharge) || 0) * 100
  const newTotalCents = originalPriceCents + additionalChargeCents

  // Generate short link for supplier portal
  const generateSupplierLink = () => {
    if (!originalJobData || !supplierData.name) {
      setError('Please lookup a job and select a supplier first')
      return
    }
    
    // Create short supplier job reference: SJ-{random}
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let ref = 'SJ-'
    for (let i = 0; i < 8; i++) {
      ref += chars[Math.floor(Math.random() * chars.length)]
    }
    
    // Store supplier job data for lookup
    setSupplierJobRef(ref)
    
    const link = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.eek.co.nz'}/supplier/${ref}`
    
    setGeneratedLink(link)
    return { link, ref }
  }
  
  const [supplierJobRef, setSupplierJobRef] = useState<string | null>(null)

  // Send to supplier
  const handleSend = async () => {
    if (!originalJobData || !supplierData.name) {
      setError('Please lookup a job and select a supplier first')
      return
    }
    
    // Validate contact details based on send method
    if (sendMethod === 'sms' || sendMethod === 'both') {
      const smsPhone = supplierData.phoneLandline && supplierData.mobile 
        ? supplierData.mobile 
        : supplierData.phone
      if (!smsPhone) {
        setError('Supplier phone number required for SMS. Re-select supplier from search to fetch phone from Google.')
        return
      }
    }
    if (sendMethod === 'email' || sendMethod === 'both') {
      if (!supplierData.email) {
        setError('Supplier email required for email. Add email address below.')
        return
      }
    }
    if (sendMethod !== 'link' && !supplierData.phone && !supplierData.email) {
      setError('Supplier phone or email required for sending')
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(false)
    
    try {
      const result = generateSupplierLink()
      if (!result) return
      
      const { link, ref } = result
      
      // Save supplier data
      await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supplierData.name,
          phone: supplierData.phone,
          phoneLandline: supplierData.phoneLandline,
          mobile: supplierData.mobile,
          email: supplierData.email,
          address: supplierData.address,
          coords: supplierData.coords
        })
      })
      
      // Save supplier job data for short link lookup (use edited form data)
      await fetch('/api/supplier-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          rego: formData.rego,
          bookingId: formData.bookingId,
          supplierName: supplierData.name,
          supplierPhone: supplierData.phone,
          supplierEmail: supplierData.email,
          pickup: formData.pickupLocation,
          dropoff: formData.dropoffLocation,
          price: parseInt(supplierPrice) * 100 || 0,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleColor: formData.vehicleColor,
          notes: notes,
          createdAt: new Date().toISOString(),
          createdBy: user?.email || 'admin'
        })
      })
      
      // Link job to supplier (update job record with edited form data)
      await fetch('/api/jobs/assign-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rego: originalJobData.rego, // Use original rego for lookup
          bookingId: formData.bookingId,
          supplierName: supplierData.name,
          supplierPrice: parseInt(supplierPrice) * 100 || 0,
          notes: notes,
          // Pass updated form data to update job
          updatedData: {
            rego: formData.rego,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            pickupLocation: formData.pickupLocation,
            dropoffLocation: formData.dropoffLocation,
            vehicleMake: formData.vehicleMake,
            vehicleModel: formData.vehicleModel,
            vehicleColor: formData.vehicleColor
          }
        })
      })
      
      // Send additional payment link to customer if needed
      if (sendAdditionalPaymentLink && additionalChargeCents > 0) {
        await fetch('/api/send-booking-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerPhone: formData.customerPhone,
            customerEmail: formData.customerEmail,
            customerName: formData.customerName,
            rego: formData.rego,
            pickup: formData.pickupLocation,
            dropoff: formData.dropoffLocation,
            price: additionalChargeCents,
            eta: '30 mins',
            isAdditionalCharge: true, // Flag to indicate this is an additional charge
            originalBookingId: formData.bookingId,
            message: `Additional charge for your tow: $${additionalCharge}. Your original payment of $${(originalPriceCents / 100).toFixed(2)} has been received.`
          })
        })
      }
      
      // Send notification if not just generating link
      if (sendMethod !== 'link') {
        // Use mobile number for SMS if landline is checked
        const smsPhone = supplierData.phoneLandline && supplierData.mobile 
          ? supplierData.mobile 
          : supplierData.phone
        
        const response = await fetch('/api/send-supplier-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierName: supplierData.name,
            supplierPhone: smsPhone,
            supplierEmail: supplierData.email,
            supplierAddress: supplierData.address,
            link: link,
            rego: formData.rego,
            pickup: formData.pickupLocation,
            dropoff: formData.dropoffLocation,
            price: supplierPrice,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            method: sendMethod
          })
        })
        
        const sendResult = await response.json()
        console.log('📤 Send result:', sendResult)
        
        if (!sendResult.success) {
          throw new Error(sendResult.error || 'Failed to send')
        }
        
        // Track what was actually sent
        setSendResults(sendResult.results || { sms: false, email: false })
      } else {
        setSendResults(null)
      }
      
      setSuccess(true)
    } catch (e) {
      console.error('Send error:', e)
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Book Supplier</h2>
            <p className="text-zinc-500 text-sm">Assign job to a towing company</p>
          </div>
        </div>

        {/* Step 1: Find Job */}
        <div className="mb-6">
          <JobPicker
            label="Step 1: Select Job"
            required
            value={regoSearch}
            onChange={async (rego, job) => {
              setRegoSearch(rego)
              if (job) {
                // Store original job data for price reference
                const jobDataObj: JobData = {
                  rego: job.rego,
                  bookingId: job.bookingId || '',
                  pickupLocation: job.pickupLocation,
                  dropoffLocation: job.dropoffLocation || '',
                  customerName: job.customerName || '',
                  customerPhone: job.customerPhone || '',
                  customerEmail: job.customerEmail || '',
                  price: job.price,
                  eta: '',
                  issueType: '',
                  description: '',
                  vehicleMake: job.vehicleMake || '',
                  vehicleModel: job.vehicleModel || '',
                  vehicleColor: job.vehicleColor || '',
                  supplierName: job.supplierName,
                  supplierAddress: job.supplierAddress,
                  supplierCoords: job.supplierCoords
                }
                setOriginalJobData(jobDataObj)
                
                // Auto-fill editable form fields
                setFormData({
                  rego: job.rego,
                  bookingId: job.bookingId || '',
                  pickupLocation: job.pickupLocation,
                  dropoffLocation: job.dropoffLocation || '',
                  customerName: job.customerName || '',
                  customerPhone: job.customerPhone || '',
                  customerEmail: job.customerEmail || '',
                  vehicleMake: job.vehicleMake || '',
                  vehicleModel: job.vehicleModel || '',
                  vehicleColor: job.vehicleColor || '',
                  eta: '',
                  issueType: '',
                  description: ''
                })
                
                setJobFound(true)
                
                // Reset pricing
                setAdditionalCharge('')
                setSendAdditionalPaymentLink(false)
                
                // Auto-populate supplier if job already has supplier data
                if (job.supplierName) {
                  if (!job.supplierPhone) {
                    const sanitizedName = job.supplierName
                      .replace(/[''`]/g, "'")
                      .replace(/[^\w\s\-&']/g, '')
                      .trim()
                    
                    try {
                      const res = await fetch(`/api/suppliers/${encodeURIComponent(sanitizedName)}`)
                      const data = await res.json()
                      if (data.success && data.supplier) {
                        setSupplierData({
                          name: data.supplier.name || job.supplierName,
                          phone: data.supplier.phone || '',
                          phoneLandline: data.supplier.phoneLandline || false,
                          mobile: data.supplier.mobile || '',
                          email: data.supplier.email || '',
                          address: data.supplier.address || job.supplierAddress || '',
                          coords: data.supplier.coords || job.supplierCoords
                        })
                        setIsExistingSupplier(true)
                        return
                      }
                    } catch (e) {
                      console.error('Failed to fetch supplier from database:', e)
                    }
                  }
                  
                  setSupplierData({
                    name: job.supplierName,
                    phone: job.supplierPhone || '',
                    phoneLandline: job.supplierPhoneLandline || false,
                    mobile: job.supplierMobile || '',
                    email: job.supplierEmail || '',
                    address: job.supplierAddress || '',
                    coords: job.supplierCoords
                  })
                  setIsExistingSupplier(true)
                }
              } else {
                setJobFound(false)
                setOriginalJobData(null)
                setFormData({
                  rego: '',
                  bookingId: '',
                  pickupLocation: '',
                  dropoffLocation: '',
                  customerName: '',
                  customerPhone: '',
                  customerEmail: '',
                  vehicleMake: '',
                  vehicleModel: '',
                  vehicleColor: '',
                  eta: '',
                  issueType: '',
                  description: ''
                })
                setSupplierData({
                  name: '',
                  phone: '',
                  phoneLandline: false,
                  mobile: '',
                  email: '',
                  address: ''
                })
                setIsExistingSupplier(false)
                setAdditionalCharge('')
                setSendAdditionalPaymentLink(false)
              }
            }}
            placeholder="Search or select a job to allocate..."
            statusFilter={['booked', 'assigned']}
          />
        </div>
        
        {/* Step 2: Job Details (Editable) */}
        {jobFound && originalJobData && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-green-500 mb-4">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Job Selected - Edit details if needed</span>
            </div>
            
            {/* Current Supplier Warning (for reallocation) */}
            {originalJobData.supplierName && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-yellow-500 mb-2">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium text-sm">Reallocation - Job Already Assigned</span>
                </div>
                <p className="text-sm text-zinc-400">
                  Currently assigned to: <span className="text-white font-medium">{originalJobData.supplierName}</span>
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Select a new supplier below to reallocate this job.
                </p>
              </div>
            )}
            
            {/* Customer Info */}
            <div className="bg-zinc-800/30 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                    <input
                      type="text"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-8 pr-3 py-2 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-zinc-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Vehicle Info */}
            <div className="bg-zinc-800/30 rounded-xl p-4 mb-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Vehicle Details
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Rego</label>
                  <input
                    type="text"
                    value={formData.rego}
                    onChange={(e) => setFormData({...formData, rego: e.target.value.toUpperCase()})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Make</label>
                  <input
                    type="text"
                    value={formData.vehicleMake}
                    onChange={(e) => setFormData({...formData, vehicleMake: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Model</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({...formData, vehicleModel: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.vehicleColor}
                    onChange={(e) => setFormData({...formData, vehicleColor: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Location Info */}
            <div className="bg-zinc-800/30 rounded-xl p-4">
              <h3 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Locations
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    value={formData.pickupLocation}
                    onChange={(e) => setFormData({...formData, pickupLocation: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Dropoff Location</label>
                  <input
                    type="text"
                    value={formData.dropoffLocation}
                    onChange={(e) => setFormData({...formData, dropoffLocation: e.target.value})}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Supplier */}
        {jobFound && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Step 3: Confirm Supplier 
              {originalJobData?.supplierName && (
                <span className="ml-2 text-xs text-green-500 font-normal">(Pre-filled from booking)</span>
              )}
              <span className="text-red ml-1">*</span>
            </label>
            <SupplierPicker
              value={supplierData}
              onChange={(supplier) => setSupplierData(supplier)}
              onSupplierLoaded={(isExisting) => setIsExistingSupplier(isExisting)}
            />
            {isExistingSupplier && supplierData.name && (
              <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Existing supplier - details loaded from database
              </div>
            )}
          </div>
        )}

        {/* Step 4: Pricing */}
        {jobFound && supplierData.name && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Step 4: Pricing
            </label>
            
            {/* Customer Price Summary */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Customer Payment
              </h4>
              
              {/* Already Paid - Large Display */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-4 text-center">
                <span className="text-green-400 text-xs font-medium block mb-1">Customer Already Paid</span>
                <span className="text-green-400 font-bold text-3xl">${(originalPriceCents / 100).toFixed(2)}</span>
              </div>
              
              {/* Price Adjustment Options */}
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  <strong className="text-zinc-300">Price can only stay the same or increase.</strong> Never decrease - customer has already paid.
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalCharge('')
                      setSendAdditionalPaymentLink(false)
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      !additionalCharge || additionalCharge === '0'
                        ? 'bg-green-500/20 border-green-500 text-green-400'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 mx-auto mb-1 ${!additionalCharge || additionalCharge === '0' ? 'text-green-400' : 'text-zinc-500'}`} />
                    <span className="text-sm font-medium block">Keep Same Price</span>
                    <span className="text-xs opacity-75">${(originalPriceCents / 100).toFixed(2)}</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setAdditionalCharge('')
                      // Focus the input
                      const input = document.getElementById('additional-charge-input')
                      if (input) input.focus()
                    }}
                    className={`p-3 rounded-lg border text-center transition-colors ${
                      additionalCharge && parseInt(additionalCharge) > 0
                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                  >
                    <Plus className={`w-5 h-5 mx-auto mb-1 ${additionalCharge && parseInt(additionalCharge) > 0 ? 'text-orange-400' : 'text-zinc-500'}`} />
                    <span className="text-sm font-medium block">Add Charge</span>
                    <span className="text-xs opacity-75">Increase price</span>
                  </button>
                </div>
                
                {/* Additional Charge Input - Only show when "Add Charge" is implied */}
                <div className="pt-2">
                  <label className="block text-xs text-zinc-500 mb-1">Additional Charge ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      id="additional-charge-input"
                      type="number"
                      min="0"
                      value={additionalCharge}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val === '' || parseInt(val) >= 0) {
                          setAdditionalCharge(val)
                          if (val && parseInt(val) > 0) {
                            setSendAdditionalPaymentLink(true)
                          } else {
                            setSendAdditionalPaymentLink(false)
                          }
                        }
                      }}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg pl-9 pr-3 py-3 text-white text-lg font-bold"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                {/* New Total */}
                {additionalChargeCents > 0 && (
                  <div className="bg-zinc-800/30 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-zinc-400 text-sm">New Customer Total:</span>
                    <span className="text-orange-400 font-bold text-xl">${(newTotalCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {/* Additional Payment Link Option */}
              {additionalChargeCents > 0 && (
                <div className="mt-4 pt-3 border-t border-blue-500/20">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAdditionalPaymentLink}
                      onChange={(e) => setSendAdditionalPaymentLink(e.target.checked)}
                      className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-red focus:ring-red"
                    />
                    <span className="text-sm text-zinc-300">
                      Send additional payment link to customer (${additionalCharge})
                    </span>
                  </label>
                  <p className="text-xs text-zinc-500 mt-1 ml-7">
                    Customer will receive SMS/email with link to pay the extra ${additionalCharge}
                  </p>
                </div>
              )}
            </div>
            
            {/* Supplier Payment */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Supplier Payment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Pay Supplier ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="number"
                      value={supplierPrice}
                      onChange={(e) => setSupplierPrice(e.target.value)}
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-9 pr-4 py-3 text-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Our Margin</label>
                  <div className={`bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 font-medium ${
                    ((newTotalCents / 100) - (parseInt(supplierPrice) || 0)) >= 0 ? 'text-green-500' : 'text-red'
                  }`}>
                    ${((newTotalCents / 100) - (parseInt(supplierPrice) || 0)).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-xs text-zinc-500 mb-1">Notes for Supplier</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 resize-none"
                rows={3}
                placeholder="Any special instructions for the tow operator..."
              />
            </div>
          </div>
        )}

        {/* Step 5: Send Method */}
        {jobFound && supplierData.name && (
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Step 5: How to Send
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'link', label: 'Link Only', icon: LinkIcon },
                { id: 'sms', label: 'SMS', icon: MessageSquare },
                { id: 'email', label: 'Email', icon: Mail },
                { id: 'both', label: 'Both', icon: Send },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSendMethod(method.id as typeof sendMethod)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-colors ${
                    sendMethod === method.id
                      ? 'bg-red text-white border-red'
                      : 'bg-zinc-800/50 border-zinc-700/50 hover:border-zinc-600'
                  }`}
                >
                  <method.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red bg-red/10 px-4 py-3 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-500/10 px-4 py-3 rounded-xl">
            <div className="flex items-center gap-2 text-green-500 mb-1">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">
                {sendMethod === 'link' ? 'Link generated!' : 'Sent to supplier!'}
              </span>
            </div>
            {sendResults && sendMethod !== 'link' && (
              <div className="text-sm text-zinc-400 ml-7">
                {sendResults.sms && <span className="text-green-400">✓ SMS sent</span>}
                {!sendResults.sms && (sendMethod === 'sms' || sendMethod === 'both') && (
                  <span className="text-yellow-400">⚠ SMS not sent (no phone)</span>
                )}
                {sendResults.sms && sendResults.email && ' • '}
                {sendResults.email && <span className="text-green-400">✓ Email sent</span>}
                {!sendResults.email && (sendMethod === 'email' || sendMethod === 'both') && (
                  <span className="text-yellow-400">⚠ Email not sent (no email)</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generated Link */}
        {generatedLink && (
          <div className="mb-6 bg-zinc-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Supplier Portal Link</span>
              <button
                onClick={copyLink}
                className="flex items-center gap-1 text-sm text-red hover:text-red/80"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-zinc-900 rounded-lg p-3 text-xs text-zinc-400 break-all font-mono">
              {generatedLink}
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Supplier can use this link to view job, discuss, provide bank details, and upload invoice.
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={loading || !jobFound || !supplierData.name}
          className="w-full bg-red hover:bg-red/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Truck className="w-5 h-5" />
              {sendMethod === 'link' ? 'Generate Supplier Link' : 'Send to Supplier'}
            </>
          )}
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
        <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-zinc-500" />
          Supplier Portal Features
        </h3>
        <ul className="text-zinc-500 text-xs space-y-1">
          <li>• View job details and pickup/dropoff locations</li>
          <li>• Discuss job via secure message thread</li>
          <li>• Provide bank account for payment</li>
          <li>• Upload invoice after job completion</li>
          <li>• All updates saved to job record automatically</li>
        </ul>
      </div>
    </div>
  )
}
