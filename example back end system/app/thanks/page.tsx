'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Phone, ArrowRight, Clock, MapPin, Truck, Home, Mail, MessageSquare, Bell } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { markBookingCompleted, isBookingCompleted } from '@/lib/booking-utils'
import { fireSmartConversion, debugAdsTracking } from '@/lib/ads-tracking'

// Separate component for the content that uses useSearchParams
function ThanksContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('booking')
  const value = parseFloat(searchParams.get('value') || '0')
  const eta = searchParams.get('eta') || '30 mins'
  const transactionId = searchParams.get('transaction_id') || bookingId || ''
  
  const [countdown, setCountdown] = useState(60) // Auto-redirect after 60 seconds
  const [conversionFired, setConversionFired] = useState(false)
  const [confirmationsSent, setConfirmationsSent] = useState(false)
  const [confirmationResults, setConfirmationResults] = useState<{
    customerSms: boolean
    customerEmail: boolean
    internalNotification: boolean
  } | null>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    // Only process once
    if (processedRef.current) return
    processedRef.current = true
    
    // Mark booking as completed to prevent double payments
    if (bookingId && !isBookingCompleted(bookingId)) {
      markBookingCompleted(bookingId)
    }

    // Fire Google Ads conversion tracking
    if (typeof window !== 'undefined' && 'gtag' in window) {
      setConversionFired(true)
      
      // Debug what ads tracking data we have
      debugAdsTracking()
      
      // Smart conversion - fires correct account based on captured source
      const valueInDollars = value ? value / 100 : 1.0
      fireSmartConversion(valueInDollars, transactionId)
    }

    // Retrieve full job data and send confirmations
    sendConfirmations()
    
    // Add to stories/carousel
    addToStories()
  }, [bookingId, value, transactionId])

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/')
      return
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, router])

  // Send all confirmations (SMS/email to customer + booking to Eek Mechanical)
  const sendConfirmations = async () => {
    try {
      // Retrieve full job data from sessionStorage
      const storedJob = sessionStorage.getItem(`hook_job_${bookingId}`)
      
      if (!storedJob) {
        console.log('No stored job data found for confirmations')
        return
      }
      
      const jobData = JSON.parse(storedJob)
      
      console.log('📧 Sending booking confirmations...')
      
      const response = await fetch('/api/confirm-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobData })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setConfirmationsSent(true)
        setConfirmationResults(result.results)
        console.log('✅ Confirmations sent:', result.results)
      }
    } catch (e) {
      console.error('Failed to send confirmations:', e)
    }
  }

  // Add completed job to stories (for carousel)
  const addToStories = async () => {
    try {
      // Retrieve full job data from sessionStorage
      const storedJob = sessionStorage.getItem(`hook_job_${bookingId}`)
      
      // Build job data object
      const jobData: Record<string, unknown> = {
        bookingId,
        transactionId,
        value,
        completedAt: new Date().toISOString()
      }
      
      if (storedJob) {
        try {
          const parsed = JSON.parse(storedJob)
          jobData.customerName = parsed.customerName
          jobData.customerPhone = parsed.customerPhone
          jobData.customerEmail = parsed.customerEmail
          jobData.vehicleMake = parsed.vehicleMake
          jobData.vehicleModel = parsed.vehicleModel
          jobData.vehicleColor = parsed.vehicleColor
          jobData.vehicleRego = parsed.vehicleRego
          jobData.vehicleYear = parsed.vehicleYear
          jobData.vehicleVin = parsed.vehicleVin
          jobData.vehicleCondition = parsed.vehicleCondition
          jobData.towPurpose = parsed.towPurpose
          jobData.pickupLocation = parsed.pickupLocation
          jobData.dropoffLocation = parsed.dropoffLocation
          jobData.issueType = parsed.issueType
          jobData.eta = parsed.eta
          // Clean up after reading
          sessionStorage.removeItem(`hook_job_${bookingId}`)
        } catch (e) {
          console.error('Failed to parse stored job:', e)
        }
      }
      
      await fetch('/api/add-completed-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      })
      
      console.log('✅ Job added to carousel:', jobData)
    } catch (e) {
      console.error('Failed to add to stories:', e)
    }
  }

  // Format ETA for display
  const formatEta = (etaString: string): string => {
    // Parse minutes from strings like "30 mins" or "30"
    const match = etaString.match(/(\d+)/)
    if (match) {
      const minutes = parseInt(match[1])
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`
      }
      return `${minutes} minutes`
    }
    return etaString
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        {/* Success Animation */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
          <div className="relative w-28 h-28 bg-green-500/30 rounded-full flex items-center justify-center">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
          Booking <span className="text-green-500">Confirmed!</span>
        </h1>

        {/* Booking ID */}
        {bookingId && (
          <div className="bg-zinc-800/50 rounded-xl py-3 px-6 inline-block mb-6">
            <p className="text-zinc-400 text-sm">Booking Reference</p>
            <p className="font-mono text-lg font-bold text-white">{bookingId}</p>
          </div>
        )}

        {/* ETA Card */}
        <div className="bg-gradient-to-r from-green-500/10 to-zinc-900/50 border border-green-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-green-500" />
            <span className="text-zinc-400">Estimated Arrival</span>
          </div>
          <p className="font-display text-4xl font-bold text-green-500 mb-2">
            {formatEta(eta)}
          </p>
          <p className="text-zinc-400 text-sm">
            Your driver is on the way!
          </p>
        </div>

        {/* Confirmation Status */}
        {confirmationsSent && confirmationResults && (
          <div className="bg-zinc-900/80 rounded-2xl p-4 border border-zinc-800/50 mb-6">
            <p className="text-sm text-zinc-400 mb-3">Confirmations Sent</p>
            <div className="flex justify-center gap-4">
              {confirmationResults.customerSms && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS</span>
                </div>
              )}
              {confirmationResults.customerEmail && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </div>
              )}
              {confirmationResults.internalNotification && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Bell className="w-4 h-4" />
                  <span>Dispatch</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* What's Happening */}
        <div className="bg-zinc-900/80 backdrop-blur rounded-2xl p-6 border border-zinc-800/50 mb-8 text-left">
          <h2 className="font-display text-lg font-bold mb-4 text-center">What&apos;s Happening Now</h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Payment Confirmed</p>
                <p className="text-zinc-500 text-sm">Your payment has been processed securely</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Booking Details Received</p>
                <p className="text-zinc-500 text-sm">All your information has been recorded</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-red animate-pulse" />
              </div>
              <div>
                <p className="font-medium">Driver Dispatched</p>
                <p className="text-zinc-500 text-sm">A tow truck is heading to your location now</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-zinc-400" />
              </div>
              <div>
                <p className="font-medium">Driver Will Call</p>
                <p className="text-zinc-500 text-sm">They&apos;ll call when nearby to confirm your exact location</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 mb-8">
          <p className="text-sm text-zinc-300 mb-2">
            <span className="font-semibold text-white">Questions?</span> Call our 24/7 line
          </p>
          <a 
            href="tel:0800769000" 
            className="inline-flex items-center gap-2 text-red hover:text-white font-bold text-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
            0800 769 000
          </a>
        </div>

        {/* Auto redirect notice */}
        <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm mb-6">
          <Home className="w-4 h-4" />
          <span>Returning to homepage in {countdown}s</span>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setCountdown(0)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-6 py-3 rounded-xl transition-all"
          >
            Go Home Now
          </button>
          <Link 
            href="/stories"
            className="bg-red hover:bg-red-600 text-white font-semibold px-6 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            See Our Work
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  )
}

// Main page component with Suspense boundary
export default function ThanksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/50 backdrop-blur-sm bg-black/30">
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

      <Suspense fallback={
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-zinc-500">Loading...</div>
        </main>
      }>
        <ThanksContent />
      </Suspense>

      <Footer />
    </div>
  )
}
