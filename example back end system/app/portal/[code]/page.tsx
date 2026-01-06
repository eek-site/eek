'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import { 
  MessageSquare, Send, CheckCircle, AlertCircle, 
  Phone, Loader2, RefreshCw, ChevronDown, ChevronUp,
  MapPin, Car, DollarSign, Clock, Building2, FileText,
  Receipt, CreditCard, Truck, Navigation, Upload, Link as LinkIcon, ArrowRight
} from 'lucide-react'

interface Message {
  from: string
  message: string
  timestamp: string
}

interface HistoryEvent {
  action: string
  timestamp: string
  by?: string
  data?: Record<string, unknown>
}

interface JobData {
  rego: string
  bookingId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  price?: number
  supplierPrice?: number
  status: string
  createdAt: string
  messages?: Message[]
  history?: HistoryEvent[]
  expanded?: boolean
  activeTab?: 'timeline' | 'messages' | 'invoice'
  // Invoice data
  supplierInvoiceRef?: string
  supplierInvoiceAmount?: number
  supplierXeroLink?: string
  supplierInvoiceSubmittedAt?: string
  // Payment approval
  supplierPaymentApproved?: boolean
  supplierApprovedAmount?: number
  supplierApprovedAt?: string
  supplierPaidAt?: string
}

interface SupplierData {
  name: string
  legalName?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  postcode?: string
  bankName?: string
  bankAccount?: string
  bankAccountName?: string
  gstNumber?: string
}

