'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Car, 
  MapPin, 
  User, 
  Phone, 
  DollarSign,
  Clock,
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Truck,
  Building2,
  FileText,
  ExternalLink,
  ChevronRight,
  XCircle,
  ArrowRightLeft,
  X,
  Loader2,
  Trash2,
  Flame,
  ChevronDown,
  Save
} from 'lucide-react'
import AddressPicker from '@/components/AddressPicker'

interface Props {
  user: { email: string; name: string; role: string } | null
  onReallocate?: (job: Job) => void
}

interface Job {
  rego: string
  bookingId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation: string
  price: number
  eta?: string
  issueType?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  supplierName?: string
  supplierPhone?: string
  supplierPhoneLandline?: boolean
  supplierMobile?: string
  supplierEmail?: string
  supplierPrice?: number
  status: string
  createdAt: string
  updatedAt: string
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  booked: { label: 'Booked', color: 'bg-blue-500/20 text-blue-500', icon: CheckCircle },
  awaiting_supplier: { label: 'Awaiting Supplier', color: 'bg-purple-500/20 text-purple-500', icon: Clock },
  assigned: { label: 'Assigned', color: 'bg-orange-500/20 text-orange-500', icon: Building2 },
  in_progress: { label: 'In Progress', color: 'bg-green-500/20 text-green-500', icon: Truck },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  closed: { label: 'Closed', color: 'bg-zinc-500/20 text-zinc-400', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-500', icon: AlertCircle }
}

export default function JobsList({ user, onReallocate }: Props) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [jobToCancel, setJobToCancel] = useState<Job | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelResult, setCancelResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Purge modal state
  const [purgeModalOpen, setPurgeModalOpen] = useState(false)
  const [jobToPurge, setJobToPurge] = useState<Job | null>(null)
  const [purgeConfirmText, setPurgeConfirmText] = useState('')
  const [purging, setPurging] = useState(false)
  const [purgeResult, setPurgeResult] = useState<{ success: boolean; message: string } | null>(null)
  
