'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { 
  decodeBookingData, 
  formatPrice, 
  isBookingExpired, 
  isBookingCompleted,
  getPaymentSession,
  savePaymentSession,
  markBookingCompleted,
  type BookingData 
} from '@/lib/booking-utils'
import { 
  ISSUE_TYPES, 
  TOW_PURPOSES,
  VEHICLE_CONDITIONS,
  type IssueType, 
  type TowPurpose,
  type VehicleCondition,
  VALIDATION 
} from '@/lib/eek-data-schema'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import AddressPicker from '@/components/AddressPicker'
import { 
  Phone, 
  MapPin, 
  Car, 
  User, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  Loader2,
  CheckCircle,
  Lock,
  Shield,
  Mail,
  Users,
  Heart,
  PawPrint,
  Key,
  FileText,
  ChevronDown,
  Plus,
  X,
  AlertTriangle,
  Info,
  Check,
  ArrowRight
} from 'lucide-react'

// Initialize Stripe - use your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51PJiwvGvSuDmIG1i3JmXdGwOFoMRFHh5BkN3C8VWWDTiB9fNUmWHhSfvwR8K0HHwOxDxWgHzVfMlVkK3MQnQYJ9I00RfGBvtVZ')

// Type definitions
type Step = 'basic' | 'payment' | 'extended' | 'completing'

interface BasicData {
  customerName: string
  customerPhone: string
  customerEmail: string
  vehicleRego: string
}

interface LocationData {
  pickup: string
  pickupCoords?: { lat: number; lng: number }
  dropoff: string
  dropoffCoords?: { lat: number; lng: number }
  pickupConfirmed: boolean
  dropoffConfirmed: boolean
}

interface VehicleData {
  make: string
  model: string
  color: string
  year: string
  vin: string
  fuel: string
  cc: string
  transmission: string
  body: string
  seats: string
  wofExpiry: string
  regoExpiry: string
}

interface ExtendedData {
  vehicleCondition: VehicleCondition
  towPurpose: TowPurpose
  keysAvailable: boolean
  wheelsRoll: boolean
  isModified: boolean
  modificationNotes: string
  passengerCount: number
  passengerNames: string[]
  hasHealthConcerns: boolean
  healthNotes: string
  hasPets: boolean
  petDetails: string
  specialInstructions: string
  ownershipConfirmed: boolean
  termsAccepted: boolean
}

// Payment Form Component
function PaymentForm({ 
  bookingData, 
  basicData,
  vehicleData,
  onSuccess 
}: { 
  bookingData: BookingData
  basicData: BasicData
  vehicleData: VehicleData
  onSuccess: (transactionId: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    // Update session to processing
    savePaymentSession({
      bookingId: bookingData.bookingId,
      status: 'processing',
      submittedAt: new Date().toISOString(),
      amount: bookingData.price
    })

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // We don't redirect - we stay on the same page for extended data
        return_url: `${window.location.origin}/pay-complete?booking=${bookingData.bookingId}`,
      },
      redirect: 'if_required'
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed. Please try again.')
      setProcessing(false)
      
      savePaymentSession({
        bookingId: bookingData.bookingId,
        status: 'failed',
        amount: bookingData.price
      })
      return
    }

    // Payment succeeded without redirect
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Save payment success to session
      savePaymentSession({
        bookingId: bookingData.bookingId,
        status: 'paid_pending_details',
        amount: bookingData.price,
        transactionId: paymentIntent.id
      })
      onSuccess(paymentIntent.id)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red/10 border border-red/30 text-red px-4 py-3 rounded-xl mb-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="bg-zinc-800/50 rounded-xl p-4 mb-6">
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-red hover:bg-red-600 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red/30 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {processing ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-6 h-6" />
            Pay {formatPrice(bookingData.price)}
          </>
        )}
      </button>
      
      <p className="text-center text-zinc-500 text-sm mt-4 flex items-center justify-center gap-2">
        <Lock className="w-4 h-4" />
        Secure payment powered by Stripe
      </p>
    </form>
  )
}

