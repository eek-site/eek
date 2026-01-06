'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { fireSmartConversion, debugAdsTracking } from '@/lib/ads-tracking'
import { 
  MapPin, 
  Car, 
  DollarSign, 
  Phone,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Truck,
  Building2,
  FileText,
  Download,
  CreditCard,
  UserCheck,
  Navigation,
  CircleDot
} from 'lucide-react'

interface HistoryEvent {
  action: string
  timestamp: string
  by?: string
  data?: Record<string, unknown>
}

interface JobData {
  bookingId: string
  rego: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  price: number
  eta?: string
  status?: string
  createdAt: string
  updatedAt?: string
  // Supplier info
  supplierName?: string
  supplierPhone?: string
  supplierAddress?: string
  // Vehicle
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  // History/timeline
  history?: HistoryEvent[]
}

interface Message {
  from: string
  message: string
  timestamp: string
}

export default function CustomerPortalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobData, setJobData] = useState<JobData | null>(null)
  
  // Message form
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  
  // Active tab - check URL param first
  const tabParam = searchParams.get('tab') as 'status' | 'messages' | 'details' | null
  const [activeTab, setActiveTab] = useState<'status' | 'messages' | 'details'>(tabParam || 'status')
  
  // Check if this is a fresh payment confirmation redirect
  const justConfirmed = searchParams.get('confirmed') === 'true'
  const [showConfirmation, setShowConfirmation] = useState(justConfirmed)
  
  // Detect other open tabs and try to close duplicates
  useEffect(() => {
    if (typeof window === 'undefined' || !code) return
    
    try {
      const channel = new BroadcastChannel(`hook-customer-${code}`)
      const tabId = Date.now().toString()
      
      channel.onmessage = (event) => {
        if (event.data.type === 'TAB_EXISTS' && event.data.tabId !== tabId) {
          // Another tab exists - tell it to switch to our requested tab, then close ourselves
          if (tabParam) {
            channel.postMessage({ type: 'SWITCH_TAB', tab: tabParam })
          }
          // Try to close this tab (works on mobile/some browsers)
          setTimeout(() => window.close(), 100)
        } else if (event.data.type === 'NEW_TAB' && event.data.tabId !== tabId) {
          // New tab opened - tell it we exist
          channel.postMessage({ type: 'TAB_EXISTS', tabId })
        } else if (event.data.type === 'SWITCH_TAB') {
          // Another tab wants us to switch
          if (event.data.tab && ['status', 'messages', 'details'].includes(event.data.tab)) {
            setActiveTab(event.data.tab)
            // Focus this window
            window.focus()
          }
        } else if (event.data.type === 'NEW_MESSAGE') {
          // Sync messages across tabs (append to end - newest at bottom)
          setMessages(prev => {
            if (prev.some(m => m.timestamp === event.data.message.timestamp)) return prev
            return [...prev, event.data.message]
          })
        }
      }
      
      // Announce we're opening
      channel.postMessage({ type: 'NEW_TAB', tabId })
      
      return () => channel.close()
    } catch (e) {
      // BroadcastChannel not supported
    }
  }, [code, tabParam])
  
  // Fire conversion tracking and auto-dismiss confirmation
  const conversionFiredRef = useRef(false)
  useEffect(() => {
    if (!justConfirmed) return
    
    // Fire conversion tracking (only once)
    if (!conversionFiredRef.current && typeof window !== 'undefined' && 'gtag' in window) {
      conversionFiredRef.current = true
      debugAdsTracking()
      // Default to $1 if we don't have the value
      fireSmartConversion(1.0, code)
    }
    
    // Auto-dismiss confirmation after 10 seconds
    const timer = setTimeout(() => {
      setShowConfirmation(false)
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [justConfirmed, code])
  
  // Update tab when URL param changes
  useEffect(() => {
    if (tabParam && ['status', 'messages', 'details'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Load customer data
  useEffect(() => {
    const loadCustomerData = async () => {
      const looksLikeBase64 = code.includes('=') || code.length > 50
      const isBookingId = !looksLikeBase64 && (code.startsWith('HT-') || /^[A-Za-z0-9-]+$/.test(code))
      
      if (isBookingId) {
        try {
          const response = await fetch(`/api/booking/${code}`)
          const result = await response.json()
          
          if (result.success && result.job) {
            setJobData(result.job)
            setLoading(false)
            
            // Fetch messages
            fetchMessages(result.job.bookingId || result.job.rego || code)
            return
          }
        } catch (e) {
          console.error('Failed to fetch booking:', e)
        }
      }
      
      // Fall back to legacy base64 decode
      try {
        const decoded = JSON.parse(atob(code))
        setJobData({
          bookingId: decoded.ref || code,
          rego: decoded.rego || '',
          customerName: decoded.customerName,
          pickupLocation: decoded.pickup,
          dropoffLocation: decoded.dropoff,
          price: decoded.price,
          eta: decoded.eta,
          status: decoded.status || 'pending',
          createdAt: decoded.createdAt || new Date().toISOString()
        })
        setLoading(false)
        
        if (decoded.rego) {
          fetchMessages(decoded.rego)
        }
      } catch {
        setError('Invalid or expired link. Please contact Eek Mechanical.')
        setLoading(false)
      }
    }
    
    loadCustomerData()
    
    // Poll for updates every 30 seconds
    const interval = setInterval(loadCustomerData, 30000)
    return () => clearInterval(interval)
  }, [code])

  const fetchMessages = async (ref: string) => {
    try {
      const response = await fetch(`/api/messages/${ref}`)
      const data = await response.json()
      if (data.success && data.messages) {
        // Filter to only show customer's conversation with Eek Mechanical
        // Customer sees: their own messages + messages sent TO them
        // Customer does NOT see: supplier messages, messages sent TO supplier
        const filtered = data.messages.filter((msg: { from: string }) => {
          if (msg.from === 'customer') return true // Customer's own messages
          if (msg.from === 'hook_towing_to_customer') return true // Messages to customer
          return false // Hide everything else (supplier msgs, hook_to_supplier)
        })
        // Sort oldest first (newest at bottom)
        filtered.sort((a: Message, b: Message) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        setMessages(filtered)
      }
    } catch (e) {
      console.error('Fetch messages error:', e)
    }
  }

  const handleSendMessage = async () => {
    if (!jobData || !message.trim()) return
    
    setSubmitting(true)
    
    try {
      await fetch('/api/customer-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rego: jobData.rego || jobData.bookingId,
          bookingId: jobData.bookingId,
          customerName: jobData.customerName || 'Customer',
          message: message.trim()
        })
      })
      
      const newMsg = {
        from: 'customer',
        message: message.trim(),
        timestamp: new Date().toISOString()
      }
      
      setMessages(prev => [...prev, newMsg]) // Append to end (newest at bottom)
      
      // Broadcast to other tabs
      try {
        const channel = new BroadcastChannel(`hook-customer-${code}`)
        channel.postMessage({ type: 'NEW_MESSAGE', message: newMsg })
        channel.close()
      } catch (e) { /* BroadcastChannel not supported */ }
      
      setMessage('')
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e) {
      console.error('Message error:', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red animate-spin" />
      </main>
    )
  }

  if (error || !jobData) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Error</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a href="tel:0800769000" className="text-red hover:underline">
            Call 0800 769 000
          </a>
        </div>
      </main>
    )
  }

  const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string; description?: string }> = {
    pending: { color: 'yellow', icon: Clock, label: 'Awaiting Payment', description: 'Please complete payment to proceed' },
    booked: { color: 'blue', icon: CreditCard, label: 'Payment Confirmed', description: 'Awaiting job allocation' },
    assigned: { color: 'orange', icon: UserCheck, label: 'Towing Company Assigned', description: 'Your towing company has been assigned' },
    dispatched: { color: 'purple', icon: Truck, label: 'Driver Dispatched', description: 'Driver is on the way' },
    in_progress: { color: 'green', icon: Navigation, label: 'Job In Progress', description: 'Your vehicle is being towed' },
    completed: { color: 'green', icon: CheckCircle, label: 'Completed', description: 'Job completed successfully' },
    cancelled: { color: 'red', icon: AlertCircle, label: 'Cancelled', description: 'This job has been cancelled' }
  }

  const status = statusConfig[jobData.status || 'pending'] || statusConfig.pending
  const StatusIcon = status.icon

  // Build timeline from history
  const timeline: Array<{ icon: typeof Clock; title: string; time: string; description?: string; color: string }> = []
  
  // Always show created
  timeline.push({
    icon: FileText,
    title: 'Booking Created',
    time: jobData.createdAt,
    color: 'zinc'
  })
  
  // Add history events
  if (jobData.history) {
    for (const event of jobData.history) {
      switch (event.action) {
        case 'payment_completed':
        case 'created_from_payment':
          timeline.push({
            icon: CreditCard,
            title: 'Payment Confirmed',
            time: event.timestamp,
            description: `$${((event.data?.amount as number) / 100 || jobData.price / 100).toFixed(2)} paid`,
            color: 'green'
          })
          break
        case 'supplier_assigned':
          timeline.push({
            icon: Building2,
            title: 'Towing Company Assigned',
            time: event.timestamp,
            description: jobData.supplierName || 'Driver assigned',
            color: 'orange'
          })
          break
        case 'dispatched':
          timeline.push({
            icon: Truck,
            title: 'Driver Dispatched',
            time: event.timestamp,
            description: 'Tow truck is on the way',
            color: 'purple'
          })
          break
        case 'arrived':
          timeline.push({
            icon: MapPin,
            title: 'Driver Arrived',
            time: event.timestamp,
            color: 'blue'
          })
          break
        case 'completed':
          timeline.push({
            icon: CheckCircle,
            title: 'Job Completed',
            time: event.timestamp,
            description: 'Vehicle delivered successfully',
            color: 'green'
          })
          break
        case 'message_sent':
          timeline.push({
            icon: MessageSquare,
            title: 'Message Sent',
            time: event.timestamp,
            description: event.data?.preview as string,
            color: 'blue'
          })
          break
      }
    }
  }
  
  // Sort timeline by time descending
  timeline.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  const vehicleDisplay = jobData.vehicleMake 
    ? `${jobData.vehicleColor || ''} ${jobData.vehicleYear || ''} ${jobData.vehicleMake} ${jobData.vehicleModel}`.trim()
    : jobData.rego

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <span className="font-display font-bold">Eek Mechanical</span>
              <span className="text-xs text-zinc-500 block">Customer Portal</span>
            </div>
          </Link>
          <a href="tel:0800769000" className="text-sm text-zinc-400 hover:text-white flex items-center gap-2">
            <Phone className="w-4 h-4" />
            0800 769 000
          </a>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Payment Confirmation Celebration */}
        {showConfirmation && (
          <div className="bg-gradient-to-r from-green-500/20 via-green-500/10 to-green-500/20 border border-green-500/40 rounded-2xl p-6 mb-6 text-center relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-500" />
            </div>
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-green-400 mb-2">
                🎉 Payment Confirmed!
              </h2>
              <p className="text-zinc-300 mb-2">
                Your tow truck is on the way
              </p>
              <p className="text-zinc-500 text-sm mb-4">
                We&apos;ve sent you an SMS and email confirmation. Your driver will call when they&apos;re nearby.
              </p>
              <button
                onClick={() => setShowConfirmation(false)}
                className="text-green-400 hover:text-green-300 text-sm underline underline-offset-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div className={`bg-${status.color}-500/10 border border-${status.color}-500/30 rounded-2xl p-6 mb-6 text-center`}
          style={{ 
            backgroundColor: `rgb(var(--${status.color === 'green' ? '34 197 94' : status.color === 'blue' ? '59 130 246' : status.color === 'orange' ? '249 115 22' : status.color === 'yellow' ? '234 179 8' : status.color === 'purple' ? '168 85 247' : '239 68 68'}) / 0.1)`,
            borderColor: `rgb(var(--${status.color === 'green' ? '34 197 94' : status.color === 'blue' ? '59 130 246' : status.color === 'orange' ? '249 115 22' : status.color === 'yellow' ? '234 179 8' : status.color === 'purple' ? '168 85 247' : '239 68 68'}) / 0.3)`
          }}
        >
          <StatusIcon className={`w-12 h-12 mx-auto mb-3 text-${status.color}-500`}
            style={{ color: status.color === 'green' ? '#22c55e' : status.color === 'blue' ? '#3b82f6' : status.color === 'orange' ? '#f97316' : status.color === 'yellow' ? '#eab308' : status.color === 'purple' ? '#a855f7' : '#ef4444' }}
          />
          <h1 className="text-2xl font-display font-bold mb-1">{status.label}</h1>
          {status.description && (
            <p className="text-zinc-400 text-sm mt-1">{status.description}</p>
          )}
          {jobData.eta && jobData.status !== 'completed' && (
            <p className="text-zinc-400 mt-2">ETA: {jobData.eta}</p>
          )}
          <p className="text-zinc-500 text-sm mt-2">Ref: {jobData.bookingId}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'status', label: 'Timeline', icon: Clock },
            { id: 'messages', label: 'Messages', icon: MessageSquare, badge: messages.length },
            { id: 'details', label: 'Details', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-red text-white'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge ? (
                <span className="bg-zinc-700 text-xs px-2 py-0.5 rounded-full">{tab.badge}</span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Timeline Tab */}
        {activeTab === 'status' && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="font-bold text-lg mb-6">Job Timeline</h2>
            
            <div className="space-y-4">
              {timeline.map((event, i) => {
                const EventIcon = event.icon
                const colorClass = event.color === 'green' ? '#22c55e' : event.color === 'blue' ? '#3b82f6' : event.color === 'orange' ? '#f97316' : event.color === 'purple' ? '#a855f7' : '#71717a'
                
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: `${colorClass}20` }}
                      >
                        <EventIcon className="w-5 h-5" style={{ color: colorClass }} />
                      </div>
                      {i < timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-zinc-800 my-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium text-white">{event.title}</p>
                      {event.description && (
                        <p className="text-zinc-400 text-sm">{event.description}</p>
                      )}
                      <p className="text-zinc-600 text-xs mt-1">
                        {new Date(event.time).toLocaleString('en-NZ')}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Supplier Info */}
            {jobData.supplierName && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <h3 className="font-medium text-sm text-zinc-500 mb-3">Your Towing Company</h3>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{jobData.supplierName}</p>
                      {jobData.supplierPhone && (
                        <a 
                          href={`tel:${jobData.supplierPhone}`}
                          className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1 mt-1"
                        >
                          <Phone className="w-3 h-3" />
                          {jobData.supplierPhone}
                        </a>
                      )}
                    </div>
                    {jobData.supplierPhone && (
                      <a 
                        href={`tel:${jobData.supplierPhone}`}
                        className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors"
                        title="Call towing company"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-bold">Chat with Eek Mechanical</h2>
              <span className="text-xs text-zinc-500">Auto-updates every 30s</span>
            </div>
            
            {/* Chat Messages - matching admin comms style */}
            <div className="p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-zinc-500 text-center py-8 text-sm">No messages yet. Send us a message below!</p>
              ) : (
                messages.map((msg, i) => {
                  const isCustomer = msg.from === 'customer'
                  
                  const formatTime = (ts: string) => {
                    const date = new Date(ts)
                    const now = new Date()
                    const diff = now.getTime() - date.getTime()
                    if (diff < 60000) return 'now'
                    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
                    return date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })
                  }
                  
                  // Customer messages on right, Eek Mechanical on left
                  const align = isCustomer ? 'justify-end' : 'justify-start'
                  const bgColor = isCustomer 
                    ? 'bg-red/20 border-red/30' 
                    : 'bg-zinc-800 border-zinc-700'
                  const textColor = isCustomer 
                    ? 'text-red-200' 
                    : 'text-zinc-300'
                  const senderLabel = isCustomer ? 'You' : 'Eek Mechanical'
                  
                  return (
                    <div key={i} className={`flex ${align}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl border ${bgColor} ${isCustomer ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${textColor}`}>{senderLabel}</span>
                          <span className="text-zinc-500 text-xs">{formatTime(msg.timestamp)}</span>
                        </div>
                        <p className="text-white text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-4 border-t border-zinc-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={submitting || !message.trim()}
                  className="bg-red hover:bg-red/90 disabled:opacity-50 text-white px-5 rounded-xl transition-colors flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </div>

              {submitSuccess && (
                <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Sent!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Vehicle & Route */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-bold text-lg mb-4">Booking Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <Car className="w-6 h-6 text-red" />
                  <div>
                    <p className="text-zinc-500 text-xs">Vehicle</p>
                    <p className="font-bold">{vehicleDisplay}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                  <CircleDot className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="text-zinc-500 text-xs">Pickup</p>
                    <p className="text-white">{jobData.pickupLocation}</p>
                  </div>
                </div>
                
                {jobData.dropoffLocation && (
                  <div className="flex items-start gap-4 p-4 bg-zinc-800/50 rounded-xl">
                    <MapPin className="w-6 h-6 text-red" />
                    <div>
                      <p className="text-zinc-500 text-xs">Drop-off</p>
                      <p className="text-white">{jobData.dropoffLocation}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Receipt */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
              <h2 className="font-bold text-lg mb-4">Payment</h2>
              
              <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-bold text-green-500">Paid</p>
                    <p className="text-zinc-500 text-xs">Payment confirmed</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-green-500">
                  ${(jobData.price / 100).toFixed(2)}
                </p>
              </div>
              
              {/* Invoice/Receipt Link */}
              <a 
                href={`/invoice/${jobData.bookingId}`}
                target="_blank"
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                View Invoice
              </a>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            Need help? Call <a href="tel:0800769000" className="text-red hover:underline">0800 769 000</a>
          </p>
          <p className="mt-1 text-zinc-600">Available 24/7</p>
        </div>
      </div>
    </main>
  )
}
