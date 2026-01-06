'use client'

import { useState } from 'react'
import { 
  ISSUE_TYPES, 
  JOB_PRIORITY, 
  type BookingFormData, 
  type IssueType, 
  type JobPriority,
  VALIDATION 
} from '@/lib/eek-data-schema'
import { Phone, MapPin, Car, User, FileText, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  user: { email: string; name: string; role: string } | null
}

export default function BookingForm({ user }: Props) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
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
    description: '',
    priority: 'Normal'
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
      newErrors.customerPhone = 'Invalid phone number'
    }
    if (formData.customerEmail && !VALIDATION.isValidEmail(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email'
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
      // Use internal booking API
      const response = await fetch('/api/book-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          submittedBy: user?.email || 'unknown',
          submittedAt: new Date().toISOString()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create booking')
      }

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create booking')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
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
      description: '',
      priority: 'Normal'
    })
    setStep(1)
    setSuccess(false)
    setError(null)
    setErrors({})
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Job Booked</h2>
        <p className="text-zinc-400 mb-8">
          The booking has been created and sent to dispatch.
        </p>
        <button
          onClick={resetForm}
          className="bg-red hover:bg-red-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          Book Another Job
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
              ${step >= s ? 'bg-red text-white' : 'bg-zinc-800 text-zinc-500'}
            `}>
              {s}
            </div>
            {s < 4 && (
              <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${step > s ? 'bg-red' : 'bg-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Step 1: Customer */}
      {step === 1 && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Customer Details</h2>
              <p className="text-zinc-500 text-sm">Who needs the tow?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => updateField('customerName', e.target.value)}
                className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red ${
                  errors.customerName ? 'border-red' : 'border-zinc-700'
                }`}
                placeholder="Customer name"
              />
              {errors.customerName && (
                <p className="text-red text-sm mt-1">{errors.customerName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone <span className="text-red">*</span>
              </label>
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red ${
                  errors.customerPhone ? 'border-red' : 'border-zinc-700'
                }`}
                placeholder="021 123 4567"
              />
              {errors.customerPhone && (
                <p className="text-red text-sm mt-1">{errors.customerPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => updateField('customerEmail', e.target.value)}
                className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red ${
                  errors.customerEmail ? 'border-red' : 'border-zinc-700'
                }`}
                placeholder="email@example.com"
              />
              {errors.customerEmail && (
                <p className="text-red text-sm mt-1">{errors.customerEmail}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={nextStep}
              className="bg-red hover:bg-red-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Location */}
      {step === 2 && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
              <MapPin className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Location</h2>
              <p className="text-zinc-500 text-sm">Where is the vehicle?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Pickup Location <span className="text-red">*</span>
              </label>
              <textarea
                value={formData.pickupLocation}
                onChange={(e) => updateField('pickupLocation', e.target.value)}
                className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red ${
                  errors.pickupLocation ? 'border-red' : 'border-zinc-700'
                }`}
                rows={2}
                placeholder="Street address or description"
              />
              {errors.pickupLocation && (
                <p className="text-red text-sm mt-1">{errors.pickupLocation}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Drop-off Location</label>
              <textarea
                value={formData.dropoffLocation}
                onChange={(e) => updateField('dropoffLocation', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                rows={2}
                placeholder="Where should we take the vehicle?"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-red hover:bg-red-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Vehicle & Issue */}
      {step === 3 && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Vehicle & Issue</h2>
              <p className="text-zinc-500 text-sm">What&apos;s the problem?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Issue Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ISSUE_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => updateField('issueType', type)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.issueType === type
                        ? 'bg-red text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="flex gap-2">
                {JOB_PRIORITY.map((priority) => (
                  <button
                    key={priority}
                    onClick={() => updateField('priority', priority)}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      formData.priority === priority
                        ? priority === 'Urgent' ? 'bg-orange-500 text-white' : 'bg-red text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Rego</label>
                <input
                  type="text"
                  value={formData.vehicleRego}
                  onChange={(e) => updateField('vehicleRego', e.target.value.toUpperCase())}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red uppercase"
                  placeholder="ABC123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Make</label>
                <input
                  type="text"
                  value={formData.vehicleMake}
                  onChange={(e) => updateField('vehicleMake', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                  placeholder="Toyota"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Model</label>
                <input
                  type="text"
                  value={formData.vehicleModel}
                  onChange={(e) => updateField('vehicleModel', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                  placeholder="Hilux"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Color</label>
                <input
                  type="text"
                  value={formData.vehicleColor}
                  onChange={(e) => updateField('vehicleColor', e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                  placeholder="White"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              className="bg-red hover:bg-red-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Notes & Submit */}
      {step === 4 && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Additional Notes</h2>
              <p className="text-zinc-500 text-sm">Anything else we should know?</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Notes</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                rows={4}
                placeholder="Any additional details..."
              />
            </div>

            {/* Summary */}
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <h3 className="font-semibold mb-3">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-zinc-500">Customer:</span>
                  <span className="ml-2">{formData.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Phone:</span>
                  <span className="ml-2">{formData.customerPhone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-zinc-500">Pickup:</span>
                  <span className="ml-2">{formData.pickupLocation}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Issue:</span>
                  <span className="ml-2">{formData.issueType}</span>
                </div>
                <div>
                  <span className="text-zinc-500">Priority:</span>
                  <span className={`ml-2 ${formData.priority === 'Urgent' ? 'text-orange-500' : ''}`}>
                    {formData.priority}
                  </span>
                </div>
                {formData.vehicleRego && (
                  <div>
                    <span className="text-zinc-500">Vehicle:</span>
                    <span className="ml-2">{formData.vehicleRego} {formData.vehicleMake} {formData.vehicleModel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={prevStep}
              className="text-zinc-400 hover:text-white font-medium px-6 py-3 transition-colors"
            >
              Back
            </button>
            <button
              onClick={submitBooking}
              disabled={loading}
              className="bg-red hover:bg-red-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Book Job
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