  // Inline supplier reassignment state
  const [reassigningJob, setReassigningJob] = useState<string | null>(null) // bookingId of job being reassigned
  const [supplierSearch, setSupplierSearch] = useState('')
  const [supplierResults, setSupplierResults] = useState<Array<{ name: string; phone?: string; phoneLandline?: boolean; mobile?: string; email?: string; address?: string }>>([])
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false)
  const [selectedNewSupplier, setSelectedNewSupplier] = useState<{ name: string; phone?: string; phoneLandline?: boolean; mobile?: string; email?: string; address?: string } | null>(null)
  const [savingSupplier, setSavingSupplier] = useState(false)
  const [supplierSaveResult, setSupplierSaveResult] = useState<{ success: boolean; message: string } | null>(null)
  const supplierDropdownRef = useRef<HTMLDivElement>(null)
  
  // Distance/pricing calculation
  const [calculatedDistance, setCalculatedDistance] = useState<{ km: number; suggestedPrice: number } | null>(null)
  const [calculatingPrice, setCalculatingPrice] = useState(false)
  
  // Editable job data for inline form
  const [editFormData, setEditFormData] = useState<{
    customerName: string
    customerPhone: string
    customerEmail: string
    pickupLocation: string
    dropoffLocation: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    supplierPrice: string
    newCustomerPrice: string
    sendAdditionalPayment: boolean
    notes: string
    sendToSupplier: boolean
  }>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickupLocation: '',
    dropoffLocation: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    supplierPrice: '',
    newCustomerPrice: '',
    sendAdditionalPayment: false,
    notes: '',
    sendToSupplier: false
  })

  const fetchJobs = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/jobs?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setJobs(data.jobs || [])
      } else {
        setError(data.error || 'Failed to fetch jobs')
      }
    } catch (e) {
      setError('Failed to fetch jobs')
      console.error('Fetch jobs error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])
  
  // Cancel job handler
  const handleCancelJob = async () => {
    if (!jobToCancel?.bookingId && !jobToCancel?.rego) return
    
    setCancelling(true)
    setCancelResult(null)
    
    try {
      const response = await fetch('/api/jobs/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: jobToCancel.bookingId || jobToCancel.rego,
          reason: cancelReason,
          cancelledBy: user?.email || 'admin'
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update job in list
        const cancelKey = jobToCancel.bookingId || jobToCancel.rego
        setJobs(prev => prev.map(j => 
          (j.bookingId === cancelKey || j.rego === cancelKey)
            ? { ...j, status: 'cancelled' } 
            : j
        ))
        
        // Show result
        const notifSummary = []
        if (data.notifications?.customer?.sms) notifSummary.push('Customer SMS')
        if (data.notifications?.customer?.email) notifSummary.push('Customer Email')
        if (data.notifications?.supplier?.sms) notifSummary.push('Supplier SMS')
        if (data.notifications?.supplier?.email) notifSummary.push('Supplier Email')
        
        setCancelResult({
          success: true,
          message: `Job cancelled. Notifications sent: ${notifSummary.length > 0 ? notifSummary.join(', ') : 'None'}`
        })
        
        // Close modal after delay
        setTimeout(() => {
          setCancelModalOpen(false)
          setJobToCancel(null)
          setCancelReason('')
          setCancelResult(null)
        }, 2500)
      } else {
        setCancelResult({ success: false, message: data.error || 'Failed to cancel job' })
      }
    } catch (e) {
      setCancelResult({ success: false, message: 'Failed to cancel job' })
      console.error('Cancel job error:', e)
    } finally {
      setCancelling(false)
    }
  }
  
  // Open cancel modal
  const openCancelModal = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    setJobToCancel(job)
    setCancelReason('')
    setCancelResult(null)
    setCancelModalOpen(true)
  }
  
  // Open purge modal
  const openPurgeModal = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    setJobToPurge(job)
    setPurgeConfirmText('')
    setPurgeResult(null)
    setPurgeModalOpen(true)
  }
  
  // Purge job handler - permanently delete
  const handlePurgeJob = async () => {
    if (!jobToPurge) return
    if (purgeConfirmText !== 'DELETE') return
    
    setPurging(true)
    setPurgeResult(null)
    
    try {
      const response = await fetch('/api/jobs/purge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: jobToPurge.bookingId,
          rego: jobToPurge.rego,
          confirmDelete: true
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove job from list
        setJobs(prev => prev.filter(j => 
          j.bookingId !== jobToPurge.bookingId && j.rego !== jobToPurge.rego
        ))
        
        setPurgeResult({
          success: true,
          message: `Purged: ${data.deleted?.join(', ') || 'records deleted'}`
        })
        
        // Close modal after delay
        setTimeout(() => {
          setPurgeModalOpen(false)
          setJobToPurge(null)
          setPurgeConfirmText('')
          setPurgeResult(null)
        }, 2000)
      } else {
        setPurgeResult({ success: false, message: data.error || 'Failed to purge job' })
      }
    } catch (e) {
      setPurgeResult({ success: false, message: 'Failed to purge job' })
      console.error('Purge job error:', e)
    } finally {
      setPurging(false)
    }
  }
  
  // Search suppliers for inline reassignment
  const searchSuppliers = async (query: string) => {
    if (!query || query.length < 2) {
      setSupplierResults([])
      return
    }
    
    try {
      const response = await fetch(`/api/suppliers?search=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success && data.suppliers) {
        setSupplierResults(data.suppliers.slice(0, 8))
      }
    } catch (e) {
      console.error('Supplier search error:', e)
    }
  }
  
  // Handle supplier search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (supplierSearch) {
        searchSuppliers(supplierSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [supplierSearch])
  
  // Close supplier dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) {
        setSupplierDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Calculate distance for reference only (supplier price is manual)
  // Route: Supplier → Pickup → Dropoff → back to Supplier
  const calculateDistance = async () => {
    if (!editFormData.pickupLocation || !editFormData.dropoffLocation) {
      return
    }
    
    // Get supplier address if available - use actual address, not just name
    const supplierAddress = selectedNewSupplier?.address 
      ? selectedNewSupplier.address
      : editFormData.dropoffLocation // Fallback to dropoff if no supplier address
    
    setCalculatingPrice(true)
    try {
      const response = await fetch('/api/calculate-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start: supplierAddress, // Supplier location
          pickup: editFormData.pickupLocation,
          dropoff: editFormData.dropoffLocation
        })
      })
      
      const data = await response.json()
      const totalKm = data.totalDistanceKm || data.distanceKm
      
      if (totalKm) {
        // Actual pricing: $4.03/km (from lib/pricing.ts)
        const KM_RATE = 4.03
        const kmCost = Math.round(totalKm * KM_RATE)
        
        setCalculatedDistance({
          km: totalKm,
          suggestedPrice: kmCost
        })
        // NOTE: Does NOT auto-fill supplier price - that's manual entry only
      } else {
        console.error('No distance returned:', data)
        setCalculatedDistance(null)
      }
    } catch (e) {
      console.error('Distance calculation error:', e)
      setCalculatedDistance(null)
    } finally {
      setCalculatingPrice(false)
    }
  }
  
  // Save supplier reassignment with all editable fields
  const handleSaveSupplier = async (job: Job) => {
    if (!selectedNewSupplier) {
      setSavingSupplier(false)
      return
    }
    
    setSavingSupplier(true)
    setSupplierSaveResult(null)
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
    
    try {
      
      // First, assign the supplier with updated job data
      const response = await fetch('/api/jobs/assign-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          bookingId: job.bookingId,
          rego: job.rego,
          supplierName: selectedNewSupplier.name,
          supplierPhone: selectedNewSupplier.phone,
          supplierMobile: selectedNewSupplier.mobile,
          supplierEmail: selectedNewSupplier.email,
          supplierPrice: editFormData.supplierPrice ? parseInt(editFormData.supplierPrice) * 100 : 0,
          notes: editFormData.notes || '',
          sendingNotification: editFormData.sendToSupplier,
          updatedData: {
            customerName: editFormData.customerName,
            customerPhone: editFormData.customerPhone,
            customerEmail: editFormData.customerEmail,
            pickupLocation: editFormData.pickupLocation,
            dropoffLocation: editFormData.dropoffLocation,
            vehicleMake: editFormData.vehicleMake,
            vehicleModel: editFormData.vehicleModel,
            vehicleColor: editFormData.vehicleColor
          }
        })
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        setSupplierSaveResult({ success: false, message: data.error || 'Failed to update' })
        return
      }
      
      // If send to supplier is checked, send notification (fire and forget - don't block)
      if (editFormData.sendToSupplier && (selectedNewSupplier.phone || selectedNewSupplier.email)) {
        // Generate supplier link
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        let ref = 'SJ-'
        for (let i = 0; i < 8; i++) {
          ref += chars[Math.floor(Math.random() * chars.length)]
        }
        
        // Fire off notification requests without blocking
        const link = `${window.location.origin}/supplier/${ref}`
        
        // Save supplier job data
        fetch('/api/supplier-job', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ref,
            rego: job.rego,
            bookingId: job.bookingId,
            supplierName: selectedNewSupplier.name,
            supplierPhone: selectedNewSupplier.phone,
            supplierEmail: selectedNewSupplier.email,
            pickup: editFormData.pickupLocation,
            dropoff: editFormData.dropoffLocation,
            price: editFormData.supplierPrice ? parseInt(editFormData.supplierPrice) * 100 : 0,
            customerName: editFormData.customerName,
            customerPhone: editFormData.customerPhone,
            notes: editFormData.notes,
            createdAt: new Date().toISOString(),
            createdBy: user?.email || 'admin'
          })
        }).catch(e => console.error('Supplier job save error:', e))
        
        // Send notification to supplier
        // If phoneLandline is true, use mobile for SMS
        const smsNumber = selectedNewSupplier.phoneLandline 
          ? selectedNewSupplier.mobile 
          : selectedNewSupplier.phone
        
        fetch('/api/send-supplier-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierName: selectedNewSupplier.name,
            supplierPhone: smsNumber, // Use correct number for SMS
            supplierEmail: selectedNewSupplier.email,
            supplierAddress: selectedNewSupplier.address,
            link,
            rego: job.rego,
            pickup: editFormData.pickupLocation,
            dropoff: editFormData.dropoffLocation,
            price: editFormData.supplierPrice || '0',
            customerName: editFormData.customerName,
            customerPhone: editFormData.customerPhone,
            method: 'both'
          })
        }).catch(e => console.error('Supplier notification error:', e))
      }
      
      // Update job in list immediately
      const newStatus = editFormData.sendToSupplier ? 'awaiting_supplier' : 'assigned'
      setJobs(prev => prev.map(j => 
        (j.bookingId === job.bookingId || j.rego === job.rego)
          ? { 
              ...j, 
              supplierName: selectedNewSupplier.name, 
              supplierPhone: selectedNewSupplier.phone,
              supplierEmail: selectedNewSupplier.email,
              supplierPrice: editFormData.supplierPrice ? parseInt(editFormData.supplierPrice) * 100 : 0,
              customerName: editFormData.customerName || j.customerName,
              customerPhone: editFormData.customerPhone || j.customerPhone,
              customerEmail: editFormData.customerEmail || j.customerEmail,
              pickupLocation: editFormData.pickupLocation || j.pickupLocation,
              dropoffLocation: editFormData.dropoffLocation || j.dropoffLocation,
              vehicleMake: editFormData.vehicleMake || j.vehicleMake,
              vehicleModel: editFormData.vehicleModel || j.vehicleModel,
              vehicleColor: editFormData.vehicleColor || j.vehicleColor,
              status: newStatus 
            }
          : j
      ))
      
      const msg = editFormData.sendToSupplier 
        ? 'Saved & notification sent!' 
        : 'Supplier updated!'
      setSupplierSaveResult({ success: true, message: msg })
      
      // Reset after delay
      setTimeout(() => {
        setReassigningJob(null)
        setSupplierSearch('')
        setSelectedNewSupplier(null)
        setSupplierSaveResult(null)
        setCalculatedDistance(null)
      }, 2000)
      
    } catch (e) {
      clearTimeout(timeoutId)
      console.error('Save supplier error:', e)
      
      let errorMessage = 'Failed to save - please try again'
      if (e instanceof Error) {
        if (e.name === 'AbortError') {
          errorMessage = 'Request timed out - please try again'
        } else {
          errorMessage = e.message || errorMessage
        }
      }
      
      setSupplierSaveResult({ success: false, message: errorMessage })
    } finally {
      // Always ensure saving state is cleared - use setTimeout to escape any React batching issues
      setTimeout(() => {
        setSavingSupplier(false)
      }, 0)
    }
  }
  
  // Start inline reassignment - populate all editable fields
  const startReassignment = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation()
    setReassigningJob(job.bookingId || job.rego)
    setSupplierSearch(job.supplierName || '')
    setSelectedNewSupplier(job.supplierName ? { 
      name: job.supplierName, 
      phone: job.supplierPhone,
      phoneLandline: job.supplierPhoneLandline,
      mobile: job.supplierMobile,
      email: job.supplierEmail 
    } : null)
    setSupplierSaveResult(null)
    setCalculatedDistance(null) // Reset distance calc
    
    // Populate edit form with current job data
    setEditFormData({
      customerName: job.customerName || '',
      customerPhone: job.customerPhone || '',
      customerEmail: job.customerEmail || '',
      pickupLocation: job.pickupLocation || '',
      dropoffLocation: job.dropoffLocation || '',
      vehicleMake: job.vehicleMake || '',
      vehicleModel: job.vehicleModel || '',
      vehicleColor: job.vehicleColor || '',
      supplierPrice: job.supplierPrice ? String(job.supplierPrice / 100) : '',
      newCustomerPrice: '',
      sendAdditionalPayment: false,
      notes: '',
      sendToSupplier: true // Default to sending notification to supplier
    })
  }
  
  // Cancel inline reassignment
  const cancelReassignment = (e: React.MouseEvent) => {
    e.stopPropagation()
    setReassigningJob(null)
    setSupplierSearch('')
    setSelectedNewSupplier(null)
    setSupplierSaveResult(null)
    setSupplierDropdownOpen(false)
    setCalculatedDistance(null)
    setEditFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      pickupLocation: '',
      dropoffLocation: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleColor: '',
      supplierPrice: '',
      newCustomerPrice: '',
      sendAdditionalPayment: false,
      notes: '',
      sendToSupplier: false
    })
  }

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.rego?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerPhone?.includes(searchTerm) ||
      job.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // "open" shows everything except cancelled, closed, and completed
    // "closed" shows all terminal statuses: completed, cancelled, closed
    let matchesStatus = false
    if (statusFilter === 'all') {
      matchesStatus = true
    } else if (statusFilter === 'open') {
      matchesStatus = job.status !== 'cancelled' && job.status !== 'closed' && job.status !== 'completed'
    } else if (statusFilter === 'closed') {
      // "Closed" is a category that includes all terminal statuses
      matchesStatus = job.status === 'completed' || job.status === 'cancelled' || job.status === 'closed'
    } else {
      matchesStatus = job.status === statusFilter
    }
    
    return matchesSearch && matchesStatus
  })

  // Count by status
  // "closed" is a category containing all terminal statuses: completed, cancelled, closed
  const statusCounts = {
    open: jobs.filter(j => j.status !== 'cancelled' && j.status !== 'closed' && j.status !== 'completed').length,
    all: jobs.length,
    pending: jobs.filter(j => j.status === 'pending').length,
    booked: jobs.filter(j => j.status === 'booked').length,
    awaiting_supplier: jobs.filter(j => j.status === 'awaiting_supplier').length,
    assigned: jobs.filter(j => j.status === 'assigned').length,
    in_progress: jobs.filter(j => j.status === 'in_progress').length,
    // "Closed" category = completed + cancelled + closed
    closed: jobs.filter(j => j.status === 'completed' || j.status === 'cancelled' || j.status === 'closed').length,
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-NZ', { 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-zinc-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Jobs</h2>
          <p className="text-zinc-500 text-sm">All jobs by registration</p>
        </div>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by rego, customer, phone, location..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
            />
          </div>
          
          {/* Status Filter - auto-sized tabs */}
          <div className="flex gap-1 w-full">
            {(['open', 'pending', 'booked', 'awaiting_supplier', 'assigned', 'in_progress', 'closed', 'all'] as const)
              .filter((status) => {
                // Always show Open, Closed and All - hide others if count is 0
                if (status === 'open' || status === 'all' || status === 'closed') return true
                return (statusCounts[status as keyof typeof statusCounts] || 0) > 0
              })
              .map((status) => {
              const labels: Record<string, { short: string; full: string }> = {
                open: { short: 'Open', full: 'Open Jobs' },
                pending: { short: 'Pend', full: 'Pending Payment' },
                booked: { short: 'Book', full: 'Booked & Paid' },
                awaiting_supplier: { short: 'Wait', full: 'Awaiting Supplier' },
                assigned: { short: 'Asgn', full: 'Assigned to Supplier' },
                in_progress: { short: 'Prog', full: 'In Progress' },
                closed: { short: 'Closed', full: 'Closed (Completed/Cancelled)' },
                all: { short: 'All', full: 'All Jobs' }
              }
              const count = statusCounts[status as keyof typeof statusCounts] || 0
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  title={`${labels[status].full} (${count})`}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors text-center min-w-0 ${
                    statusFilter === status
                      ? 'bg-red text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span className="truncate">{labels[status].short}</span>
                  <span className="ml-0.5 opacity-70">{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl p-12 border border-zinc-800 text-center">
          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No jobs found</h3>
          <p className="text-zinc-500">
            {searchTerm ? 'Try adjusting your search' : 'Jobs will appear here when created'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const status = statusConfig[job.status] || statusConfig.pending
            const StatusIcon = status.icon
            
            return (
              <div
                key={job.rego}
                onClick={() => setSelectedJob(selectedJob?.rego === job.rego ? null : job)}
                className="bg-zinc-900 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer overflow-hidden"
              >
                {/* Main Row */}
                <div className="p-4 flex items-center gap-4">
                  {/* Rego Badge */}
                  <div className="w-20 flex-shrink-0">
                    <div className="bg-red/20 text-red px-3 py-2 rounded-lg text-center font-mono font-bold">
                      {job.rego}
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {job.customerName && (
                        <span className="font-medium truncate">{job.customerName}</span>
                      )}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {job.pickupLocation}
                      </span>
                      {job.vehicleMake && (
                        <span className="hidden sm:inline-flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          {job.vehicleMake} {job.vehicleModel}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Price & Arrow */}
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="font-bold text-green-500">{formatPrice(job.price)}</div>
                      <div className="text-xs text-zinc-500">{formatDate(job.createdAt)}</div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${selectedJob?.rego === job.rego ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                
                {/* Expanded Details */}
                {selectedJob?.rego === job.rego && (
                  <div className="border-t border-zinc-800 p-4 bg-zinc-950/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {job.customerPhone && (
                        <div>
                          <div className="text-zinc-500 mb-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Phone
                          </div>
                          <a href={`tel:${job.customerPhone}`} className="text-white hover:text-red">
                            {job.customerPhone}
                          </a>
                        </div>
                      )}
                      <div>
                        <div className="text-zinc-500 mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Pickup
                        </div>
                        <div className="text-white">{job.pickupLocation}</div>
                      </div>
                      {job.dropoffLocation && (
                        <div>
                          <div className="text-zinc-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Drop-off
                          </div>
                          <div className="text-white">{job.dropoffLocation}</div>
                        </div>
                      )}
                      {/* Supplier */}
                      <div>
                        <div className="text-zinc-500 mb-1 flex items-center gap-1">
                          <Building2 className="w-3 h-3" /> Supplier
                        </div>
                        <div className="flex items-center gap-2">
                          {job.supplierName ? (
                            <>
                              <span className="text-orange-500">{job.supplierName}</span>
                              <button
                                onClick={(e) => startReassignment(job, e)}
                                className="text-xs text-zinc-500 hover:text-orange-500 flex items-center gap-1"
                              >
                                <ArrowRightLeft className="w-3 h-3" />
                                {reassigningJob === (job.bookingId || job.rego) ? 'Editing...' : 'Change'}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={(e) => startReassignment(job, e)}
                              className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1"
                            >
                              <Building2 className="w-4 h-4" />
                              {reassigningJob === (job.bookingId || job.rego) ? 'Editing below...' : 'Assign Supplier'}
                            </button>
                          )}
                        </div>
                        {job.supplierPrice && (
                          <div className="text-xs text-zinc-500 mt-1">Pay: {formatPrice(job.supplierPrice)}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-zinc-500 mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> Price
                        </div>
                        <div className="text-green-500 font-bold">{formatPrice(job.price)}</div>
                      </div>
                      {job.issueType && (
                        <div>
                          <div className="text-zinc-500 mb-1">Issue</div>
                          <div className="text-white">{job.issueType}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Inline Edit Form - Full Reallocation */}
                    {reassigningJob === (job.bookingId || job.rego) && (
                      <div className="mt-4 pt-4 border-t border-orange-500/30 bg-orange-500/5 -mx-4 px-4 pb-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-orange-500 flex items-center gap-2">
                            <ArrowRightLeft className="w-4 h-4" />
                            {job.supplierName ? 'Reallocate Job' : 'Assign Supplier'}
                          </h4>
                          <button
                            onClick={cancelReassignment}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Left Column - Customer & Vehicle */}
                          <div className="space-y-4">
                            {/* Customer Details */}
                            <div className="bg-zinc-900/50 rounded-lg p-3">
                              <h5 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                                <User className="w-3 h-3" /> Customer
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  value={editFormData.customerName}
                                  onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                                  placeholder="Name"
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                                <input
                                  type="text"
                                  value={editFormData.customerPhone}
                                  onChange={(e) => setEditFormData({...editFormData, customerPhone: e.target.value})}
                                  placeholder="Phone"
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                                <input
                                  type="email"
                                  value={editFormData.customerEmail}
                                  onChange={(e) => setEditFormData({...editFormData, customerEmail: e.target.value})}
                                  placeholder="Email"
                                  className="sm:col-span-2 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                              </div>
                            </div>
                            
                            {/* Vehicle Details */}
                            <div className="bg-zinc-900/50 rounded-lg p-3">
                              <h5 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                                <Car className="w-3 h-3" /> Vehicle
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={editFormData.vehicleMake}
                                  onChange={(e) => setEditFormData({...editFormData, vehicleMake: e.target.value})}
                                  placeholder="Make"
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                                <input
                                  type="text"
                                  value={editFormData.vehicleModel}
                                  onChange={(e) => setEditFormData({...editFormData, vehicleModel: e.target.value})}
                                  placeholder="Model"
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                                <input
                                  type="text"
                                  value={editFormData.vehicleColor}
                                  onChange={(e) => setEditFormData({...editFormData, vehicleColor: e.target.value})}
                                  placeholder="Color"
                                  className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                />
                              </div>
                            </div>
                            
                            {/* Locations */}
                            <div className="bg-zinc-900/50 rounded-lg p-3">
                              <h5 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Locations
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-zinc-500 mb-1 block">Pickup</label>
                                  <AddressPicker
                                    value={editFormData.pickupLocation}
                                    onChange={(address) => setEditFormData({...editFormData, pickupLocation: address})}
                                    placeholder="Search pickup location..."
                                    showMap={false}
                                    className="[&_input]:!bg-zinc-800 [&_input]:!border-zinc-700 [&_input]:!rounded [&_input]:!py-1.5 [&_input]:!text-sm [&_input]:!pl-8 [&_svg]:!w-4 [&_svg]:!h-4 [&_button]:!p-2 [&_button]:!rounded"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-zinc-500 mb-1 block">Dropoff</label>
                                  <AddressPicker
                                    value={editFormData.dropoffLocation}
                                    onChange={(address) => setEditFormData({...editFormData, dropoffLocation: address})}
                                    placeholder="Search dropoff location..."
                                    showMap={false}
                                    className="[&_input]:!bg-zinc-800 [&_input]:!border-zinc-700 [&_input]:!rounded [&_input]:!py-1.5 [&_input]:!text-sm [&_input]:!pl-8 [&_svg]:!w-4 [&_svg]:!h-4 [&_button]:!p-2 [&_button]:!rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Right Column - Supplier & Pricing */}
                          <div className="space-y-4">
                            {/* Supplier Selection */}
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3" ref={supplierDropdownRef}>
                              <h5 className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
                                <Building2 className="w-3 h-3" /> Select Supplier
                              </h5>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={selectedNewSupplier?.name || supplierSearch}
                                  onChange={(e) => {
                                    setSupplierSearch(e.target.value)
                                    setSelectedNewSupplier(null)
                                    setSupplierDropdownOpen(true)
                                  }}
                                  onFocus={() => setSupplierDropdownOpen(true)}
                                  placeholder="Search suppliers..."
                                  className="w-full bg-zinc-800 border border-orange-500/50 rounded px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-orange-500"
                                />
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                
                                {supplierDropdownOpen && supplierResults.length > 0 && (
                                  <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-40 overflow-y-auto">
                                    {supplierResults.map((supplier, i) => (
                                      <div
                                        key={i}
                                        role="button"
                                        tabIndex={0}
                                        onMouseDown={(e) => {
                                          e.preventDefault() // Prevent input blur
                                          e.stopPropagation()
                                          setSelectedNewSupplier({ 
                                            name: supplier.name, 
                                            phone: supplier.phone,
                                            phoneLandline: supplier.phoneLandline,
                                            mobile: supplier.mobile,
                                            email: supplier.email,
                                            address: supplier.address
                                          })
                                          setSupplierSearch(supplier.name)
                                          setSupplierDropdownOpen(false)
                                        }}
                                        className="w-full text-left px-3 py-2 hover:bg-zinc-800 text-sm cursor-pointer"
                                      >
                                        <div className="font-medium text-white">{supplier.name}</div>
                                        {supplier.address && (
                                          <div className="text-xs text-zinc-500 truncate">{supplier.address}</div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                              
                              {selectedNewSupplier && (
                                <div className="mt-3 space-y-2">
                                  <p className="text-xs text-zinc-500">Edit contact details for this job:</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                      <label className="text-xs text-zinc-500 mb-1 block">
                                        Phone {selectedNewSupplier.phoneLandline && <span className="text-amber-500">(Landline)</span>}
                                      </label>
                                      <input
                                        type="text"
                                        value={selectedNewSupplier.phone || ''}
                                        onChange={(e) => setSelectedNewSupplier({...selectedNewSupplier, phone: e.target.value})}
                                        placeholder="Phone"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-zinc-500 mb-1 block">Mobile (SMS)</label>
                                      <input
                                        type="text"
                                        value={selectedNewSupplier.mobile || ''}
                                        onChange={(e) => setSelectedNewSupplier({...selectedNewSupplier, mobile: e.target.value})}
                                        placeholder="Mobile"
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-xs text-zinc-500 mb-1 block">Email</label>
                                    <input
                                      type="email"
                                      value={selectedNewSupplier.email || ''}
                                      onChange={(e) => setSelectedNewSupplier({...selectedNewSupplier, email: e.target.value})}
                                      placeholder="Email"
                                      className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                    />
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                                    <input
                                      type="checkbox"
                                      checked={selectedNewSupplier.phoneLandline || false}
                                      onChange={(e) => setSelectedNewSupplier({...selectedNewSupplier, phoneLandline: e.target.checked})}
                                      className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-orange-500"
                                    />
                                    <span className="text-zinc-400">Phone is a landline (use mobile for SMS)</span>
                                  </label>
                                  
                                  {/* Show supplier address */}
                                  {selectedNewSupplier.address && (
                                    <p className="text-xs text-zinc-500 mt-2">
                                      📍 {selectedNewSupplier.address}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Pricing */}
                            <div className="bg-zinc-900/50 rounded-lg p-3">
                              <h5 className="text-xs font-medium text-zinc-400 mb-2 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Pricing
                              </h5>
                              <div className="space-y-3">
                                {/* Calculate price button */}
                                <button
                                  type="button"
                                  onClick={calculateDistance}
                                  disabled={calculatingPrice || !editFormData.pickupLocation || !editFormData.dropoffLocation}
                                  className="w-full px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded text-xs font-medium flex items-center justify-center gap-2"
                                >
                                  {calculatingPrice ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Calculating...
                                    </>
                                  ) : (
                                    <>
                                      <MapPin className="w-3 h-3" />
                                      Calculate Price from Distance
                                    </>
                                  )}
                                </button>
                                
                                {/* Distance info */}
                                {calculatedDistance && (
                                  <div className="text-xs bg-blue-500/10 border border-blue-500/30 rounded p-2">
                                    <div className="flex justify-between">
                                      <span className="text-zinc-400">Total Distance (round trip):</span>
                                      <span className="text-blue-400 font-medium">{calculatedDistance.km.toFixed(1)} km</span>
                                    </div>
                                    <div className="flex justify-between mt-1">
                                      <span className="text-zinc-400">KM Cost @ $4.03/km:</span>
                                      <span className="text-blue-400 font-medium">${calculatedDistance.suggestedPrice.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between mt-1 pt-1 border-t border-blue-500/20">
                                      <span className="text-zinc-500 text-[10px]">+ Callout $189-$289</span>
                                      <span className="text-zinc-500 text-[10px]">= ${(calculatedDistance.suggestedPrice + 189).toFixed(0)}-${(calculatedDistance.suggestedPrice + 289).toFixed(0)}</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* Customer Price Section */}
                                <div className="bg-green-500/10 border border-green-500/30 rounded p-2">
                                  <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-zinc-400">Customer Already Paid:</span>
                                    <span className="text-green-500 font-bold">{formatPrice(job.price)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 text-xs whitespace-nowrap">New Customer Price: $</span>
                                    <input
                                      type="number"
                                      value={editFormData.newCustomerPrice}
                                      onChange={(e) => {
                                        const newPrice = e.target.value
                                        setEditFormData({
                                          ...editFormData, 
                                          newCustomerPrice: newPrice,
                                          // Auto-check send payment if price increased
                                          sendAdditionalPayment: !!newPrice && parseInt(newPrice) > (job.price / 100)
                                        })
                                      }}
                                      placeholder={String(job.price / 100)}
                                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                    />
                                  </div>
                                  {editFormData.newCustomerPrice && parseInt(editFormData.newCustomerPrice) > (job.price / 100) && (
                                    <div className="mt-2 pt-2 border-t border-green-500/30">
                                      <div className="flex items-center justify-between text-xs mb-2">
                                        <span className="text-amber-400">Additional charge:</span>
                                        <span className="text-amber-400 font-bold">
                                          +${(parseInt(editFormData.newCustomerPrice) - (job.price / 100)).toFixed(2)}
                                        </span>
                                      </div>
                                      <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={editFormData.sendAdditionalPayment}
                                          onChange={(e) => setEditFormData({...editFormData, sendAdditionalPayment: e.target.checked})}
                                          className="w-3 h-3 rounded border-zinc-600 bg-zinc-800 text-green-500"
                                        />
                                        <span className="text-xs text-zinc-300">Send payment link to customer</span>
                                      </label>
                                    </div>
                                  )}
                                  {editFormData.newCustomerPrice && parseInt(editFormData.newCustomerPrice) < (job.price / 100) && (
                                    <div className="mt-2 text-xs text-red">
                                      ⚠️ Cannot reduce below already paid amount
                                    </div>
                                  )}
                                </div>
                                
                                {/* Supplier Price */}
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-400 text-sm whitespace-nowrap">Pay Supplier: $</span>
                                  <input
                                    type="number"
                                    value={editFormData.supplierPrice}
                                    onChange={(e) => setEditFormData({...editFormData, supplierPrice: e.target.value})}
                                    placeholder="0"
                                    className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500"
                                  />
                                </div>
                                
                                {/* Margin Summary */}
                                {editFormData.supplierPrice && (
                                  <div className="bg-zinc-800 rounded p-2 space-y-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-zinc-400">Customer Total:</span>
                                      <span className="text-white">
                                        ${editFormData.newCustomerPrice ? editFormData.newCustomerPrice : (job.price / 100).toFixed(0)}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-zinc-400">Supplier Cost:</span>
                                      <span className="text-white">-${editFormData.supplierPrice}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm pt-1 border-t border-zinc-700">
                                      <span className="text-zinc-400 font-medium">Your Margin:</span>
                                      {(() => {
                                        const customerTotal = editFormData.newCustomerPrice ? parseInt(editFormData.newCustomerPrice) : (job.price / 100)
                                        const supplierCost = parseInt(editFormData.supplierPrice || '0')
                                        const margin = customerTotal - supplierCost
                                        return (
                                          <span className={`font-bold ${margin >= 0 ? 'text-green-500' : 'text-red'}`}>
                                            ${margin.toFixed(2)}
                                          </span>
                                        )
                                      })()}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Notes */}
                            <div className="bg-zinc-900/50 rounded-lg p-3">
                              <h5 className="text-xs font-medium text-zinc-400 mb-2">Notes</h5>
                              <textarea
                                value={editFormData.notes}
                                onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                                placeholder="Notes for supplier..."
                                rows={2}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-white placeholder-zinc-500 resize-none"
                              />
                            </div>
                            
                            {/* Send Notification Toggle */}
                            <label className="flex items-center gap-3 cursor-pointer bg-zinc-900/50 rounded-lg p-3">
                              <input
                                type="checkbox"
                                checked={editFormData.sendToSupplier}
                                onChange={(e) => setEditFormData({...editFormData, sendToSupplier: e.target.checked})}
                                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-orange-500 focus:ring-orange-500"
                              />
                              <div>
                                <span className="text-sm text-white">Send notification to supplier</span>
                                <p className="text-xs text-zinc-500">SMS + Email with job link</p>
                              </div>
                            </label>
                          </div>
                        </div>
                        
                        {/* Save/Cancel Buttons */}
                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-zinc-800">
                          {supplierSaveResult && (
                            <div className={`flex-1 text-sm ${supplierSaveResult.success ? 'text-green-500' : 'text-red'}`}>
                              {supplierSaveResult.message}
                            </div>
                          )}
                          <button
                            onClick={cancelReassignment}
                            disabled={savingSupplier}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveSupplier(job); }}
                            disabled={!selectedNewSupplier || savingSupplier}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm flex items-center gap-2"
                          >
                            {savingSupplier ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                {editFormData.sendToSupplier ? 'Save & Send' : 'Save'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                      {job.status !== 'cancelled' && (
                        <>
                          {reassigningJob !== (job.bookingId || job.rego) && (
                            <button
                              onClick={(e) => startReassignment(job, e)}
                              className="px-3 py-2 bg-orange-500/20 text-orange-500 rounded-lg text-sm flex items-center gap-2 hover:bg-orange-500/30"
                            >
                              <Building2 className="w-4 h-4" />
                              {job.supplierName ? 'Reallocate' : 'Assign Supplier'}
                            </button>
                          )}
                          <a
                            href={`/admin?tab=comms&rego=${job.rego}`}
                            className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg text-sm flex items-center gap-2 hover:bg-zinc-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="w-4 h-4" />
                            Contact
                          </a>
                          <a
                            href={`/admin?tab=billing&rego=${job.rego}`}
                            className="px-3 py-2 bg-green-500/20 text-green-500 rounded-lg text-sm flex items-center gap-2 hover:bg-green-500/30"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DollarSign className="w-4 h-4" />
                            Invoice
                          </a>
                          <button
                            onClick={(e) => openCancelModal(job, e)}
                            className="px-3 py-2 bg-red/20 text-red rounded-lg text-sm flex items-center gap-2 hover:bg-red/30"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Job
                          </button>
                          <button
                            onClick={(e) => openPurgeModal(job, e)}
                            className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm flex items-center gap-2 hover:bg-red/20 hover:text-red border border-zinc-700 hover:border-red/50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Purge
                          </button>
                        </>
                      )}
                      {job.status === 'cancelled' && (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 text-zinc-500 text-sm">
                            <XCircle className="w-4 h-4" />
                            Cancelled
                          </div>
                          <button
                            onClick={(e) => openPurgeModal(job, e)}
                            className="px-3 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-sm flex items-center gap-2 hover:bg-red/20 hover:text-red border border-zinc-700 hover:border-red/50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Purge
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      
      {/* Cancel Modal */}
      {cancelModalOpen && jobToCancel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-display text-lg font-bold text-red flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                Cancel Job
              </h3>
              <button
                onClick={() => {
                  setCancelModalOpen(false)
                  setJobToCancel(null)
                  setCancelReason('')
                  setCancelResult(null)
                }}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Job Summary */}
              <div className="bg-zinc-950 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red/20 text-red px-3 py-2 rounded-lg font-mono font-bold">
                    {jobToCancel.rego}
                  </div>
                  <div>
                    <div className="font-medium">{jobToCancel.customerName || 'Customer'}</div>
                    <div className="text-sm text-zinc-500">{jobToCancel.pickupLocation}</div>
                  </div>
                </div>
                {jobToCancel.supplierName && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 text-sm">
                    <span className="text-zinc-500">Assigned to:</span>{' '}
                    <span className="text-orange-500">{jobToCancel.supplierName}</span>
                  </div>
                )}
              </div>
              
              {/* Warning */}
              <div className="bg-red/10 border border-red/20 rounded-lg p-3 mb-4 text-sm">
                <p className="text-red font-medium mb-1">This will notify all parties:</p>
                <ul className="text-zinc-400 space-y-1">
                  {jobToCancel.customerPhone && <li>• Customer SMS: {jobToCancel.customerPhone}</li>}
                  {jobToCancel.customerEmail && <li>• Customer Email: {jobToCancel.customerEmail}</li>}
                  {jobToCancel.supplierName && <li>• Supplier: {jobToCancel.supplierName}</li>}
                </ul>
              </div>
              
              {/* Reason Input */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">Cancellation reason (optional)</label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g., Customer changed plans, Weather conditions..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                />
              </div>
              
              {/* Result Message */}
              {cancelResult && (
                <div className={`rounded-lg p-3 mb-4 text-sm ${
                  cancelResult.success 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                    : 'bg-red/10 border border-red/20 text-red'
                }`}>
                  {cancelResult.message}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setCancelModalOpen(false)
                  setJobToCancel(null)
                  setCancelReason('')
                  setCancelResult(null)
                }}
                disabled={cancelling}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Keep Job
              </button>
              <button
                onClick={handleCancelJob}
                disabled={cancelling || cancelResult?.success}
                className="flex-1 px-4 py-2.5 bg-red hover:bg-red/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Cancelling...
                  </>
                ) : cancelResult?.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Cancelled
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Purge Modal */}
      {purgeModalOpen && jobToPurge && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-2xl border border-red/50 max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-red/30 bg-red/5">
              <h3 className="font-display text-lg font-bold text-red flex items-center gap-2">
                <Flame className="w-5 h-5" />
                Purge Record
              </h3>
              <button
                onClick={() => {
                  setPurgeModalOpen(false)
                  setJobToPurge(null)
                  setPurgeConfirmText('')
                  setPurgeResult(null)
                }}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              {/* Job Summary */}
              <div className="bg-zinc-950 rounded-xl p-4 mb-4 border border-red/20">
                <div className="flex items-center gap-3">
                  <div className="bg-red/20 text-red px-3 py-2 rounded-lg font-mono font-bold">
                    {jobToPurge.rego}
                  </div>
                  <div>
                    <div className="font-medium">{jobToPurge.customerName || 'Customer'}</div>
                    <div className="text-sm text-zinc-500">{jobToPurge.pickupLocation}</div>
                  </div>
                </div>
                {jobToPurge.bookingId && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500 font-mono">
                    ID: {jobToPurge.bookingId}
                  </div>
                )}
              </div>
              
              {/* Warning */}
              <div className="bg-red/10 border border-red/30 rounded-lg p-3 mb-4">
                <p className="text-red font-bold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  PERMANENT DELETION
                </p>
                <ul className="text-zinc-300 text-sm space-y-1">
                  <li>• This will permanently delete all data for this job</li>
                  <li>• This action cannot be undone</li>
                  <li>• No notifications will be sent</li>
                </ul>
              </div>
              
              {/* Confirmation Input */}
              <div className="mb-4">
                <label className="block text-sm text-zinc-400 mb-2">
                  Type <span className="text-red font-mono font-bold">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value.toUpperCase())}
                  placeholder="DELETE"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-red font-mono"
                />
              </div>
              
              {/* Result Message */}
              {purgeResult && (
                <div className={`rounded-lg p-3 mb-4 text-sm ${
                  purgeResult.success 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                    : 'bg-red/10 border border-red/20 text-red'
                }`}>
                  {purgeResult.message}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex gap-3 p-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setPurgeModalOpen(false)
                  setJobToPurge(null)
                  setPurgeConfirmText('')
                  setPurgeResult(null)
                }}
                disabled={purging}
                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeJob}
                disabled={purging || purgeConfirmText !== 'DELETE' || purgeResult?.success}
                className="flex-1 px-4 py-2.5 bg-red hover:bg-red/80 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Purging...
                  </>
                ) : purgeResult?.success ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Purged
                  </>
                ) : (
                  <>
                    <Flame className="w-4 h-4" />
                    Purge Forever
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
