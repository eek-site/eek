'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  MessageSquare, Send, CheckCircle, AlertCircle, User, Building2, 
  Phone, Mail, Loader2, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react'

interface Props {
  user: { email: string; name: string; role: string } | null
  initialRego?: string
}

interface Message {
  from: string
  name?: string
  message: string
  timestamp: string
}

interface JobWithMessages {
  rego: string
  bookingId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  supplierName?: string
  supplierPhone?: string
  supplierEmail?: string
  pickupLocation?: string
  dropoffLocation?: string
  status: string
  messages: Message[]
  expanded?: boolean
}

export default function CommsForm({ user, initialRego }: Props) {
  const [jobs, setJobs] = useState<JobWithMessages[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [highlightedRego, setHighlightedRego] = useState<string | null>(initialRego || null)
  
  // Reply state per job
  const [replyTo, setReplyTo] = useState<{ rego: string; target: 'customer' | 'supplier' } | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)

  // Fetch all open jobs with messages
  const fetchJobsWithMessages = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      // Fetch all jobs
      const jobsResponse = await fetch('/api/jobs')
      const jobsData = await jobsResponse.json()
      
      if (!jobsData.success) {
        setError('Failed to load jobs')
        return
      }
      
      // Filter to open jobs only (not closed/cancelled)
      const openJobs = jobsData.jobs.filter((j: any) => 
        !['closed', 'cancelled', 'completed'].includes(j.status)
      )
      
      // Fetch messages for each job - ONLY by bookingId (unique per job)
      // Do NOT fetch by rego - multiple jobs can share same rego
      const jobsWithMessages = await Promise.all(
        openJobs.map(async (job: any) => {
          try {
            let messages: any[] = []
            
            // Only fetch by bookingId - this is unique per job
            const jobRef = job.bookingId
            if (jobRef) {
              try {
                const msgResponse = await fetch(`/api/messages/${jobRef}`)
                const msgData = await msgResponse.json()
                console.log(`Messages for ${jobRef}:`, msgData.messages?.length || 0)
                if (msgData.success && msgData.messages?.length > 0) {
                  messages = msgData.messages
                }
              } catch (e) {
                console.error(`Error fetching messages for ${jobRef}:`, e)
              }
            }
            
            // Sort by timestamp (oldest first)
            messages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
            return {
              rego: job.rego,
              bookingId: job.bookingId,
              customerName: job.customerName || 'Customer',
              customerPhone: job.customerPhone || '',
              customerEmail: job.customerEmail || '',
              supplierName: job.supplierName || '',
              supplierPhone: job.supplierPhone || '',
              supplierEmail: job.supplierEmail || '',
              pickupLocation: job.pickupLocation || '',
              dropoffLocation: job.dropoffLocation || '',
              status: job.status,
              messages: messages, // Already sorted oldest first
              expanded: true // Default expanded
            }
          } catch {
            return {
              ...job,
              messages: [],
              expanded: true
            }
          }
        })
      )
      
      // Sort by most recent message or creation
      jobsWithMessages.sort((a, b) => {
        const aTime = a.messages[a.messages.length - 1]?.timestamp || ''
        const bTime = b.messages[b.messages.length - 1]?.timestamp || ''
        return bTime.localeCompare(aTime)
      })
      
      setJobs(jobsWithMessages)
    } catch (e) {
      setError('Failed to load jobs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchJobsWithMessages()
    
    // Auto-refresh every 15 seconds
    const interval = setInterval(() => fetchJobsWithMessages(true), 15000)
    return () => clearInterval(interval)
  }, [])
  
  // Scroll to highlighted job when it's loaded
  useEffect(() => {
    if (highlightedRego && jobs.length > 0) {
      const el = document.getElementById(`comms-job-${highlightedRego}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Clear highlight after scroll
        setTimeout(() => setHighlightedRego(null), 2000)
      }
    }
  }, [highlightedRego, jobs])

  const toggleExpand = (rego: string) => {
    setJobs(prev => prev.map(j => 
      j.rego === rego ? { ...j, expanded: !j.expanded } : j
    ))
  }

  const startReply = (rego: string, target: 'customer' | 'supplier') => {
    setReplyTo({ rego, target })
    setReplyMessage('')
  }

  const sendReply = async () => {
    if (!replyTo || !replyMessage.trim()) return
    
    const job = jobs.find(j => j.rego === replyTo.rego)
    if (!job) return
    
    const phone = replyTo.target === 'customer' ? job.customerPhone : job.supplierPhone
    const email = replyTo.target === 'customer' ? job.customerEmail : job.supplierEmail
    const name = replyTo.target === 'customer' ? job.customerName : job.supplierName
    
    if (!phone && !email) {
      setError(`No contact info for ${replyTo.target}`)
      return
    }
    
    setSending(true)
    
    try {
      // Send via SMS/email
      const hasPhone = !!phone
      const hasEmail = !!email
      const method = hasPhone && hasEmail ? 'both' : hasEmail ? 'email' : 'sms'
      
      // Build portal link for reply
      let portalLink: string | undefined
      if (replyTo.target === 'customer') {
        portalLink = `${window.location.origin}/customer/${job.bookingId || job.rego}`
      } else if (replyTo.target === 'supplier' && job.supplierName) {
        // Fetch supplier portal code
        try {
          const supplierRes = await fetch(`/api/suppliers/${encodeURIComponent(job.supplierName)}`)
          const supplierData = await supplierRes.json()
          if (supplierData.success && supplierData.supplier?.portalCode) {
            portalLink = `${window.location.origin}/portal/${supplierData.supplier.portalCode}`
          }
        } catch (e) {
          console.error('Failed to fetch supplier portal code:', e)
        }
      }
      
      // Get recent message history for context (last 5 messages)
      const recentMessages = job.messages.slice(-5).map(m => ({
        from: m.from,
        message: m.message,
        timestamp: m.timestamp
      }))
      
      await fetch('/api/send-booking-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: replyMessage.trim(),
          phone,
          email,
          customerName: name || replyTo.target,
          price: '',
          eta: '',
          method,
          isComms: true,
          // Pass job context for comms
          vehicleRego: job.rego,
          bookingId: job.bookingId,
          pickupLocation: job.pickupLocation,
          dropoffLocation: job.dropoffLocation,
          commsTarget: replyTo.target,
          portalLink,
          messageHistory: recentMessages
        })
      })
      
      // Store in messages database (use bookingId as primary key)
      const jobRef = job.bookingId || job.rego
      const saveResponse = await fetch(`/api/messages/${jobRef}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyMessage.trim(),
          from: `hook_towing_to_${replyTo.target}`
        })
      })
      
      const saveResult = await saveResponse.json()
      console.log('Message saved to:', jobRef, saveResult)
      
      if (!saveResult.success) {
        console.error('Failed to save message:', saveResult.error)
      }
      
      // Update local state
      setJobs(prev => prev.map(j => 
        j.rego === replyTo.rego 
          ? { 
              ...j, 
              messages: [...j.messages, {
                from: `hook_towing_to_${replyTo.target}`,
                message: replyMessage.trim(),
                timestamp: new Date().toISOString()
              }]
            }
          : j
      ))
      
      setReplyTo(null)
      setReplyMessage('')
    } catch (e) {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })
    return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })
  }

  const getMessageAlignment = (from: string) => {
    // Hook messages (what admin sends) = LEFT
    // Customer/Supplier replies = RIGHT
    if (from.includes('hook') || from.includes('to_')) return 'justify-start'
    if (from === 'customer') return 'justify-end'
    if (from.startsWith('supplier') || from.includes('supplier')) return 'justify-end'
    return 'justify-center'
  }

  const getMessageStyle = (from: string) => {
    // Hook to customer = blue, LEFT side bubble
    if (from.includes('to_customer')) {
      return 'bg-blue-600 text-white rounded-2xl rounded-bl-sm'
    }
    // Hook to supplier = orange, LEFT side bubble
    if (from.includes('to_supplier')) {
      return 'bg-orange-600 text-white rounded-2xl rounded-bl-sm'
    }
    // Generic hook message (old data)
    if (from.includes('hook')) {
      return 'bg-zinc-600 text-white rounded-2xl rounded-bl-sm'
    }
    // Customer reply = blue, RIGHT side bubble  
    if (from === 'customer') {
      return 'bg-blue-500/30 text-blue-200 rounded-2xl rounded-br-sm border border-blue-500/50'
    }
    // Supplier reply = orange, RIGHT side bubble
    if (from.startsWith('supplier') || from.includes('supplier')) {
      return 'bg-orange-500/30 text-orange-200 rounded-2xl rounded-br-sm border border-orange-500/50'
    }
    return 'bg-zinc-700 text-white rounded-2xl'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-red animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-red" />
          <h2 className="text-xl font-bold">Messages</h2>
          <span className="bg-zinc-800 px-2 py-0.5 rounded text-sm text-zinc-400">
            {jobs.length} open jobs
          </span>
        </div>
        <button
          onClick={() => fetchJobsWithMessages(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <span>Customer (blue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-600 rounded-full" />
          <span>Supplier (orange)</span>
        </div>
        <div className="text-zinc-600">|</div>
        <div>Your msgs = LEFT, Replies = RIGHT</div>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <div className="bg-zinc-900 rounded-2xl p-12 text-center border border-zinc-800">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
          <p className="text-zinc-400">No open jobs</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div 
              key={job.rego} 
              id={`comms-job-${job.rego}`}
              className={`bg-zinc-900 rounded-2xl border overflow-hidden transition-colors ${
                highlightedRego === job.rego ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-zinc-800'
              }`}
            >
              {/* Job Header */}
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                onClick={() => toggleExpand(job.rego)}
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono text-red font-bold">{job.rego}</div>
                  <div className="text-sm text-zinc-400">
                    <span className="text-blue-400">{job.customerName}</span>
                    {job.supplierName && (
                      <>
                        <span className="mx-2">↔</span>
                        <span className="text-orange-400">{job.supplierName}</span>
                      </>
                    )}
                  </div>
                  {job.messages.length > 0 && (
                    <span className="bg-zinc-800 px-2 py-0.5 rounded text-xs text-zinc-500">
                      {job.messages.length} msgs
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {/* Quick contact buttons */}
                  {job.customerPhone && (
                    <a 
                      href={`tel:${job.customerPhone}`}
                      onClick={e => e.stopPropagation()}
                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                      title={`Call ${job.customerName}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {job.supplierPhone && (
                    <a 
                      href={`tel:${job.supplierPhone}`}
                      onClick={e => e.stopPropagation()}
                      className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                      title={`Call ${job.supplierName}`}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {job.expanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>

              {/* Messages */}
              {job.expanded && (
                <div className="border-t border-zinc-800">
                  {/* Message Thread */}
                  <div className="p-4 space-y-2">
                    {job.messages.length === 0 ? (
                      <p className="text-center text-zinc-600 py-4 text-sm">No messages yet</p>
                    ) : (
                      job.messages.map((msg, i) => (
                        <div key={i} className={`flex ${getMessageAlignment(msg.from)}`}>
                          <div className={`max-w-[70%] px-4 py-2 ${getMessageStyle(msg.from)}`}>
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className="text-[10px] opacity-60 mt-1">{formatTime(msg.timestamp)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Reply Bar */}
                  <div className="p-3 border-t border-zinc-800 bg-zinc-950">
                    {replyTo?.rego === job.rego ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-zinc-500">Replying to:</span>
                          <span className={replyTo.target === 'customer' ? 'text-blue-400' : 'text-orange-400'}>
                            {replyTo.target === 'customer' ? job.customerName : job.supplierName}
                          </span>
                          <button 
                            onClick={() => setReplyTo(null)}
                            className="text-zinc-500 hover:text-white ml-auto"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyMessage}
                            onChange={e => setReplyMessage(e.target.value)}
                            placeholder="Type message..."
                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                            onKeyDown={e => e.key === 'Enter' && sendReply()}
                            autoFocus
                          />
                          <button
                            onClick={sendReply}
                            disabled={sending || !replyMessage.trim()}
                            className="bg-red hover:bg-red/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startReply(job.rego, 'customer')}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 py-2 rounded-lg text-sm transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Reply to Customer
                        </button>
                        {job.supplierName && (
                          <button
                            onClick={() => startReply(job.rego, 'supplier')}
                            className="flex-1 flex items-center justify-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 py-2 rounded-lg text-sm transition-colors"
                          >
                            <Building2 className="w-4 h-4" />
                            Reply to Supplier
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
