'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ISSUE_TYPES, 
  type IssueType,
  VALIDATION 
} from '@/lib/eek-data-schema'
import { Phone, MapPin, Car, User, CreditCard, ArrowRight, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

interface BookingFormData {
  customerName: string
  customerPhone: string
  customerEmail: string
  pickupLocation: string
  dropoffLocation: string
  vehicleRego: string
  vehicleMake: string
  vehicleModel: string
  vehicleColor: string
  issueType: IssueType
  description: string
}

export default function BookServicePage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupLocation: '',
    dropoffLocation: '',
    vehicleRego: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    issueType: 'Breakdown',
    description: ''
  })

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({})

  const updateField = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const validateStep1 = () => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {}
    
    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required'
    }
    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone is required'
    } else if (!VALIDATION.isValidPhone(formData.customerPhone)) {
      newErrors.customerPhone = 'Please enter a valid phone number'
    }
    if (formData.customerEmail && !VALIDATION.isValidEmail(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {}
    
    if (!formData.pickupLocation.trim()) {
      newErrors.pickupLocation = 'Pickup location is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const submitBooking = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/book-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      // If we got a Stripe payment link, redirect to it
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        // Otherwise go to thanks page with booking ID
        router.push(`/thanks?booking=${data.bookingId}&value=${data.value || 0}`)
      }

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please call us directly at 0800 769 000')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/">
              <Logo />
            </Link>
            <a 
              href="tel:0800769000" 
              className="flex items-center gap-2 text-red hover:text-white transition-colors font-semibold"
            >
              <Phone className="w-4 h-4" />
              0800 769 000
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Book Your <span className="text-red">Service</span>
          </h1>
          <p className="text-zinc-400">
            Fill out the form below and we&apos;ll get you sorted
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-10">
          {[
            { num: 1, label: 'You' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Vehicle' },
            { num: 4, label: 'Pay' }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all
                  ${step >= s.num ? 'bg-red text-white shadow-lg shadow-red/30' : 'bg-zinc-800 text-zinc-500'}
                `}>
                  {s.num}
                </div>
                <span className={`text-xs mt-1 ${step >= s.num ? 'text-white' : 'text-zinc-600'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 rounded transition-all ${step > s.num ? 'bg-red' : 'bg-zinc-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red/10 border border-red/30 text-red px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Step 1: Customer Details */}
        {step === 1 && (
          <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 sm:p-8 border border-zinc-800/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-red" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Your Details</h2>
                <p className="text-zinc-500 text-sm">So we can contact you</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red transition-all ${
                    errors.customerName ? 'border-red' : 'border-zinc-700/50'
                  }`}
                  placeholder="Enter your name"
                />
                {errors.customerName && (
                  <p className="text-red text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.customerName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number <span className="text-red">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => updateField('customerPhone', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red transition-all ${
                    errors.customerPhone ? 'border-red' : 'border-zinc-700/50'
                  }`}
                  placeholder="021 123 4567"
                />
                {errors.customerPhone && (
                  <p className="text-red text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.customerPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email <span className="text-zinc-500">(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red transition-all ${
                    errors.customerEmail ? 'border-red' : 'border-zinc-700/50'
                  }`}
                  placeholder="email@example.com"
                />
                {errors.customerEmail && (
                  <p className="text-red text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.customerEmail}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={nextStep}
                className="bg-red hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red/20"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 sm:p-8 border border-zinc-800/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6 text-red" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Location</h2>
                <p className="text-zinc-500 text-sm">Where are you?</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Pickup Location <span className="text-red">*</span>
                </label>
                <textarea
                  value={formData.pickupLocation}
                  onChange={(e) => updateField('pickupLocation', e.target.value)}
                  className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red transition-all resize-none ${
                    errors.pickupLocation ? 'border-red' : 'border-zinc-700/50'
                  }`}
                  rows={3}
                  placeholder="Street address, landmark, or describe where you are"
                />
                {errors.pickupLocation && (
                  <p className="text-red text-sm mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.pickupLocation}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Drop-off Location <span className="text-zinc-500">(optional)</span>
                </label>
                <textarea
                  value={formData.dropoffLocation}
                  onChange={(e) => updateField('dropoffLocation', e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red transition-all resize-none"
                  rows={2}
                  placeholder="Where should we take your vehicle?"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={nextStep}
                className="bg-red hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red/20"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Vehicle & Issue */}
        {step === 3 && (
          <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 sm:p-8 border border-zinc-800/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-red" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Vehicle & Issue</h2>
                <p className="text-zinc-500 text-sm">What&apos;s the problem?</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-3">What&apos;s happened?</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ISSUE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateField('issueType', type)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        formData.issueType === type
                          ? 'bg-red text-white shadow-lg shadow-red/30'
                          : 'bg-zinc-800/70 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rego</label>
                  <input
                    type="text"
                    value={formData.vehicleRego}
                    onChange={(e) => updateField('vehicleRego', e.target.value.toUpperCase())}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red uppercase"
                    placeholder="ABC123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Make</label>
                  <input
                    type="text"
                    value={formData.vehicleMake}
                    onChange={(e) => updateField('vehicleMake', e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red"
                    placeholder="Toyota"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Model</label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => updateField('vehicleModel', e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red"
                    placeholder="Hilux"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Colour</label>
                  <input
                    type="text"
                    value={formData.vehicleColor}
                    onChange={(e) => updateField('vehicleColor', e.target.value)}
                    className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red"
                    placeholder="White"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Additional Notes</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 focus:border-red resize-none"
                  rows={3}
                  placeholder="Anything else we should know?"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={nextStep}
                className="bg-red hover:bg-red-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red/20"
              >
                Review & Pay
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Pay */}
        {step === 4 && (
          <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 sm:p-8 border border-zinc-800/50 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">Review & Pay</h2>
                <p className="text-zinc-500 text-sm">Confirm your booking details</p>
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-zinc-800/50 rounded-xl p-5 mb-6 space-y-4">
              <div className="flex justify-between items-start border-b border-zinc-700/50 pb-4">
                <div>
                  <p className="text-zinc-500 text-sm">Customer</p>
                  <p className="font-medium">{formData.customerName}</p>
                  <p className="text-zinc-400 text-sm">{formData.customerPhone}</p>
                  {formData.customerEmail && (
                    <p className="text-zinc-400 text-sm">{formData.customerEmail}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-sm">Issue</p>
                  <p className="font-medium text-red">{formData.issueType}</p>
                </div>
              </div>

              <div className="border-b border-zinc-700/50 pb-4">
                <p className="text-zinc-500 text-sm mb-1">Pickup Location</p>
                <p className="font-medium">{formData.pickupLocation}</p>
                {formData.dropoffLocation && (
                  <>
                    <p className="text-zinc-500 text-sm mt-3 mb-1">Drop-off</p>
                    <p className="font-medium">{formData.dropoffLocation}</p>
                  </>
                )}
              </div>

              {(formData.vehicleRego || formData.vehicleMake) && (
                <div>
                  <p className="text-zinc-500 text-sm mb-1">Vehicle</p>
                  <p className="font-medium">
                    {[formData.vehicleColor, formData.vehicleMake, formData.vehicleModel].filter(Boolean).join(' ')}
                    {formData.vehicleRego && <span className="text-zinc-400 ml-2">({formData.vehicleRego})</span>}
                  </p>
                </div>
              )}

              {formData.description && (
                <div className="pt-2">
                  <p className="text-zinc-500 text-sm mb-1">Notes</p>
                  <p className="text-zinc-300 text-sm">{formData.description}</p>
                </div>
              )}
            </div>

            {/* Price info */}
            <div className="bg-gradient-to-r from-red/10 to-transparent border border-red/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-zinc-300">
                <span className="font-semibold text-white">Payment:</span> You&apos;ll be redirected to our secure payment page. 
                Final price will be confirmed based on your location and service requirements.
              </p>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={loading}
                className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={submitBooking}
                disabled={loading}
                className="bg-red hover:bg-red-600 text-white font-semibold px-10 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red/30 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Book & Pay
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Help text */}
        <p className="text-center text-zinc-500 text-sm mt-8">
          Need immediate help? Call us at{' '}
          <a href="tel:0800769000" className="text-red hover:text-white transition-colors font-semibold">
            0800 769 000
          </a>
        </p>
      </main>

      <Footer />
    </div>
  )
}
