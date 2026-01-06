'use client'

import { useState, useEffect, useRef } from 'react'
import { Car, Search, ChevronDown, MapPin, User, Clock, Loader2 } from 'lucide-react'

interface Job {
  rego: string
  bookingId?: string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  price: number
  status: string
  createdAt: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  eta?: string
  issueType?: string
  description?: string
  // Supplier data (start location = towing company)
  supplierName?: string
  supplierAddress?: string
  supplierCoords?: { lat: number; lng: number }
  supplierPhone?: string
  supplierPhoneLandline?: boolean
  supplierMobile?: string
  supplierEmail?: string
}

interface Props {
  value: string
  onChange: (rego: string, job?: Job) => void
  placeholder?: string
  label?: string
  required?: boolean
  statusFilter?: string[] // Filter by status e.g. ['pending', 'booked', 'assigned']
  unassignedOnly?: boolean // Only show jobs without a supplier assigned
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-500',
  booked: 'bg-blue-500/20 text-blue-500',
  assigned: 'bg-orange-500/20 text-orange-500',
  in_progress: 'bg-green-500/20 text-green-500',
  completed: 'bg-zinc-500/20 text-zinc-500',
}

export default function JobPicker({ 
  value, 
  onChange, 
  placeholder = 'Search or select job...', 
  label,
  required,
  statusFilter = ['pending', 'booked', 'assigned', 'in_progress'],
  unassignedOnly = false
}: Props) {
  const [open, setOpen] = useState(false)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState(value)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Stringify statusFilter for stable dependency (arrays change reference on each render)
  const statusFilterKey = statusFilter.join(',')
  
  // Fetch jobs once on mount and when status filter changes
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/jobs?limit=100')
        const data = await response.json()
        if (data.success && data.jobs) {
          // Filter by status and optionally by unassigned
          const filtered = data.jobs.filter((job: Job) => {
            // Must match status filter
            if (!statusFilter.includes(job.status)) return false
            // If unassignedOnly, exclude jobs with a supplier already assigned
            if (unassignedOnly && job.supplierName) return false
            return true
          })
          setJobs(filtered)
        }
      } catch (e) {
        console.error('Failed to fetch jobs:', e)
      } finally {
        setLoading(false)
      }
    }
    
    fetchJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilterKey, unassignedOnly])
  
  // Set selected job when value changes (separate from fetch)
  useEffect(() => {
    if (value && jobs.length > 0) {
      const match = jobs.find((j: Job) => 
        j.rego === value.toUpperCase() || j.bookingId === value
      )
      if (match) {
        // Only update if the job ID actually changed (not just reference)
        setSelectedJob(prev => {
          if (!prev || prev.rego !== match.rego) {
            setSearch(match.rego)
            return match
          }
          return prev
        })
      }
    }
  }, [value, jobs])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter jobs by search (rego, booking ID, customer name, phone, location)
  const filteredJobs = jobs.filter(job => {
    const searchLower = search.toLowerCase()
    return (
      job.rego?.toLowerCase().includes(searchLower) ||
      job.bookingId?.toLowerCase().includes(searchLower) ||
      job.customerName?.toLowerCase().includes(searchLower) ||
      job.customerPhone?.includes(search) ||
      job.pickupLocation?.toLowerCase().includes(searchLower)
    )
  })

  const handleSelect = (job: Job) => {
    setSelectedJob(job)
    // Show rego in the search field (more user-friendly than bookingId)
    setSearch(job.rego)
    // Pass bookingId as the identifier (fallback to rego for old jobs)
    onChange(job.bookingId || job.rego, job)
    setOpen(false)
  }

  const handleInputChange = (val: string) => {
    setSearch(val.toUpperCase())
    onChange(val.toUpperCase())
    setOpen(true)
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label} {required && <span className="text-red">*</span>}
        </label>
      )}
      
      {/* Input */}
      <div className="relative">
        <Car className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-zinc-800/50 border border-zinc-700/50 rounded-xl pl-12 pr-10 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red/50 uppercase"
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>

      {/* Selected job info */}
      {selectedJob && !open && (
        <div className="mt-2 bg-zinc-800/30 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400">{selectedJob.customerName || 'No name'}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[selectedJob.status] || 'bg-zinc-500/20'}`}>
              {selectedJob.status}
            </span>
          </div>
          <div className="text-zinc-500 text-xs mt-1 truncate">
            {selectedJob.pickupLocation}
          </div>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Loading jobs...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              {search ? `No jobs matching "${search}"` : 'No open jobs'}
            </div>
          ) : (
            <div className="py-2">
              {filteredJobs.map((job) => (
                <button
                  key={job.bookingId || job.rego}
                  type="button"
                  onClick={() => handleSelect(job)}
                  className={`w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors ${
                    selectedJob?.bookingId === job.bookingId ? 'bg-zinc-800' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-red">{job.rego || 'N/A'}</span>
                      {job.bookingId && (
                        <span className="text-zinc-600 text-xs font-mono">
                          {job.bookingId}
                        </span>
                      )}
                      {job.vehicleMake && (
                        <span className="text-zinc-500 text-sm">
                          {job.vehicleMake} {job.vehicleModel}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[job.status] || 'bg-zinc-500/20'}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-500">
                    {job.customerName && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {job.customerName}
                      </span>
                    )}
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />
                      {job.pickupLocation}
                    </span>
                    <span className="text-green-500 font-medium ml-auto">
                      {formatPrice(job.price)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