// Step Indicator Component
function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps = [
    { key: 'basic', label: 'Details', num: 1 },
    { key: 'payment', label: 'Payment', num: 2 },
    { key: 'extended', label: 'Final Info', num: 3 },
  ]
  
  const getCurrentIndex = () => {
    if (currentStep === 'basic') return 0
    if (currentStep === 'payment') return 1
    return 2
  }
  
  const currentIndex = getCurrentIndex()
  
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
            ${i < currentIndex ? 'bg-green-500 text-white' : ''}
            ${i === currentIndex ? 'bg-red text-white ring-4 ring-red/30' : ''}
            ${i > currentIndex ? 'bg-zinc-800 text-zinc-500' : ''}
          `}>
            {i < currentIndex ? <Check className="w-4 h-4" /> : step.num}
          </div>
          {i < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-1 ${i < currentIndex ? 'bg-green-500' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function PaymentPage() {
  const params = useParams()
  const code = params.code as string
  const router = useRouter()
  
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [alreadyPaid, setAlreadyPaid] = useState(false)
  
  // Current step
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  
  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const [creatingIntent, setCreatingIntent] = useState(false)
  const [transactionId, setTransactionId] = useState<string | null>(null)

  // Basic data
  const [basicData, setBasicData] = useState<BasicData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleRego: ''
  })
  
  // Location data - customer can confirm/update
  const [locationData, setLocationData] = useState<LocationData>({
    pickup: '',
    dropoff: '',
    pickupConfirmed: false,
    dropoffConfirmed: false
  })
  const [showLocationEdit, setShowLocationEdit] = useState(false)
  const [recalculatingPrice, setRecalculatingPrice] = useState(false)
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null)
  
  // Vehicle data from CarJam
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    make: '', model: '', color: '', year: '', vin: '', fuel: '',
    cc: '', transmission: '', body: '', seats: '', wofExpiry: '', regoExpiry: ''
  })
  
  // Extended data
  const [extendedData, setExtendedData] = useState<ExtendedData>({
    vehicleCondition: 'Unknown',
    towPurpose: 'Mechanical Repair',
    keysAvailable: true,
    wheelsRoll: true,
    isModified: false,
    modificationNotes: '',
    passengerCount: 0,
    passengerNames: [],
    hasHealthConcerns: false,
    healthNotes: '',
    hasPets: false,
    petDetails: '',
    specialInstructions: '',
    ownershipConfirmed: false,
    termsAccepted: false
  })
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // CarJam auto-lookup state
  const [lookingUpVehicle, setLookingUpVehicle] = useState(false)
  const [vehicleLookedUp, setVehicleLookedUp] = useState(false)
  const [vehicleConfirmed, setVehicleConfirmed] = useState(false)
  const [vehicleNotFound, setVehicleNotFound] = useState(false)

  // Auto-lookup vehicle from CarJam - captures ALL data
  const lookupVehicle = async (rego: string) => {
    if (rego.length < 5 || lookingUpVehicle) return
    
    setLookingUpVehicle(true)
    try {
      const response = await fetch(`/api/carjam?plate=${encodeURIComponent(rego)}`)
      const data = await response.json()
      
      if (data.success && data.make) {
        setVehicleData({
          make: data.make || '',
          model: data.model || '',
          color: data.colour || '',
          year: data.year || '',
          vin: data.vin || '',
          fuel: data.fuel || '',
          cc: data.cc || '',
          transmission: data.transmission || '',
          body: data.body || '',
          seats: data.seats || '',
          wofExpiry: data.wofExpiry || '',
          regoExpiry: data.regoExpiry || ''
        })
        setVehicleLookedUp(true)
        setVehicleNotFound(false)
        console.log('Vehicle data captured:', data)
      } else {
        // Vehicle not found - still mark as looked up but with no data
        setVehicleLookedUp(true)
        setVehicleNotFound(true)
        console.log('Vehicle not found:', rego)
      }
    } catch (e) {
      console.error('Vehicle lookup failed:', e)
      // On error, still allow proceeding - just no confirmation required
      setVehicleLookedUp(true)
      setVehicleNotFound(true)
    } finally {
      setLookingUpVehicle(false)
    }
  }

  // Auto-lookup when user types rego (with debounce)
  useEffect(() => {
    if (basicData.vehicleRego.length >= 5 && !vehicleLookedUp && !vehicleData.make) {
      const timer = setTimeout(() => lookupVehicle(basicData.vehicleRego), 800)
      return () => clearTimeout(timer)
    }
  }, [basicData.vehicleRego, vehicleLookedUp, vehicleData.make])

  // Scroll to vehicle authorization when entering extended step
  useEffect(() => {
    if (currentStep === 'extended') {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const element = document.getElementById('vehicle-authorization')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [currentStep])

  useEffect(() => {
    const loadBookingData = async () => {
      let data: BookingData | null = null
      
      // Check if code is a booking ID (like HT-MJWF3VU2-MFQ1)
      // vs a long base64 encoded string
      const isBookingId = code.startsWith('HT-') || (code.length <= 20 && /^[A-Za-z0-9-]+$/.test(code))
      
      if (isBookingId) {
        // Fetch from database by booking ID
        try {
          const response = await fetch(`/api/booking/${encodeURIComponent(code)}`)
          const result = await response.json()
          
          if (result.success && result.job) {
            const job = result.job
            data = {
              bookingId: job.bookingId || code,
              rego: job.rego,
              pickupLocation: job.pickupLocation,
              dropoffLocation: job.dropoffLocation,
              price: job.price,
              eta: job.eta || '30 mins',
              customerName: job.customerName,
              customerPhone: job.customerPhone,
              customerEmail: job.customerEmail,
              issueType: job.issueType,
              vehicleMake: job.vehicleMake,
              vehicleModel: job.vehicleModel,
              vehicleColor: job.vehicleColor,
              createdAt: job.createdAt,
              createdBy: job.createdBy || 'system',
              expiresAt: job.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            }
            
            // Check job status - prevent duplicate payments
            if (job.status === 'completed' || job.status === 'cancelled') {
              setError('This job has already been completed. Please call us at 0800 769 000 for assistance.')
              setLoading(false)
              return
            }
            
            // Check if payment has already been made (job is booked or has transactionId)
            if (job.status === 'booked' || job.status === 'assigned' || job.status === 'in_progress' || job.transactionId) {
              setAlreadyPaid(true)
              setLoading(false)
              return
            }
          }
        } catch (e) {
          console.error('Failed to fetch booking:', e)
        }
      }
      
      // Fall back to base64 decode for legacy links
      if (!data) {
        data = decodeBookingData(code)
      }
      
      if (!data) {
        setError('Invalid booking link. Please contact us at 0800 769 000.')
        setLoading(false)
        return
      }

      if (isBookingExpired(data.expiresAt)) {
        setError('This booking link has expired. Please call us at 0800 769 000 for assistance.')
        setLoading(false)
        return
      }

      if (isBookingCompleted(data.bookingId)) {
        setAlreadyPaid(true)
        setLoading(false)
        return
      }

      const session = getPaymentSession(data.bookingId)
      if (session && session.status === 'completed') {
        setAlreadyPaid(true)
        setLoading(false)
        return
      }
      
      // Check if we're in "paid but pending details" state
      if (session && session.status === 'paid_pending_details' && session.transactionId) {
        setTransactionId(session.transactionId)
        setCurrentStep('extended')
      }

      // Pre-fill form with any existing data
      setBookingData(data)
      setBasicData({
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        customerEmail: data.customerEmail || '',
        vehicleRego: data.rego || ''
      })
      
      // Set location data from booking
      setLocationData({
        pickup: data.pickupLocation || '',
        dropoff: data.dropoffLocation || '',
        pickupConfirmed: false,
        dropoffConfirmed: false
      })
      
      if (data.vehicleMake || data.vehicleModel || data.vehicleColor) {
        setVehicleData(prev => ({
          ...prev,
          make: data.vehicleMake || '',
          model: data.vehicleModel || '',
          color: data.vehicleColor || ''
        }))
      }

      savePaymentSession({
        bookingId: data.bookingId,
        status: 'pending',
        amount: data.price
      })

      setLoading(false)
      
      // Auto-lookup vehicle from CarJam if rego is present but vehicle details are missing
      if (data.rego && data.rego.length >= 5 && !data.vehicleMake && !data.vehicleModel) {
        setTimeout(() => lookupVehicle(data.rego!), 500)
      }
    }
    
    loadBookingData()
  }, [code])

  const validateBasicData = () => {
    const errors: Record<string, string> = {}

    if (!basicData.customerName.trim()) errors.customerName = 'Name is required'
    if (!basicData.customerPhone.trim()) {
      errors.customerPhone = 'Phone is required'
    } else if (!VALIDATION.isValidPhone(basicData.customerPhone)) {
      errors.customerPhone = 'Please enter a valid phone number'
    }
    if (!basicData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required'
    } else if (!VALIDATION.isValidEmail(basicData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email'
    }
    if (!basicData.vehicleRego.trim()) errors.vehicleRego = 'Rego is required'
    
    // If vehicle not found, require manual entry
    if (vehicleNotFound) {
      if (!vehicleData.make.trim()) errors.vehicleMake = 'Vehicle make is required'
      if (!vehicleData.model.trim()) errors.vehicleModel = 'Vehicle model is required'
      if (!vehicleData.color.trim()) errors.vehicleColor = 'Vehicle color is required'
      // Require confirmation of manual entry
      if (vehicleData.make && vehicleData.model && vehicleData.color && !vehicleConfirmed) {
        errors.vehicleConfirm = 'Please confirm your vehicle details'
      }
    } else if (vehicleLookedUp && vehicleData.make && !vehicleConfirmed) {
      // Require confirmation if vehicle was found via CarJam
      errors.vehicleConfirm = 'Please confirm this is your vehicle'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }
  
  const validateExtendedData = () => {
    const errors: Record<string, string> = {}

    if (extendedData.vehicleCondition === 'Unknown') {
      errors.vehicleCondition = 'Please select vehicle condition'
    }
    
    if (extendedData.passengerCount > 0) {
      const validNames = extendedData.passengerNames.filter(n => n.trim()).length
      if (validNames < extendedData.passengerCount) {
        errors.passengers = 'Please enter names for all passengers'
      }
    }
    
    if (extendedData.hasHealthConcerns && !extendedData.healthNotes.trim()) {
      errors.healthNotes = 'Please describe the health concern'
    }
    
    if (extendedData.hasPets && !extendedData.petDetails.trim()) {
      errors.petDetails = 'Please describe the pets'
    }
    
    if (!extendedData.ownershipConfirmed) {
      errors.ownership = 'You must confirm you are the owner or authorized'
    }
    
    if (!extendedData.termsAccepted) {
      errors.terms = 'You must accept the terms and conditions'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleContinueToPayment = async () => {
    if (!bookingData) return
    if (!validateBasicData()) return

    setCreatingIntent(true)
    setError(null)

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          amount: bookingData.price,
          // Basic data
          customerName: basicData.customerName,
          customerPhone: basicData.customerPhone,
          customerEmail: basicData.customerEmail,
          vehicleRego: basicData.vehicleRego,
          // Vehicle data from CarJam
          vehicleMake: vehicleData.make,
          vehicleModel: vehicleData.model,
          vehicleColor: vehicleData.color,
          vehicleYear: vehicleData.year,
          vehicleVin: vehicleData.vin,
          vehicleFuel: vehicleData.fuel,
          vehicleCc: vehicleData.cc,
          vehicleTransmission: vehicleData.transmission,
          vehicleBody: vehicleData.body,
          vehicleSeats: vehicleData.seats,
          vehicleWofExpiry: vehicleData.wofExpiry,
          vehicleRegoExpiry: vehicleData.regoExpiry,
          // Location - use updated location if customer changed it
          pickupLocation: locationData.pickup || bookingData.pickupLocation,
          pickupCoords: locationData.pickupCoords,
          dropoffLocation: locationData.dropoff || bookingData.dropoffLocation,
          dropoffCoords: locationData.dropoffCoords,
          eta: bookingData.eta
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize payment')
      }

      if (data.isDemo) {
        setIsDemo(true)
      }

      setClientSecret(data.clientSecret)
      setCurrentStep('payment')

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to initialize payment')
    } finally {
      setCreatingIntent(false)
    }
  }

  const handlePaymentSuccess = (txnId: string) => {
    setTransactionId(txnId)
    setCurrentStep('extended')
    setFormErrors({})
  }
  
  const handleDemoPayment = () => {
    const demoTxnId = `demo_${Date.now()}`
    setTransactionId(demoTxnId)
    savePaymentSession({
      bookingId: bookingData!.bookingId,
      status: 'paid_pending_details',
      amount: bookingData!.price,
      transactionId: demoTxnId
    })
    setCurrentStep('extended')
    setFormErrors({})
  }
  
  const handleCompleteBooking = async () => {
    if (!bookingData || !transactionId) return
    if (!validateExtendedData()) return
    
    setCurrentStep('completing')
    
    // Prepare all job data
    const jobData = {
      bookingId: bookingData.bookingId,
      transactionId,
      // Basic data
      customerName: basicData.customerName,
      customerPhone: basicData.customerPhone,
      customerEmail: basicData.customerEmail,
      vehicleRego: basicData.vehicleRego,
      // Vehicle data
      vehicleMake: vehicleData.make,
      vehicleModel: vehicleData.model,
      vehicleColor: vehicleData.color,
      vehicleYear: vehicleData.year,
      vehicleVin: vehicleData.vin,
      vehicleFuel: vehicleData.fuel,
      vehicleCc: vehicleData.cc,
      vehicleTransmission: vehicleData.transmission,
      vehicleBody: vehicleData.body,
      vehicleSeats: vehicleData.seats,
      vehicleWofExpiry: vehicleData.wofExpiry,
      vehicleRegoExpiry: vehicleData.regoExpiry,
      // Extended data
      vehicleCondition: extendedData.vehicleCondition,
      towPurpose: extendedData.towPurpose,
      keysAvailable: extendedData.keysAvailable,
      wheelsRoll: extendedData.wheelsRoll,
      isModified: extendedData.isModified,
      modificationNotes: extendedData.modificationNotes,
      passengerCount: extendedData.passengerCount,
      passengerNames: extendedData.passengerNames.filter(n => n.trim()),
      hasHealthConcerns: extendedData.hasHealthConcerns,
      healthNotes: extendedData.healthNotes,
      hasPets: extendedData.hasPets,
      petDetails: extendedData.petDetails,
      specialInstructions: extendedData.specialInstructions,
      ownershipConfirmed: extendedData.ownershipConfirmed,
      termsAcceptedAt: new Date().toISOString(),
      // Locations - use updated location if customer changed it
      pickupLocation: locationData.pickup || bookingData.pickupLocation,
      pickupCoords: locationData.pickupCoords,
      dropoffLocation: locationData.dropoff || bookingData.dropoffLocation,
      dropoffCoords: locationData.dropoffCoords,
      eta: bookingData.eta || '30 mins',
      value: bookingData.price
    }
    
    // Mark booking as completed locally
    markBookingCompleted(bookingData.bookingId)
    savePaymentSession({
      bookingId: bookingData.bookingId,
      status: 'completed',
      amount: bookingData.price,
      transactionId
    })
    
    // Send confirmations and save job to database
    try {
      await fetch('/api/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobData })
      })
    } catch (e) {
      console.error('Failed to send confirmations:', e)
    }
    
    // Redirect directly to customer portal with confirmed flag
    router.push(`/customer/${bookingData.bookingId}?confirmed=true`)
  }

  // Already paid screen - redirect to customer portal
  if (alreadyPaid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col">
        <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/"><Logo /></Link>
              <a href="tel:0800769000" className="flex items-center gap-2 text-red hover:text-white transition-colors font-semibold">
                <Phone className="w-4 h-4" />0800 769 000
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">Payment Already Received</h1>
            <p className="text-zinc-400 mb-8">This booking has already been paid for. You can view your job status and invoice in your customer portal.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/customer/${code}`}
                className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                View My Job
              </Link>
              <a href="tel:0800769000" className="inline-flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
                <Phone className="w-5 h-5" />Call Us
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-red mx-auto mb-4" />
          <p className="text-zinc-400">Loading booking details...</p>
        </div>
      </div>
    )
  }

  // Error
  if (error || !bookingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col">
        <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/"><Logo /></Link>
              <a href="tel:0800769000" className="flex items-center gap-2 text-red hover:text-white transition-colors font-semibold">
                <Phone className="w-4 h-4" />0800 769 000
              </a>
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 bg-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-4">Something Went Wrong</h1>
            <p className="text-zinc-400 mb-8">{error}</p>
            <a href="tel:0800769000" className="inline-flex items-center gap-2 bg-red hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              <Phone className="w-5 h-5" />Call 0800 769 000
            </a>
          </div>
        </main>
        <Footer />
      </div>
    )
  }
  
  // Completing state
  if (currentStep === 'completing') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-red mx-auto mb-4" />
          <h2 className="font-display text-xl font-bold mb-2">Confirming Your Booking</h2>
          <p className="text-zinc-400">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900">
      <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/"><Logo /></Link>
            <a href="tel:0800769000" className="flex items-center gap-2 text-red hover:text-white transition-colors font-semibold">
              <Phone className="w-4 h-4" />0800 769 000
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />
        
        {/* Job Summary */}
        <div className="bg-gradient-to-r from-red/10 to-zinc-900/50 border border-red/20 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-zinc-400 text-sm">Tow Truck Service</p>
              <p className="font-display text-2xl font-bold">
                {adjustedPrice !== null ? formatPrice(adjustedPrice) : formatPrice(bookingData.price)}
              </p>
              {adjustedPrice !== null && adjustedPrice !== bookingData.price && (
                <p className="text-amber-500 text-xs">Price updated for new route</p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-500 text-sm">
                <Clock className="w-4 h-4" />
                ETA: {bookingData.eta || '30 mins'}
              </div>
              {currentStep !== 'basic' && (
                <div className="flex items-center gap-1 text-green-500 text-xs mt-1">
                  <CheckCircle className="w-3 h-3" />
                  {currentStep === 'payment' ? 'Details confirmed' : 'Payment received'}
                </div>
              )}
            </div>
          </div>
          
          {/* Location confirmation with checkboxes */}
          {currentStep === 'basic' && !showLocationEdit && (
            <div className="space-y-3 mb-4">
              <p className="text-zinc-400 text-xs">Please confirm these locations are correct:</p>
              
              {/* Pickup confirmation */}
              <div 
                onClick={() => setLocationData(prev => ({ ...prev, pickupConfirmed: !prev.pickupConfirmed }))}
                className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  locationData.pickupConfirmed ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800'
                }`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors mt-1 ${locationData.pickupConfirmed ? 'bg-green-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${locationData.pickupConfirmed ? 'left-5' : 'left-0.5'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red" />
                    <span className="text-zinc-400 text-sm">Pickup</span>
                  </div>
                  <p className="text-white font-medium">{locationData.pickup || bookingData.pickupLocation}</p>
                </div>
                {locationData.pickupConfirmed && <CheckCircle className="w-5 h-5 text-green-500 mt-1" />}
              </div>
              
              {/* Dropoff confirmation */}
              {(locationData.dropoff || bookingData.dropoffLocation) && (
                <div 
                  onClick={() => setLocationData(prev => ({ ...prev, dropoffConfirmed: !prev.dropoffConfirmed }))}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    locationData.dropoffConfirmed ? 'bg-green-500/10 border border-green-500/30' : 'bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors mt-1 ${locationData.dropoffConfirmed ? 'bg-green-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${locationData.dropoffConfirmed ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zinc-500" />
                      <span className="text-zinc-400 text-sm">Drop-off</span>
                    </div>
                    <p className="text-white font-medium">{locationData.dropoff || bookingData.dropoffLocation}</p>
                  </div>
                  {locationData.dropoffConfirmed && <CheckCircle className="w-5 h-5 text-green-500 mt-1" />}
                </div>
              )}
              
              {/* Need to change location? */}
              <button
                type="button"
                onClick={() => setShowLocationEdit(true)}
                className="text-red text-sm hover:underline flex items-center gap-1"
              >
                <MapPin className="w-3 h-3" />
                Need to update location?
              </button>
            </div>
          )}
          
          {/* Read-only location display for other steps */}
          {currentStep !== 'basic' && (
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-red mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-zinc-400">Pickup</p>
                  <p className="text-white">{locationData.pickup || bookingData.pickupLocation}</p>
                </div>
              </div>
              {(locationData.dropoff || bookingData.dropoffLocation) && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-zinc-400">Drop-off</p>
                    <p className="text-white">{locationData.dropoff || bookingData.dropoffLocation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Location Edit - expandable in basic step */}
          {currentStep === 'basic' && showLocationEdit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-zinc-400 text-sm">Update your location:</p>
                <button
                  type="button"
                  onClick={() => setShowLocationEdit(false)}
                  className="text-zinc-500 text-xs hover:text-white"
                >
                  Cancel
                </button>
              </div>
              <AddressPicker
                label="Pickup Location"
                value={locationData.pickup}
                onChange={(address, coords) => {
                  setLocationData(prev => ({ 
                    ...prev, 
                    pickup: address,
                    pickupCoords: coords,
                    pickupConfirmed: true  // Auto-confirm when they set it
                  }))
                  // Clear adjusted price - will recalculate
                  setAdjustedPrice(null)
                }}
                placeholder="Search or use GPS"
                showMap={true}
              />
              <AddressPicker
                label="Drop-off Location"
                value={locationData.dropoff}
                onChange={(address, coords) => {
                  setLocationData(prev => ({ 
                    ...prev, 
                    dropoff: address,
                    dropoffCoords: coords,
                    dropoffConfirmed: true  // Auto-confirm when they set it
                  }))
                  // Clear adjusted price - will recalculate
                  setAdjustedPrice(null)
                }}
                placeholder="Where to take the vehicle"
                showMap={true}
              />
              <button
                type="button"
                onClick={() => setShowLocationEdit(false)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Confirm Updated Locations
              </button>
              <p className="text-amber-500 text-xs text-center">
                Note: Changing locations may affect the final price
              </p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red/10 border border-red/30 text-red px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* STEP 1: BASIC DATA */}
        {currentStep === 'basic' && (
          <>
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-red" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Your Details</h2>
                  <p className="text-zinc-500 text-sm">Quick 4 fields - 30 seconds</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Your Name <span className="text-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={basicData.customerName}
                    onChange={(e) => setBasicData(prev => ({ ...prev, customerName: e.target.value }))}
                    className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 ${formErrors.customerName ? 'border-red' : 'border-zinc-700/50'}`}
                    placeholder="Enter your name"
                  />
                  {formErrors.customerName && <p className="text-red text-sm mt-1">{formErrors.customerName}</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mobile Number <span className="text-red">*</span>
                  </label>
                  <input
                    type="tel"
                    value={basicData.customerPhone}
                    onChange={(e) => setBasicData(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 ${formErrors.customerPhone ? 'border-red' : 'border-zinc-700/50'}`}
                    placeholder="021 123 4567"
                  />
                  {formErrors.customerPhone && <p className="text-red text-sm mt-1">{formErrors.customerPhone}</p>}
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Address <span className="text-red">*</span>
                  </label>
                  <input
                    type="email"
                    value={basicData.customerEmail}
                    onChange={(e) => setBasicData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 ${formErrors.customerEmail ? 'border-red' : 'border-zinc-700/50'}`}
                    placeholder="your@email.com"
                  />
                  {formErrors.customerEmail && <p className="text-red text-sm mt-1">{formErrors.customerEmail}</p>}
                </div>

                {/* Rego */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Vehicle Rego <span className="text-red">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={basicData.vehicleRego}
                      onChange={(e) => {
                        const newRego = e.target.value.toUpperCase()
                        setBasicData(prev => ({ ...prev, vehicleRego: newRego }))
                        // Reset lookup state when rego changes
                        setVehicleLookedUp(false)
                        setVehicleConfirmed(false)
                        setVehicleNotFound(false)
                        // Clear previous vehicle data so new lookup triggers
                        if (newRego !== basicData.vehicleRego) {
                          setVehicleData({
                            make: '', model: '', color: '', year: '', vin: '', fuel: '',
                            cc: '', transmission: '', body: '', seats: '', wofExpiry: '', regoExpiry: ''
                          })
                        }
                      }}
                      className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white uppercase placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 ${formErrors.vehicleRego ? 'border-red' : 'border-zinc-700/50'}`}
                      placeholder="ABC123"
                    />
                    {lookingUpVehicle && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-5 h-5 animate-spin text-red" />
                      </div>
                    )}
                    {vehicleLookedUp && vehicleData.make && !lookingUpVehicle && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                    )}
                  </div>
                  {formErrors.vehicleRego && <p className="text-red text-sm mt-1">{formErrors.vehicleRego}</p>}
                </div>

                {/* Show auto-filled vehicle info if available */}
                {vehicleLookedUp && vehicleData.make && (
                  <div className={`rounded-xl border transition-all ${
                    vehicleConfirmed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-zinc-800/50 border-zinc-700/50'
                  }`}>
                    {/* Vehicle Header */}
                    <div className="p-4 border-b border-zinc-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Car className="w-5 h-5 text-red" />
                          <span className="font-semibold text-white">Vehicle Found</span>
                        </div>
                        <span className="bg-red/20 text-red px-3 py-1 rounded-lg font-mono font-bold text-sm">
                          {basicData.vehicleRego}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-white">
                        {vehicleData.color && <span className="text-zinc-400">{vehicleData.color} </span>}
                        {vehicleData.year} {vehicleData.make} {vehicleData.model}
                      </p>
                    </div>
                    
                    {/* Vehicle Details Grid */}
                    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
                      {vehicleData.body && (
                        <div>
                          <span className="text-zinc-500">Body Type</span>
                          <p className="text-white">{vehicleData.body}</p>
                        </div>
                      )}
                      {vehicleData.fuel && (
                        <div>
                          <span className="text-zinc-500">Fuel</span>
                          <p className="text-white">{vehicleData.fuel}</p>
                        </div>
                      )}
                      {vehicleData.cc && (
                        <div>
                          <span className="text-zinc-500">Engine</span>
                          <p className="text-white">{vehicleData.cc}cc</p>
                        </div>
                      )}
                      {vehicleData.transmission && (
                        <div>
                          <span className="text-zinc-500">Transmission</span>
                          <p className="text-white">{vehicleData.transmission}</p>
                        </div>
                      )}
                      {vehicleData.vin && (
                        <div className="col-span-2">
                          <span className="text-zinc-500">VIN</span>
                          <p className="text-white font-mono text-xs">{vehicleData.vin}</p>
                        </div>
                      )}
                      {(vehicleData.wofExpiry || vehicleData.regoExpiry) && (
                        <div className="col-span-2 flex gap-4 pt-2 border-t border-zinc-700/50">
                          {vehicleData.wofExpiry && (
                            <div>
                              <span className="text-zinc-500">WoF Expiry</span>
                              <p className={`font-medium ${new Date(vehicleData.wofExpiry) < new Date() ? 'text-red' : 'text-green-400'}`}>
                                {vehicleData.wofExpiry}
                              </p>
                            </div>
                          )}
                          {vehicleData.regoExpiry && (
                            <div>
                              <span className="text-zinc-500">Rego Expiry</span>
                              <p className={`font-medium ${new Date(vehicleData.regoExpiry) < new Date() ? 'text-red' : 'text-green-400'}`}>
                                {vehicleData.regoExpiry}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Confirmation Slider */}
                    <div className="p-4 border-t border-zinc-700/50">
                      <div 
                        onClick={() => setVehicleConfirmed(!vehicleConfirmed)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                          vehicleConfirmed ? 'bg-green-500/20' : 'bg-zinc-800 hover:bg-zinc-700'
                        }`}
                      >
                        <div className={`relative w-12 h-6 rounded-full transition-colors ${vehicleConfirmed ? 'bg-green-500' : 'bg-zinc-600'}`}>
                          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${vehicleConfirmed ? 'left-6' : 'left-0.5'}`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${vehicleConfirmed ? 'text-green-400' : 'text-white'}`}>
                            {vehicleConfirmed ? '✓ This is my vehicle' : 'Confirm this is your vehicle'}
                          </p>
                        </div>
                        {vehicleConfirmed && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                      
                      {/* Wrong vehicle option */}
                      {!vehicleConfirmed && (
                        <button
                          type="button"
                          onClick={() => {
                            setVehicleConfirmed(false)
                            setVehicleLookedUp(false)
                            setVehicleData({
                              make: '', model: '', color: '', year: '', vin: '', fuel: '',
                              cc: '', transmission: '', body: '', seats: '', wofExpiry: '', regoExpiry: ''
                            })
                            // Focus on the rego input
                            document.querySelector<HTMLInputElement>('input[placeholder="ABC123"]')?.focus()
                          }}
                          className="mt-3 w-full text-center text-amber-400 text-sm hover:underline flex items-center justify-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Not your vehicle? Update the rego above
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {/* No vehicle found - manual entry required */}
                {vehicleLookedUp && vehicleNotFound && basicData.vehicleRego.length >= 5 && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-amber-500/20">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-amber-400 font-medium">Vehicle not found in database</p>
                          <p className="text-zinc-400 text-sm mt-1">
                            The rego <span className="font-mono font-bold text-white">{basicData.vehicleRego}</span> wasn&apos;t found. 
                            Please enter your vehicle details manually.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Manual entry form */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Make <span className="text-red">*</span></label>
                          <input
                            type="text"
                            value={vehicleData.make}
                            onChange={(e) => setVehicleData(prev => ({ ...prev, make: e.target.value }))}
                            className={`w-full bg-zinc-800/50 border rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm ${formErrors.vehicleMake ? 'border-red' : 'border-zinc-700/50'}`}
                            placeholder="e.g. Toyota"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Model <span className="text-red">*</span></label>
                          <input
                            type="text"
                            value={vehicleData.model}
                            onChange={(e) => setVehicleData(prev => ({ ...prev, model: e.target.value }))}
                            className={`w-full bg-zinc-800/50 border rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm ${formErrors.vehicleModel ? 'border-red' : 'border-zinc-700/50'}`}
                            placeholder="e.g. Hilux"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Color <span className="text-red">*</span></label>
                          <input
                            type="text"
                            value={vehicleData.color}
                            onChange={(e) => setVehicleData(prev => ({ ...prev, color: e.target.value }))}
                            className={`w-full bg-zinc-800/50 border rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm ${formErrors.vehicleColor ? 'border-red' : 'border-zinc-700/50'}`}
                            placeholder="e.g. White"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-zinc-400 mb-1">Year</label>
                          <input
                            type="text"
                            value={vehicleData.year}
                            onChange={(e) => setVehicleData(prev => ({ ...prev, year: e.target.value }))}
                            className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm"
                            placeholder="e.g. 2020"
                          />
                        </div>
                      </div>
                      
                      {/* Show errors */}
                      {(formErrors.vehicleMake || formErrors.vehicleModel || formErrors.vehicleColor) && (
                        <p className="text-red text-sm">Please enter the required vehicle details</p>
                      )}
                      
                      {/* Confirmation after manual entry */}
                      {vehicleData.make && vehicleData.model && vehicleData.color && (
                        <div 
                          onClick={() => setVehicleConfirmed(!vehicleConfirmed)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors mt-2 ${
                            vehicleConfirmed ? 'bg-green-500/20 border border-green-500/30' : 'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700'
                          }`}
                        >
                          <div className={`relative w-12 h-6 rounded-full transition-colors ${vehicleConfirmed ? 'bg-green-500' : 'bg-zinc-600'}`}>
                            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all shadow-md ${vehicleConfirmed ? 'left-6' : 'left-0.5'}`} />
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${vehicleConfirmed ? 'text-green-400' : 'text-white'}`}>
                              {vehicleConfirmed ? '✓ Vehicle details confirmed' : 'Confirm vehicle details are correct'}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {vehicleData.color} {vehicleData.year} {vehicleData.make} {vehicleData.model}
                            </p>
                          </div>
                          {vehicleConfirmed && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Vehicle confirmation error */}
                {formErrors.vehicleConfirm && (
                  <div className="bg-red/10 border border-red/30 rounded-xl p-3 flex items-center gap-2 text-red text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {formErrors.vehicleConfirm}
                  </div>
                )}
              </div>
            </div>

            {/* Validation error summary - show above button */}
            {Object.keys(formErrors).length > 0 && (
              <div className="bg-red/10 border border-red/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red font-medium">Please fix the following:</p>
                    <ul className="text-red/80 text-sm mt-1 list-disc list-inside">
                      {Object.values(formErrors).map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <button
              onClick={handleContinueToPayment}
              disabled={creatingIntent}
              className="w-full bg-red hover:bg-red-600 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red/30 disabled:opacity-70"
            >
              {creatingIntent ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Preparing Payment...
                </>
              ) : (
                <>
                  Continue to Payment
                  <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </>
        )}

        {/* STEP 2: PAYMENT */}
        {currentStep === 'payment' && (
          <>
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-red" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Secure Payment</h2>
                  <p className="text-zinc-500 text-sm">Your booking is almost confirmed</p>
                </div>
              </div>

              {/* Summary of basic details */}
              <div className="bg-zinc-800/30 rounded-xl p-4 mb-6 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Name</span>
                    <span className="text-white">{basicData.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Phone</span>
                    <span className="text-white">{basicData.customerPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Email</span>
                    <span className="text-white">{basicData.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Rego</span>
                    <span className="text-red font-mono font-bold">{basicData.vehicleRego}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Vehicle</span>
                    <span className="text-white">
                      {vehicleData.make ? `${vehicleData.color} ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}` : 'Manual entry'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Demo mode message */}
              {isDemo && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-amber-400 text-sm">
                    <AlertTriangle className="w-5 h-5" />
                    <p><strong>Demo Mode:</strong> No real payment will be processed</p>
                  </div>
                </div>
              )}

              {/* Stripe Payment Element */}
              {clientSecret && !isDemo ? (
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#ef4444' } } }}>
                  <PaymentForm 
                    bookingData={bookingData} 
                    basicData={basicData}
                    vehicleData={vehicleData}
                    onSuccess={handlePaymentSuccess} 
                  />
                </Elements>
              ) : isDemo ? (
                <button
                  onClick={handleDemoPayment}
                  className="w-full bg-red hover:bg-red-600 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-red/30"
                >
                  <CreditCard className="w-6 h-6" />
                  Complete Demo Payment - {formatPrice(bookingData.price)}
                </button>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-red mx-auto mb-4" />
                  <p className="text-zinc-400">Loading payment form...</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* STEP 3: EXTENDED DATA */}
        {currentStep === 'extended' && (
          <>
            {/* Payment confirmed banner */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-400">Payment Received!</p>
                <p className="text-sm text-zinc-400">Just a few more details to confirm your booking</p>
              </div>
            </div>
            
            {/* Ownership Confirmation */}
            <div id="vehicle-authorization" className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Vehicle Authorization</h2>
                  <p className="text-zinc-500 text-sm">Confirm you can authorize this tow</p>
                </div>
              </div>
              
              <div 
                onClick={() => setExtendedData(prev => ({ ...prev, ownershipConfirmed: !prev.ownershipConfirmed }))}
                className={`flex items-start gap-3 bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors ${formErrors.ownership ? 'border-2 border-red' : ''}`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors mt-0.5 shrink-0 ${extendedData.ownershipConfirmed ? 'bg-green-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.ownershipConfirmed ? 'left-5' : 'left-0.5'}`} />
                </div>
                <div>
                  <p className="font-medium">I confirm I am the registered owner of this vehicle, or I am authorized by the owner to arrange this tow.</p>
                  <p className="text-zinc-500 text-sm mt-1">This is a legal requirement for all towing services</p>
                </div>
              </div>
              {formErrors.ownership && <p className="text-red text-sm mt-2">{formErrors.ownership}</p>}
            </div>

            {/* Vehicle Condition */}
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red/20 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-red" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Tow Details</h2>
                  <p className="text-zinc-500 text-sm">Help us prepare the right equipment</p>
                </div>
              </div>
              
              {/* Vehicle shown */}
              {vehicleData.make && (
                <div className="bg-zinc-800/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <Car className="w-5 h-5 text-zinc-500" />
                  <span className="text-white">{vehicleData.color} {vehicleData.make} {vehicleData.model} {vehicleData.year && `(${vehicleData.year})`}</span>
                </div>
              )}
              
              {/* Vehicle Condition */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Vehicle Condition <span className="text-red">*</span></label>
                <select
                  value={extendedData.vehicleCondition}
                  onChange={(e) => setExtendedData(prev => ({ ...prev, vehicleCondition: e.target.value as VehicleCondition }))}
                  className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white ${formErrors.vehicleCondition ? 'border-red' : 'border-zinc-700/50'}`}
                >
                  {VEHICLE_CONDITIONS.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {formErrors.vehicleCondition && <p className="text-red text-sm mt-1">{formErrors.vehicleCondition}</p>}
              </div>
              
              {/* Tow Purpose */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Where is the vehicle going?</label>
                <select
                  value={extendedData.towPurpose}
                  onChange={(e) => setExtendedData(prev => ({ ...prev, towPurpose: e.target.value as TowPurpose }))}
                  className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white"
                >
                  {TOW_PURPOSES.map((purpose) => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </div>
              
              {/* Quick toggles */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div 
                  onClick={() => setExtendedData(prev => ({ ...prev, keysAvailable: !prev.keysAvailable }))}
                  className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${extendedData.keysAvailable ? 'bg-green-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.keysAvailable ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm">Keys available</span>
                  </div>
                </div>
                <div 
                  onClick={() => setExtendedData(prev => ({ ...prev, wheelsRoll: !prev.wheelsRoll }))}
                  className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${extendedData.wheelsRoll ? 'bg-green-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.wheelsRoll ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm">Wheels roll freely</span>
                </div>
              </div>
              
              {/* Vehicle modified */}
              <div 
                onClick={() => setExtendedData(prev => ({ ...prev, isModified: !prev.isModified }))}
                className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-3 cursor-pointer hover:bg-zinc-800 transition-colors"
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors ${extendedData.isModified ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.isModified ? 'left-5' : 'left-0.5'}`} />
                </div>
                <span className="text-sm">Vehicle is modified (lowered, body kit, wide wheels)</span>
              </div>
              {extendedData.isModified && (
                <input type="text" value={extendedData.modificationNotes} onChange={(e) => setExtendedData(prev => ({ ...prev, modificationNotes: e.target.value }))} className="w-full mt-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500" placeholder="Describe modifications..." />
              )}
            </div>

            {/* Passengers */}
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Passengers</h2>
                </div>
              </div>
              
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200">Only 1 passenger can travel in the tow truck. Additional passengers need alternative transport.</p>
                </div>
              </div>
              
              <select 
                value={extendedData.passengerCount} 
                onChange={(e) => { 
                  const count = parseInt(e.target.value)
                  setExtendedData(prev => ({ ...prev, passengerCount: count, passengerNames: Array(count).fill('') }))
                }} 
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white"
              >
                <option value={0}>No additional passengers</option>
                <option value={1}>1 additional passenger</option>
                <option value={2}>2 additional passengers</option>
                <option value={3}>3 additional passengers</option>
                <option value={4}>4+ additional passengers</option>
              </select>
              
              {extendedData.passengerCount > 0 && (
                <div className="mt-3 space-y-2">
                  {extendedData.passengerNames.map((name, i) => (
                    <input 
                      key={i} 
                      type="text" 
                      value={name} 
                      onChange={(e) => { 
                        const newNames = [...extendedData.passengerNames]
                        newNames[i] = e.target.value
                        setExtendedData(prev => ({ ...prev, passengerNames: newNames }))
                      }} 
                      className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500" 
                      placeholder={`Passenger ${i + 1} name`} 
                    />
                  ))}
                  {formErrors.passengers && <p className="text-red text-sm">{formErrors.passengers}</p>}
                </div>
              )}
            </div>

            {/* Health & Pets */}
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div className="space-y-4">
                {/* Health concerns */}
                <div 
                  onClick={() => setExtendedData(prev => ({ ...prev, hasHealthConcerns: !prev.hasHealthConcerns }))}
                  className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${extendedData.hasHealthConcerns ? 'bg-rose-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.hasHealthConcerns ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span className="text-sm">Health or mobility concerns</span>
                  </div>
                </div>
                {extendedData.hasHealthConcerns && (
                  <div>
                    <textarea 
                      value={extendedData.healthNotes} 
                      onChange={(e) => setExtendedData(prev => ({ ...prev, healthNotes: e.target.value }))} 
                      className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 min-h-[60px] ${formErrors.healthNotes ? 'border-red' : 'border-zinc-700/50'}`} 
                      placeholder="Please describe..." 
                    />
                    {formErrors.healthNotes && <p className="text-red text-sm mt-1">{formErrors.healthNotes}</p>}
                  </div>
                )}
                
                {/* Pets */}
                <div 
                  onClick={() => setExtendedData(prev => ({ ...prev, hasPets: !prev.hasPets }))}
                  className="flex items-center gap-3 bg-zinc-800/50 rounded-xl p-4 cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <div className={`relative w-10 h-5 rounded-full transition-colors ${extendedData.hasPets ? 'bg-orange-500' : 'bg-zinc-600'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.hasPets ? 'left-5' : 'left-0.5'}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <PawPrint className="w-4 h-4 text-orange-400" />
                    <span className="text-sm">Pets present (cannot travel in truck)</span>
                  </div>
                </div>
                {extendedData.hasPets && (
                  <div>
                    <input 
                      type="text" 
                      value={extendedData.petDetails} 
                      onChange={(e) => setExtendedData(prev => ({ ...prev, petDetails: e.target.value }))} 
                      className={`w-full bg-zinc-800/50 border rounded-xl px-4 py-3 text-white placeholder-zinc-500 ${formErrors.petDetails ? 'border-red' : 'border-zinc-700/50'}`} 
                      placeholder="e.g., 1 dog, 2 cats" 
                    />
                    {formErrors.petDetails && <p className="text-red text-sm mt-1">{formErrors.petDetails}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <label className="block text-sm font-medium mb-2">Special Instructions (Optional)</label>
              <textarea 
                value={extendedData.specialInstructions} 
                onChange={(e) => setExtendedData(prev => ({ ...prev, specialInstructions: e.target.value }))} 
                className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-white placeholder-zinc-500 min-h-[60px]" 
                placeholder="Gate codes, access instructions, specific requirements..." 
              />
            </div>

            {/* Terms */}
            <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-6">
              <div 
                onClick={() => setExtendedData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))}
                className={`flex items-start gap-3 cursor-pointer ${formErrors.terms ? 'text-red' : ''}`}
              >
                <div className={`relative w-10 h-5 rounded-full transition-colors mt-0.5 shrink-0 ${extendedData.termsAccepted ? 'bg-green-500' : 'bg-zinc-600'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${extendedData.termsAccepted ? 'left-5' : 'left-0.5'}`} />
                </div>
                <div className="text-sm">
                  <span>I agree to the </span>
                  <a href="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-red hover:underline">Terms & Conditions</a>
                  <span> and </span>
                  <a href="/privacy" target="_blank" onClick={(e) => e.stopPropagation()} className="text-red hover:underline">Privacy Policy</a>
                  <span className="text-red"> *</span>
                </div>
              </div>
              {formErrors.terms && <p className="text-red text-sm mt-2">{formErrors.terms}</p>}
            </div>

            {/* Complete Button */}
            <button
              onClick={handleCompleteBooking}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-600/30"
            >
              <CheckCircle className="w-6 h-6" />
              Confirm Booking
            </button>
            
            <p className="text-center text-zinc-500 text-sm mt-4">
              Your driver will be dispatched immediately after confirmation
            </p>
          </>
        )}

        {/* Security badges */}
        <div className="flex items-center justify-center gap-6 mt-8 text-zinc-500 text-sm">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>SSL Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>PCI Compliant</span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