export default function SupplierPortalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const code = params.code as string
  
  // Check if a specific job should be highlighted from URL
  const highlightJob = searchParams.get('job')
  const urlTab = searchParams.get('tab') // 'messages' or 'invoice'
  const acceptCode = searchParams.get('accept') // Job-specific link code to accept
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supplier, setSupplier] = useState<SupplierData | null>(null)
  const [openJobs, setOpenJobs] = useState<JobData[]>([])
  const [closedJobs, setClosedJobs] = useState<JobData[]>([])
  const [showClosed, setShowClosed] = useState(false)
  
  // Reply state
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sending, setSending] = useState(false)
  
  // Invoice submission state
  const [invoiceJobId, setInvoiceJobId] = useState<string | null>(null)
  const [invoiceRef, setInvoiceRef] = useState('')
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceType, setInvoiceType] = useState<'none' | 'upload' | 'xero'>('none')
  const [xeroLink, setXeroLink] = useState('')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [uploadingInvoice, setUploadingInvoice] = useState(false)
  const [submittingInvoice, setSubmittingInvoice] = useState(false)
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null)
  
  // Job completion state
  const [completingJob, setCompletingJob] = useState<string | null>(null)
  const [jobCompleted, setJobCompleted] = useState<string | null>(null)
  
  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState<Partial<SupplierData>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  
  // Job acceptance state
  const [pendingAcceptance, setPendingAcceptance] = useState<string | null>(acceptCode)
  const [acceptingJob, setAcceptingJob] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState<string | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  
  // Track if this is the first load (for URL params to apply only once)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Use ref to track current job state (avoids stale closure in interval)
  const openJobsRef = useRef<JobData[]>([])
  
  // Keep ref in sync with state
  useEffect(() => {
    openJobsRef.current = openJobs
  }, [openJobs])

  const fetchPortalData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const response = await fetch(`/api/supplier-portal/${code}`)
      const data = await response.json()
      
      if (!data.success) {
        setError(data.error || 'Failed to load portal')
        return
      }
      
      setSupplier(data.supplier)
      
      // On refresh, preserve user's current tab selections
      if (isRefresh) {
        // Create a map of current job tabs from the REF (not stale state)
        const currentJobs = openJobsRef.current
        const currentTabs = new Map(currentJobs.map(j => [j.rego, j.activeTab]))
        const currentExpanded = new Map(currentJobs.map(j => [j.rego, j.expanded]))
        
        const jobsWithPreservedState = data.openJobs.map((j: JobData) => ({
          ...j,
          expanded: currentExpanded.get(j.rego) ?? true,
          activeTab: currentTabs.get(j.rego) ?? 'timeline' as const,
          messages: (j.messages || []).sort((a: Message, b: Message) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        }))
        setOpenJobs(jobsWithPreservedState)
      } else {
        // Initial load - apply URL params
        const jobsWithSortedMessages = data.openJobs.map((j: JobData) => ({
          ...j,
          expanded: true,
          activeTab: (isInitialLoad && urlTab && (urlTab === 'messages' || urlTab === 'invoice')) ? urlTab as 'messages' | 'invoice' : 'timeline' as const,
          messages: (j.messages || []).sort((a: Message, b: Message) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        }))
        setOpenJobs(jobsWithSortedMessages)
        setIsInitialLoad(false)
      }
      
      setClosedJobs(data.closedJobs.map((j: JobData) => ({
        ...j,
        activeTab: 'timeline' as const
      })))
      
      // If URL has job param, scroll to that job (only on initial load)
      if (highlightJob && !isRefresh) {
        setTimeout(() => {
          const el = document.getElementById(`job-${highlightJob}`)
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      }
    } catch (e) {
      setError('Failed to load portal')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPortalData()
    
    // Store portal code for PWA
    if (code) {
      try {
        localStorage.setItem('supplier-portal-code', code)
        sessionStorage.setItem('supplier-portal-code', code)
        document.cookie = `supplier-portal-code=${code}; path=/; max-age=31536000; SameSite=Lax`
      } catch (e) {
        // Storage might not be available
      }
    }
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed - non-critical
      })
    }
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchPortalData(true), 30000)
    return () => clearInterval(interval)
  }, [code])

  const toggleExpand = (rego: string) => {
    setOpenJobs(prev => prev.map(j => 
      j.rego === rego ? { ...j, expanded: !j.expanded } : j
    ))
  }

  const setJobTab = (rego: string, tab: 'timeline' | 'messages' | 'invoice') => {
    setOpenJobs(prev => prev.map(j => 
      j.rego === rego ? { ...j, activeTab: tab, expanded: true } : j
    ))
  }

  const sendMessage = async (job: JobData) => {
    if (!replyMessage.trim()) return
    
    setSending(true)
    
    try {
      await fetch(`/api/supplier-portal/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rego: job.rego,
          bookingId: job.bookingId,
          message: replyMessage.trim()
        })
      })
      
      // Update local state
      setOpenJobs(prev => prev.map(j => 
        j.rego === job.rego 
          ? { 
              ...j, 
              messages: [...(j.messages || []), { // Append to end (newest at bottom)
                from: `supplier:${supplier?.name}`,
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

  const submitInvoice = async (job: JobData) => {
    if (!invoiceRef.trim()) return
    
    // Validate amount - if not locked by Eek Mechanical, must provide amount
    const finalAmount = job.supplierPrice || (invoiceAmount ? parseFloat(invoiceAmount) * 100 : 0)
    if (!finalAmount) {
      setError('Please enter an invoice amount')
      return
    }
    
    setSubmittingInvoice(true)
    try {
      let invoiceFileUrl: string | undefined
      
      // Upload file if provided
      if (invoiceType === 'upload' && invoiceFile) {
        setUploadingInvoice(true)
        const formData = new FormData()
        formData.append('file', invoiceFile)
        formData.append('bookingId', job.bookingId || job.rego)
        formData.append('rego', job.rego)
        formData.append('supplierName', supplier?.name || 'Supplier')
        formData.append('amount', (finalAmount / 100).toString())
        
        const uploadRes = await fetch('/api/upload-invoice', {
          method: 'POST',
          body: formData
        })
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          invoiceFileUrl = uploadData.url
        } else {
          throw new Error('Failed to upload invoice file')
        }
        setUploadingInvoice(false)
      }
      
      const response = await fetch(`/api/supplier-portal/${code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: job.bookingId,
          rego: job.rego,
          invoiceRef: invoiceRef.trim(),
          invoiceAmount: finalAmount,
          xeroLink: invoiceType === 'xero' ? xeroLink.trim() : undefined,
          invoiceFileUrl: invoiceFileUrl
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setOpenJobs(prev => prev.map(j => 
          j.rego === job.rego 
            ? { 
                ...j, 
                supplierInvoiceRef: invoiceRef.trim(),
                supplierInvoiceAmount: finalAmount,
                supplierXeroLink: invoiceType === 'xero' ? xeroLink.trim() : invoiceFileUrl,
                supplierInvoiceSubmittedAt: new Date().toISOString()
              }
            : j
        ))
        setInvoiceSuccess(job.rego)
        setInvoiceJobId(null)
        setInvoiceRef('')
        setInvoiceAmount('')
        setXeroLink('')
        setInvoiceFile(null)
        setInvoiceType('none')
        setTimeout(() => setInvoiceSuccess(null), 3000)
      } else {
        setError(data.error || 'Failed to submit invoice')
      }
    } catch (e) {
      setError('Failed to submit invoice')
    } finally {
      setSubmittingInvoice(false)
      setUploadingInvoice(false)
    }
  }

  // Complete a job - same actions as Eek Mechanical closing the job
  const completeJob = async (job: JobData) => {
    setCompletingJob(job.rego)
    setError(null)
    
    try {
      // 1. Update job status to completed (this triggers auto-send buyer invoice if needed)
      const response = await fetch(`/api/jobs/${job.bookingId || job.rego}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          completedAt: new Date().toISOString(),
          completedBy: `supplier:${supplier?.name}`,
          _updatedBy: `supplier:${supplier?.name}`
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to complete job')
      }
      
      // 2. Send customer invoice (paid receipt, not payment link) - same as Eek Mechanical
      try {
        await fetch('/api/send-customer-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: job.bookingId
          })
        })
      } catch (invoiceError) {
        console.error('Failed to send customer invoice:', invoiceError)
        // Don't fail the completion - invoice can be sent manually
      }
      
      // 3. Update local state
      setOpenJobs(prev => prev.map(j => 
        j.rego === job.rego 
          ? { ...j, status: 'completed', completedAt: new Date().toISOString() }
          : j
      ))
      setJobCompleted(job.rego)
      setTimeout(() => setJobCompleted(null), 5000)
      
      // 4. Notify Eek Mechanical with appropriate message
      const paymentStatus = job.supplierPaidAt 
        ? ' Payment already received.' 
        : job.supplierPaymentApproved 
          ? ' Payment approved, awaiting transfer.' 
          : !job.supplierPrice 
            ? ' Price to be confirmed.' 
            : ''
      
      await fetch('/api/supplier-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: job.bookingId,
          rego: job.rego,
          supplierName: supplier?.name,
          message: `✅ Job completed! Vehicle ${job.rego} delivered successfully.${paymentStatus}`,
          type: 'job_completed'
        })
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to complete job')
    } finally {
      setCompletingJob(null)
    }
  }

  // Accept a job
  const acceptJob = async (job: JobData) => {
    setAcceptingJob(true)
    try {
      // Update the supplier-link or supplier-job status
      if (pendingAcceptance) {
        await fetch(`/api/supplier-job/${pendingAcceptance}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'accepted' })
        })
      }
      
      // Update the main job status
      await fetch(`/api/jobs/${job.bookingId || job.rego}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'in_progress',
          _updatedBy: `supplier:${supplier?.name}`
        })
      })
      
      // Update local state
      setOpenJobs(prev => prev.map(j => 
        j.rego === job.rego ? { ...j, status: 'in_progress' } : j
      ))
      
      setPendingAcceptance(null)
      // Clear the URL params
      window.history.replaceState({}, '', `/portal/${code}`)
    } catch (e) {
      setError('Failed to accept job')
    } finally {
      setAcceptingJob(false)
    }
  }

  // Decline a job
  const declineJob = async (job: JobData) => {
    setAcceptingJob(true)
    try {
      // Update the supplier-link or supplier-job status
      if (pendingAcceptance) {
        await fetch('/api/supplier-job/decline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref: pendingAcceptance,
            reason: declineReason.trim()
          })
        })
      }
      
      // Remove from local state
      setOpenJobs(prev => prev.filter(j => j.rego !== job.rego))
      
      setShowDeclineModal(null)
      setDeclineReason('')
      setPendingAcceptance(null)
      // Clear the URL params
      window.history.replaceState({}, '', `/portal/${code}`)
    } catch (e) {
      setError('Failed to decline job')
    } finally {
      setAcceptingJob(false)
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

  const getMessageStyle = (from: string) => {
    // Supplier's own messages on RIGHT (orange)
    if (from.includes('supplier')) {
      return 'bg-orange-500/30 text-orange-200 rounded-2xl rounded-br-sm border border-orange-500/50'
    }
    // Hook messages to supplier on LEFT (orange tint)
    if (from.includes('hook') || from.includes('to_')) {
      return 'bg-orange-600 text-white rounded-2xl rounded-bl-sm'
    }
    // Customer messages (shouldn't see in supplier view, but just in case)
    return 'bg-zinc-700 text-white rounded-2xl rounded-bl-sm'
  }

  const getMessageAlignment = (from: string) => {
    if (from.includes('supplier')) return 'justify-end'
    return 'justify-start'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red animate-spin" />
      </main>
    )
  }

  if (error || !supplier) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Portal Error</h1>
          <p className="text-zinc-400 mb-6">{error || 'Invalid portal link'}</p>
          <a href="tel:0800769000" className="text-red hover:underline">
            Call 0800 769 000
          </a>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header - matches customer portal */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <span className="font-display font-bold">Eek Mechanical</span>
              <span className="text-xs text-zinc-500 block">Supplier Portal</span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <NotificationBell portalCode={code} />
            <button
              onClick={() => fetchPortalData(true)}
              disabled={refreshing}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="tel:0800769000" className="text-sm text-zinc-400 hover:text-white flex items-center gap-2 hidden sm:flex">
              <Phone className="w-4 h-4" />
              0800 769 000
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Supplier Banner - similar to customer status banner */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 mb-6 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-orange-500" />
          <h1 className="text-2xl font-display font-bold mb-1">{supplier.name}</h1>
          <p className="text-zinc-400 text-sm">Supplier Portal</p>
          
          {/* Stats inline */}
          <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-orange-500/20">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-500">{openJobs.length}</div>
              <div className="text-zinc-500 text-xs">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">{closedJobs.length}</div>
              <div className="text-zinc-500 text-xs">Completed</div>
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        {openJobs.length === 0 ? (
          <div className="bg-zinc-900 rounded-2xl p-8 text-center border border-zinc-800">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-zinc-400">No active jobs</p>
            <p className="text-zinc-600 text-sm mt-1">New jobs will appear here when assigned</p>
          </div>
        ) : (
          <div className="space-y-6">
            {openJobs.map(job => (
              <div 
                key={job.rego} 
                id={`job-${job.bookingId || job.rego}`}
                className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden"
              >
                {/* Job Header - always visible */}
                <div 
                  className="p-6 cursor-pointer hover:bg-zinc-800/30 transition-colors"
                  onClick={() => toggleExpand(job.rego)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                        <Car className="w-6 h-6 text-orange-500" />
                      </div>
                      <div>
                        <div className="font-mono text-xl font-bold text-white">{job.rego}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          job.status === 'awaiting_supplier' ? 'bg-yellow-500/20 text-yellow-400' :
                          job.status === 'in_progress' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          'bg-zinc-700 text-zinc-300'
                        }`}>
                          {job.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {job.supplierPrice && job.supplierPrice > 0 && (
                        <div className="text-right">
                          <p className="text-zinc-500 text-xs">Your Rate</p>
                          <p className="text-green-500 font-bold text-lg">${(job.supplierPrice / 100).toFixed(2)}</p>
                        </div>
                      )}
                      {job.expanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                    </div>
                  </div>
                  
                  {/* Route summary */}
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span>{job.pickupLocation?.split(',')[0]}</span>
                    </div>
                    {job.dropoffLocation && (
                      <>
                        <span className="text-zinc-600">→</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red" />
                          <span>{job.dropoffLocation.split(',')[0]}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Job Acceptance Banner - show for pending/awaiting jobs or if this job matches the accept code */}
                {(job.status === 'pending' || job.status === 'awaiting_supplier' || job.status === 'assigned' || pendingAcceptance) && job.status !== 'in_progress' && job.status !== 'completed' && (
                  <div className="border-t border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-zinc-900 p-6">
                    <div className="text-center mb-4">
                      <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm font-bold mb-3">
                        <AlertCircle className="w-4 h-4" />
                        New Job Request
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Accept this job?</h3>
                      <p className="text-zinc-400 text-sm">
                        {job.customerName ? `${job.customerName} needs your help` : 'A customer needs your help'}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => acceptJob(job)}
                        disabled={acceptingJob}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {acceptingJob ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Accept Job
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeclineModal(job.rego)}
                        disabled={acceptingJob}
                        className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 text-zinc-300 font-medium py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Content */}
                {job.expanded && (
                  <div className="border-t border-zinc-800">
                    {/* Job Flow Section Title */}
                    <div className="px-4 pt-4 pb-2">
                      <h3 className="font-bold text-lg text-white">Job Flow</h3>
                    </div>
                    
                    {/* Tab Navigation - styled like customer portal */}
                    <div className="flex gap-2 p-4 bg-zinc-800/30">
                      {[
                        { id: 'timeline', label: 'Job Details', icon: Clock },
                        { id: 'messages', label: 'Messages', icon: MessageSquare, badge: job.messages?.length },
                        { id: 'invoice', label: 'Get Paid', icon: ArrowRight }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setJobTab(job.rego, tab.id as 'timeline' | 'messages' | 'invoice')}
                          className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                            job.activeTab === tab.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                          {tab.badge ? (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${job.activeTab === tab.id ? 'bg-orange-600' : 'bg-zinc-700'}`}>{tab.badge}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>

                      {/* Job Details Tab */}
                      {job.activeTab === 'timeline' && (
                        <div className="p-6">
                          <h2 className="font-bold text-lg mb-6">Job Details</h2>
                          
                          <div className="space-y-4">
                            {/* Job created */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(113, 113, 122, 0.2)' }}>
                                  <FileText className="w-5 h-5 text-zinc-400" />
                                </div>
                                <div className="w-0.5 flex-1 bg-zinc-800 my-2" />
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium text-white">Job Created</p>
                                <p className="text-zinc-600 text-xs mt-1">{new Date(job.createdAt).toLocaleString('en-NZ')}</p>
                              </div>
                            </div>
                            
                            {/* Assigned to you */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(249, 115, 22, 0.2)' }}>
                                  <Building2 className="w-5 h-5 text-orange-500" />
                                </div>
                                <div className="w-0.5 flex-1 bg-zinc-800 my-2" />
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="font-medium text-white">Assigned to You</p>
                                <p className="text-zinc-400 text-sm">{supplier?.name}</p>
                              </div>
                            </div>
                            
                            {/* Current Status */}
                            <div className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                                  {job.status === 'in_progress' ? (
                                    <Navigation className="w-5 h-5 text-green-500" />
                                  ) : job.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Truck className="w-5 h-5 text-green-500" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white">Status: {job.status.replace(/_/g, ' ')}</p>
                                <p className="text-zinc-400 text-sm">Current job status</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Customer Info */}
                          <div className="mt-6 pt-6 border-t border-zinc-800">
                            <h3 className="font-medium text-sm text-zinc-500 mb-3">Customer Contact</h3>
                            <div className="bg-zinc-800/50 rounded-xl p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                                  <Phone className="w-6 h-6 text-green-500" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-bold">{job.customerName || 'Customer'}</p>
                                  {job.customerPhone && (
                                    <a 
                                      href={`tel:${job.customerPhone}`}
                                      className="text-green-500 hover:text-green-400 text-sm flex items-center gap-1 mt-1"
                                    >
                                      <Phone className="w-3 h-3" />
                                      {job.customerPhone}
                                    </a>
                                  )}
                                </div>
                                {job.customerPhone && (
                                  <a 
                                    href={`tel:${job.customerPhone}`}
                                    className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition-colors"
                                    title="Call customer"
                                  >
                                    <Phone className="w-5 h-5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Route & Directions */}
                          <div className="mt-6 pt-6 border-t border-zinc-800">
                            <h3 className="font-medium text-sm text-zinc-500 mb-3">Route & Directions</h3>
                            <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                              {/* Route steps - starts from current GPS location */}
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">📍</div>
                                <div>
                                  <p className="text-blue-500 text-xs font-semibold">YOUR LOCATION</p>
                                  <p className="text-zinc-400 text-sm">Current GPS location</p>
                                </div>
                              </div>
                              
                              <div className="ml-3 text-zinc-600 text-sm">↓</div>
                              
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                                <div>
                                  <p className="text-green-500 text-xs font-semibold">PICKUP</p>
                                  <p className="text-white text-sm">{job.pickupLocation}</p>
                                </div>
                              </div>
                              
                              <div className="ml-3 text-zinc-600 text-sm">↓</div>
                              
                              <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-red rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">B</div>
                                <div>
                                  <p className="text-red text-xs font-semibold">DROP-OFF</p>
                                  <p className="text-white text-sm">{job.dropoffLocation}</p>
                                </div>
                              </div>
                              
                              {/* Open in Maps button */}
                              <a
                                href={(() => {
                                  // Encode address for Google Maps URL
                                  // - Strip unit numbers (10/152 -> 152) - Google Maps mobile can't handle them
                                  // - The full address with unit is shown in job details above
                                  const encodeAddress = (addr: string) => {
                                    if (!addr) return ''
                                    return addr
                                      .replace(/^\d+\//, '')  // Remove unit prefix: "10/152 Street" -> "152 Street"
                                      .replace(/\s+/g, '+')   // spaces -> +
                                      .replace(/&/g, '%26')   // & -> %26
                                      .replace(/'/g, '%27')   // ' -> %27
                                  }
                                  
                                  const pickupEncoded = encodeAddress(job.pickupLocation)
                                  const dropoffEncoded = encodeAddress(job.dropoffLocation || '')
                                  
                                  if (pickupEncoded && dropoffEncoded) {
                                    // Empty origin = use current location
                                    return `https://www.google.com/maps/dir//${pickupEncoded}/${dropoffEncoded}`
                                  }
                                  return '#'
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                              >
                                <Navigation className="w-5 h-5" />
                                Open Route in Maps
                              </a>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Messages Tab */}
                      {job.activeTab === 'messages' && (
                        <div className="border-t border-zinc-800">
                          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                            <h2 className="font-bold">Chat with Eek Mechanical</h2>
                            <span className="text-xs text-zinc-500">Auto-updates every 30s</span>
                          </div>
                          
                          {/* Chat Messages */}
                          <div className="p-4 space-y-3">
                            {!job.messages || job.messages.length === 0 ? (
                              <p className="text-zinc-500 text-center py-8 text-sm">No messages yet. Send us a message below!</p>
                            ) : (
                              job.messages.map((msg, i) => {
                                const isSupplier = msg.from.includes('supplier')
                                
                                // Supplier messages on right, Eek Mechanical on left
                                const align = isSupplier ? 'justify-end' : 'justify-start'
                                const bgColor = isSupplier 
                                  ? 'bg-orange-500/20 border-orange-500/30' 
                                  : 'bg-zinc-800 border-zinc-700'
                                const textColor = isSupplier 
                                  ? 'text-orange-200' 
                                  : 'text-zinc-300'
                                const senderLabel = isSupplier ? 'You' : 'Eek Mechanical'
                                
                                return (
                                  <div key={i} className={`flex ${align}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl border ${bgColor} ${isSupplier ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
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
                                value={replyTo === job.rego ? replyMessage : ''}
                                onChange={e => { setReplyTo(job.rego); setReplyMessage(e.target.value) }}
                                onFocus={() => setReplyTo(job.rego)}
                                placeholder="Type a message..."
                                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(job)}
                              />
                              <button
                                onClick={() => sendMessage(job)}
                                disabled={sending || !replyMessage.trim() || replyTo !== job.rego}
                                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 rounded-xl transition-colors flex items-center justify-center"
                              >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Get Paid Tab */}
                      {job.activeTab === 'invoice' && (
                        <div className="p-6">
                          <h2 className="font-bold text-lg mb-4">Complete Job & Get Paid</h2>
                          
                          {/* Payment Amount */}
                          {job.supplierPaidAt ? (
                            // Already paid
                            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div>
                                  <p className="font-bold text-green-500">Payment Sent</p>
                                  <p className="text-zinc-500 text-xs">Funds transferred to your account</p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-green-500">
                                ${((job.supplierApprovedAmount || job.supplierPrice || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                          ) : job.supplierPaymentApproved ? (
                            // Approved, pending transfer
                            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div>
                                  <p className="font-bold text-green-500">Payment Approved</p>
                                  <p className="text-zinc-500 text-xs">Funds being transferred</p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-green-500">
                                ${((job.supplierApprovedAmount || job.supplierPrice || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                          ) : job.supplierPrice ? (
                            // Quote set, pending approval
                            <div className="flex items-center justify-between p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6">
                              <div className="flex items-center gap-3">
                                <Clock className="w-6 h-6 text-yellow-500" />
                                <div>
                                  <p className="font-bold text-yellow-500">Quoted Amount</p>
                                  <p className="text-zinc-500 text-xs">Pending payment approval</p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-yellow-500">
                                ${((job.supplierPrice || 0) / 100).toFixed(2)}
                              </p>
                            </div>
                          ) : (
                            // No price set
                            <div className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-xl mb-6">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="w-6 h-6 text-zinc-500" />
                                <div>
                                  <p className="font-bold text-zinc-400">No Price Set</p>
                                  <p className="text-zinc-500 text-xs">Complete job first, sort price later</p>
                                </div>
                              </div>
                              <p className="text-2xl font-bold text-zinc-500">--</p>
                            </div>
                          )}
                          
                          {/* Job Completed Button - Primary Action */}
                          {job.status !== 'completed' && !job.supplierPaidAt && (
                            <div className="mb-6">
                              {jobCompleted === job.rego ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                                  <CheckCircle className="w-6 h-6 text-green-500" />
                                  <div>
                                    <p className="font-bold text-green-400">Job Completed! 🎉</p>
                                    <p className="text-zinc-500 text-sm">Eek Mechanical has been notified</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                                    <p className="text-green-400 font-medium mb-2">Ready to complete this job?</p>
                                    <p className="text-zinc-400 text-sm mb-4">
                                      Click below to mark the job as completed. This will notify Eek Mechanical and close the job.
                                      {!job.supplierPrice && ' You can sort out the payment details later.'}
                                    </p>
                                    <button
                                      onClick={() => completeJob(job)}
                                      disabled={completingJob === job.rego}
                                      className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-3"
                                    >
                                      {completingJob === job.rego ? (
                                        <>
                                          <Loader2 className="w-6 h-6 animate-spin" />
                                          Completing Job...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="w-6 h-6" />
                                          Click to Complete Job ✓
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Job already completed message */}
                          {job.status === 'completed' && !job.supplierPaidAt && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                                <div>
                                  <p className="font-bold text-green-400">Job Completed</p>
                                  <p className="text-zinc-500 text-sm">
                                    {job.supplierPrice 
                                      ? 'Awaiting payment approval from Eek Mechanical' 
                                      : 'Submit your invoice below or contact Eek Mechanical to set the price'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Check if payment details are set up */}
                          {!supplier?.bankAccount ? (
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                              <div className="flex items-center gap-3 mb-3">
                                <AlertCircle className="w-5 h-5 text-yellow-500" />
                                <p className="font-medium text-yellow-400">Set Up Payment Details</p>
                              </div>
                              <p className="text-zinc-400 text-sm mb-4">
                                Add your bank details to receive automatic payments when invoices are approved.
                              </p>
                              
                              {editingProfile ? (
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Legal Company Name (for invoicing)</label>
                                    <input
                                      type="text"
                                      value={profileData.legalName ?? supplier?.legalName ?? supplier?.name ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, legalName: e.target.value }))}
                                      placeholder={supplier?.name}
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Bank Name *</label>
                                    <input
                                      type="text"
                                      value={profileData.bankName ?? supplier?.bankName ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, bankName: e.target.value }))}
                                      placeholder="e.g. ANZ, Westpac, BNZ"
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Bank Account Number *</label>
                                    <input
                                      type="text"
                                      value={profileData.bankAccount ?? supplier?.bankAccount ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, bankAccount: e.target.value }))}
                                      placeholder="XX-XXXX-XXXXXXX-XX"
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Account Holder Name *</label>
                                    <input
                                      type="text"
                                      value={profileData.bankAccountName ?? supplier?.bankAccountName ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, bankAccountName: e.target.value }))}
                                      placeholder="Name as shown on bank account"
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">GST Number (optional)</label>
                                    <input
                                      type="text"
                                      value={profileData.gstNumber ?? supplier?.gstNumber ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, gstNumber: e.target.value }))}
                                      placeholder="e.g. 123-456-789"
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <button 
                                    onClick={async () => {
                                      setSavingProfile(true)
                                      try {
                                        // Merge existing supplier data with any changes
                                        const dataToSave = {
                                          legalName: profileData.legalName ?? supplier?.legalName ?? supplier?.name,
                                          bankName: profileData.bankName ?? supplier?.bankName,
                                          bankAccount: profileData.bankAccount ?? supplier?.bankAccount,
                                          bankAccountName: profileData.bankAccountName ?? supplier?.bankAccountName,
                                          gstNumber: profileData.gstNumber ?? supplier?.gstNumber,
                                        }
                                        await fetch(`/api/supplier-portal/${code}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify(dataToSave)
                                        })
                                        setSupplier(prev => prev ? { ...prev, ...dataToSave } : null)
                                        setEditingProfile(false)
                                        setProfileSaved(true)
                                        setTimeout(() => setProfileSaved(false), 3000)
                                      } catch (e) {
                                        console.error(e)
                                      } finally {
                                        setSavingProfile(false)
                                      }
                                    }}
                                    disabled={savingProfile || !(profileData.bankAccount ?? supplier?.bankAccount) || !(profileData.bankName ?? supplier?.bankName) || !(profileData.bankAccountName ?? supplier?.bankAccountName)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                  >
                                    {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                    Save Payment Details
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setEditingProfile(true)}
                                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                  <CreditCard className="w-5 h-5" />
                                  Add Bank Details
                                </button>
                              )}
                            </div>
                          ) : (
                            <>
                              {/* Already submitted invoice */}
                              {job.supplierInvoiceRef ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6">
                                  <div className="flex items-center gap-3 mb-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <p className="font-medium text-green-400">Invoice Submitted</p>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Reference:</span>
                                      <span className="text-white font-mono">{job.supplierInvoiceRef}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">Amount:</span>
                                      <span className="text-green-400">${((job.supplierInvoiceAmount || job.supplierPrice || 0) / 100).toFixed(2)}</span>
                                    </div>
                                    {job.supplierXeroLink && (
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Invoice Link:</span>
                                        <a href={job.supplierXeroLink} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">View Invoice →</a>
                                      </div>
                                    )}
                                    {job.supplierInvoiceSubmittedAt && (
                                      <div className="flex justify-between">
                                        <span className="text-zinc-500">Submitted:</span>
                                        <span className="text-zinc-400">{new Date(job.supplierInvoiceSubmittedAt).toLocaleDateString('en-NZ')}</span>
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-zinc-500 text-xs mt-4">
                                    Payment will be processed to {supplier.bankName} ****{supplier.bankAccount?.slice(-4)}
                                  </p>
                                </div>
                              ) : invoiceSuccess === job.rego ? (
                                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  <p className="text-green-400">Invoice submitted successfully!</p>
                                </div>
                              ) : (
                                <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 space-y-4">
                                  <h3 className="font-medium text-sm text-zinc-400 mb-2">
                                    Submit Invoice <span className="text-zinc-600">(Optional)</span>
                                  </h3>
                                  <p className="text-zinc-500 text-xs -mt-2 mb-2">
                                    Upload your invoice for records. You can do this anytime after completing the job.
                                  </p>
                                  
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Invoice Reference *</label>
                                    <input
                                      type="text"
                                      value={invoiceJobId === job.rego ? invoiceRef : ''}
                                      onChange={e => { setInvoiceJobId(job.rego); setInvoiceRef(e.target.value) }}
                                      onFocus={() => setInvoiceJobId(job.rego)}
                                      placeholder="e.g. INV-001234"
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  
                                  {/* Amount - locked if already set by Eek Mechanical */}
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">
                                      Amount *
                                      {job.supplierPrice ? (
                                        <span className="text-orange-400 ml-1">(Set by Eek Mechanical)</span>
                                      ) : null}
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                                      {job.supplierPrice ? (
                                        // Locked - price set by Eek Mechanical
                                        <div className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-white cursor-not-allowed flex items-center justify-between">
                                          <span>{((job.supplierPrice || 0) / 100).toFixed(2)}</span>
                                          <span className="text-xs text-zinc-500">🔒 Locked</span>
                                        </div>
                                      ) : (
                                        // Editable - no price set yet
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          required
                                          value={invoiceJobId === job.rego ? invoiceAmount : ''}
                                          onChange={e => { setInvoiceJobId(job.rego); setInvoiceAmount(e.target.value) }}
                                          onFocus={() => setInvoiceJobId(job.rego)}
                                          placeholder="Enter amount"
                                          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                        />
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Invoice attachment type selector */}
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-2">Attach Invoice (optional)</label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => { 
                                          setInvoiceJobId(job.rego)
                                          setInvoiceType(invoiceType === 'upload' ? 'none' : 'upload')
                                          setXeroLink('')
                                        }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                          invoiceJobId === job.rego && invoiceType === 'upload'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                      >
                                        <Upload className="w-4 h-4" />
                                        Upload File
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => { 
                                          setInvoiceJobId(job.rego)
                                          setInvoiceType(invoiceType === 'xero' ? 'none' : 'xero')
                                          setInvoiceFile(null)
                                        }}
                                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                                          invoiceJobId === job.rego && invoiceType === 'xero'
                                            ? 'bg-orange-500 text-white'
                                            : 'bg-zinc-900 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                                        }`}
                                      >
                                        <LinkIcon className="w-4 h-4" />
                                        Xero/Link
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {/* Upload file input */}
                                  {invoiceJobId === job.rego && invoiceType === 'upload' && (
                                    <div className="bg-zinc-900 border border-dashed border-zinc-600 rounded-lg p-4">
                                      <input
                                        type="file"
                                        accept=".pdf,.png,.jpg,.jpeg"
                                        onChange={e => setInvoiceFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-500 file:text-white hover:file:bg-orange-600"
                                      />
                                      <p className="text-zinc-600 text-xs mt-2">PDF, PNG, or JPG (max 10MB)</p>
                                      {invoiceFile && (
                                        <p className="text-green-400 text-xs mt-1">✓ {invoiceFile.name}</p>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Xero/URL link input */}
                                  {invoiceJobId === job.rego && invoiceType === 'xero' && (
                                    <div>
                                      <input
                                        type="url"
                                        value={xeroLink}
                                        onChange={e => setXeroLink(e.target.value)}
                                        placeholder="https://go.xero.com/... or Google Drive/Dropbox link"
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500"
                                      />
                                      <p className="text-zinc-600 text-xs mt-1">
                                        Paste your invoice link (Xero, Google Drive, Dropbox, etc.)
                                      </p>
                                    </div>
                                  )}
                                  
                                  <button 
                                    onClick={() => submitInvoice(job)}
                                    disabled={
                                      submittingInvoice || 
                                      !invoiceRef.trim() || 
                                      invoiceJobId !== job.rego ||
                                      (!job.supplierPrice && !invoiceAmount.trim())
                                    }
                                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                  >
                                    {submittingInvoice && invoiceJobId === job.rego ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Receipt className="w-5 h-5" />
                                    )}
                                    Submit Invoice
                                  </button>
                                  
                                  {/* Validation message */}
                                  {invoiceJobId === job.rego && !job.supplierPrice && !invoiceAmount.trim() && (
                                    <p className="text-red text-xs text-center">Please enter an amount</p>
                                  )}
                                  
                                  <p className="text-zinc-500 text-xs text-center">
                                    Payment to {supplier.bankName} ****{supplier.bankAccount?.slice(-4)}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                          
                          {/* Payment Details Summary */}
                          {supplier?.bankAccount && (
                            <div className="bg-zinc-800/30 rounded-xl p-4 mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-medium text-sm text-zinc-400">Your Payment Details</h3>
                                <button 
                                  onClick={() => { setEditingProfile(!editingProfile); setProfileData({}) }}
                                  className="text-xs text-orange-400 hover:underline"
                                >
                                  {editingProfile ? 'Cancel' : 'Edit'}
                                </button>
                              </div>
                              
                              {editingProfile ? (
                                <div className="space-y-3 mt-4">
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Legal Company Name</label>
                                    <input
                                      type="text"
                                      value={profileData.legalName ?? supplier?.legalName ?? supplier?.name ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, legalName: e.target.value }))}
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs text-zinc-500 mb-1">Bank</label>
                                      <input
                                        type="text"
                                        value={profileData.bankName ?? supplier?.bankName ?? ''}
                                        onChange={e => setProfileData(prev => ({ ...prev, bankName: e.target.value }))}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs text-zinc-500 mb-1">GST #</label>
                                      <input
                                        type="text"
                                        value={profileData.gstNumber ?? supplier?.gstNumber ?? ''}
                                        onChange={e => setProfileData(prev => ({ ...prev, gstNumber: e.target.value }))}
                                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Account Number</label>
                                    <input
                                      type="text"
                                      value={profileData.bankAccount ?? supplier?.bankAccount ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, bankAccount: e.target.value }))}
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Account Name</label>
                                    <input
                                      type="text"
                                      value={profileData.bankAccountName ?? supplier?.bankAccountName ?? ''}
                                      onChange={e => setProfileData(prev => ({ ...prev, bankAccountName: e.target.value }))}
                                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                                    />
                                  </div>
                                  <button 
                                    onClick={async () => {
                                      setSavingProfile(true)
                                      try {
                                        await fetch(`/api/supplier-portal/${code}`, {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify(profileData)
                                        })
                                        setSupplier(prev => prev ? { ...prev, ...profileData } : null)
                                        setEditingProfile(false)
                                        setProfileSaved(true)
                                        setTimeout(() => setProfileSaved(false), 3000)
                                      } catch (e) {
                                        console.error(e)
                                      } finally {
                                        setSavingProfile(false)
                                      }
                                    }}
                                    disabled={savingProfile}
                                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                  >
                                    {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Company:</span>
                                    <span className="text-white">{supplier.legalName || supplier.name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Bank:</span>
                                    <span className="text-white">{supplier.bankName}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Account:</span>
                                    <span className="text-white font-mono">{supplier.bankAccount}</span>
                                  </div>
                                  {supplier.gstNumber && (
                                    <div className="flex justify-between">
                                      <span className="text-zinc-500">GST:</span>
                                      <span className="text-white">{supplier.gstNumber}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {profileSaved && (
                                <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-2 flex items-center gap-2 text-green-400 text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  Saved!
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Buyer-Created Invoice Option */}
                          <Link 
                            href={`/supplier-invoice/${job.bookingId || job.rego}`}
                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            View Buyer-Created Invoice
                          </Link>
                          
                          <p className="text-zinc-600 text-xs text-center mt-4">
                            Payment is instant via ANZ batch transfer
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        {/* Closed Jobs */}
        {closedJobs.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowClosed(!showClosed)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">Completed Jobs</span>
                <span className="bg-zinc-700 text-zinc-400 text-xs px-2 py-0.5 rounded-full">{closedJobs.length}</span>
              </div>
              {showClosed ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
            </button>
            
            {showClosed && (
              <div className="mt-4 bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800">
                {closedJobs.map(job => (
                  <div key={job.rego} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <span className="font-mono font-bold text-white">{job.rego}</span>
                        <p className="text-zinc-500 text-sm">{job.pickupLocation?.split(',')[0]}</p>
                      </div>
                    </div>
                    {job.supplierPrice && job.supplierPrice > 0 && (
                      <span className="text-green-500 font-bold">${(job.supplierPrice / 100).toFixed(2)}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            Need help? Call <a href="tel:0800769000" className="text-orange-500 hover:underline">0800 769 000</a>
          </p>
          <p className="mt-1 text-zinc-600">Available 24/7</p>
        </div>
      </div>
      
      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-red flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Decline Job
              </h3>
              <button
                onClick={() => setShowDeclineModal(null)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Job Summary */}
              <div className="bg-zinc-950 rounded-xl p-4 mb-4">
                {(() => {
                  const job = openJobs.find(j => j.rego === showDeclineModal)
                  if (!job) return null
                  return (
                    <div className="flex items-center gap-3">
                      <div className="bg-red/20 text-red px-3 py-2 rounded-lg font-mono font-bold">
                        {job.rego}
                      </div>
                      <div>
                        <div className="font-medium">{job.pickupLocation?.split(',')[0]}</div>
                        <div className="text-sm text-zinc-500">→ {job.dropoffLocation?.split(',')[0]}</div>
                      </div>
                    </div>
                  )
                })()}
              </div>
              
              {/* Info */}
              <p className="text-zinc-400 text-sm mb-4">
                Please let us know why you&apos;re declining so we can better match jobs in the future.
              </p>
              
              {/* Reason Input */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Reason (optional)</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                >
                  <option value="">Select a reason...</option>
                  <option value="Too far away">Too far away</option>
                  <option value="Busy with another job">Busy with another job</option>
                  <option value="Equipment not suitable">Equipment not suitable</option>
                  <option value="Price too low">Price too low</option>
                  <option value="Outside operating hours">Outside operating hours</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => setShowDeclineModal(null)}
                disabled={acceptingJob}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const job = openJobs.find(j => j.rego === showDeclineModal)
                  if (job) declineJob(job)
                }}
                disabled={acceptingJob}
                className="flex-1 px-4 py-2.5 bg-red hover:bg-red/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {acceptingJob ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Decline Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
