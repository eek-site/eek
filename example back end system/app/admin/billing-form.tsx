'use client'

import { useState, useEffect } from 'react'
import { type BillingFormData, FORMATTERS } from '@/lib/eek-data-schema'
import JobPicker from '@/components/JobPicker'
import { 
  DollarSign, Send, CheckCircle, AlertCircle, FileText, User, MapPin, Car,
  Truck, Clock, Building2, CreditCard, Download, Loader2, X, Plus, Receipt
} from 'lucide-react'

interface Props {
  user: { email: string; name: string; role: string } | null
  initialRego?: string
}

interface AdditionalCharge {
  amount: number
  reason: string
  addedAt: string
  addedBy: string
  transactionId?: string
  status: 'pending' | 'paid' | 'cancelled'
}

interface JobData {
  id: string
  bookingId: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  pickupLocation: string
  dropoffLocation?: string
  vehicleRego?: string
  issueType: string
  status: string
  quotedPrice?: number
  createdAt: string
  // Additional charges
  additionalCharges?: AdditionalCharge[]
  totalPaid?: number
  // Supplier info
  supplierName?: string
  supplierEmail?: string
  supplierPhone?: string
  supplierPrice?: number
  supplierInvoiceRef?: string
  supplierInvoiceAmount?: number
  supplierPaymentApproved?: boolean
  supplierApprovedAmount?: number
  supplierPaidAt?: string
}

export default function BillingForm({ user, initialRego }: Props) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  
  const [searchId, setSearchId] = useState(initialRego || '')
  const [job, setJob] = useState<JobData | null>(null)
  
  // Auto-load job if initialRego is provided
  useEffect(() => {
    if (initialRego) {
      searchJob(initialRego)
    }
  }, [initialRego])
  
  // Customer invoice form
  const [formData, setFormData] = useState<BillingFormData>({
    jobId: '',
    amount: 0,
    description: '',
    sendToCustomer: true
  })
  
  // Supplier payment form
  const [supplierPaymentAmount, setSupplierPaymentAmount] = useState<number>(0)
  const [approvingPayment, setApprovingPayment] = useState(false)
  const [editingApprovedAmount, setEditingApprovedAmount] = useState(false)
  const [closingJob, setClosingJob] = useState(false)
  const [generatingDlo, setGeneratingDlo] = useState(false)
  
  // Additional charges form
  const [additionalAmount, setAdditionalAmount] = useState<number>(0)
  const [additionalReason, setAdditionalReason] = useState('')
  const [sendChargeLink, setSendChargeLink] = useState(true)
  const [addingCharge, setAddingCharge] = useState(false)

  const fetchFullJobData = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(jobId)}`)
      const data = await response.json()
      
      if (!data.success || !data.job) {
        return null
      }
      
      const jobRecord = data.job
      
      // Parse additional charges if present
      let additionalCharges: AdditionalCharge[] = []
      if (jobRecord.additionalCharges) {
        try {
          additionalCharges = typeof jobRecord.additionalCharges === 'string'
            ? JSON.parse(jobRecord.additionalCharges)
            : jobRecord.additionalCharges
        } catch {
          additionalCharges = []
        }
      }
      
      return {
        id: jobRecord.bookingId || jobRecord.rego,
        bookingId: jobRecord.bookingId || '',
        customerName: jobRecord.customerName || 'Customer',
        customerPhone: jobRecord.customerPhone || '',
        customerEmail: jobRecord.customerEmail || '',
        pickupLocation: jobRecord.pickupLocation || '',
        dropoffLocation: jobRecord.dropoffLocation || '',
        vehicleRego: jobRecord.rego,
        issueType: jobRecord.issueType || 'Tow',
        status: jobRecord.status || 'pending',
        quotedPrice: jobRecord.price ? jobRecord.price / 100 : 0,
        createdAt: jobRecord.createdAt,
        // Additional charges
        additionalCharges,
        totalPaid: jobRecord.totalPaid,
        // Supplier data
        supplierName: jobRecord.supplierName,
        supplierEmail: jobRecord.supplierEmail,
        supplierPhone: jobRecord.supplierPhone,
        supplierPrice: jobRecord.supplierPrice,
        supplierInvoiceRef: jobRecord.supplierInvoiceRef,
        supplierInvoiceAmount: jobRecord.supplierInvoiceAmount,
        supplierPaymentApproved: jobRecord.supplierPaymentApproved,
        supplierApprovedAmount: jobRecord.supplierApprovedAmount,
        supplierPaidAt: jobRecord.supplierPaidAt,
      } as JobData
    } catch (e) {
      console.error('Job fetch error:', e)
      return null
    }
  }

  const searchJob = async (regoOverride?: string) => {
    const searchTerm = regoOverride || searchId
    if (!searchTerm.trim()) {
      setError('Please enter a job ID or rego')
      return
    }

    setSearching(true)
    setError(null)
    setJob(null)

    const foundJob = await fetchFullJobData(searchTerm.toUpperCase())
    
    if (!foundJob) {
      setError('Job not found. Check the rego and try again.')
      setSearching(false)
      return
    }

    setJob(foundJob)
    setFormData(prev => ({
      ...prev,
      jobId: foundJob.id,
      amount: foundJob.quotedPrice || 0
    }))
    // Set supplier payment amount to invoice amount or supplier price
    const supplierAmount = (foundJob.supplierInvoiceAmount || foundJob.supplierPrice || 0) / 100
    setSupplierPaymentAmount(supplierAmount)
    setSearching(false)
  }
  
  const approveSupplierPayment = async () => {
    if (!job?.bookingId) {
      setError('No job selected')
      return
    }
    
    if (supplierPaymentAmount <= 0) {
      setError('Enter a valid payment amount')
      return
    }
    
    setApprovingPayment(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/approve-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: job.bookingId,
          approvedAmount: Math.round(supplierPaymentAmount * 100) // Convert to cents
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to approve payment')
      }
      
      // Refresh job data
      const updatedJob = await fetchFullJobData(job.bookingId)
      if (updatedJob) {
        setJob(updatedJob)
      }
      
      setEditingApprovedAmount(false)
      setSuccessMessage(`Payment of $${supplierPaymentAmount.toFixed(2)} approved! Confirmation email sent to ${job.supplierEmail || 'supplier'}.`)
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve payment')
    } finally {
      setApprovingPayment(false)
    }
  }
  
  const closeJob = async () => {
    if (!job?.bookingId) {
      setError('No job selected')
      return
    }
    
    setClosingJob(true)
    setError(null)
    
    try {
      // 1. Update job status to completed
      const updateResponse = await fetch(`/api/jobs/${job.bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' })
      })
      
      if (!updateResponse.ok) {
        throw new Error('Failed to close job')
      }
      
      // 2. Send customer invoice (paid receipt, not payment link)
      if (job.customerEmail) {
        await fetch('/api/send-customer-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: job.bookingId
          })
        })
      }
      
      // Refresh job data
      const updatedJob = await fetchFullJobData(job.bookingId)
      if (updatedJob) {
        setJob(updatedJob)
      }
      
      setSuccessMessage('Job closed! Customer invoice notification sent.')
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to close job')
    } finally {
      setClosingJob(false)
    }
  }
  
  const generateDlo = async () => {
    setGeneratingDlo(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/generate-dlo')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate DLO')
      }
      
      // Download the file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `HookTowing_Payments_${new Date().toISOString().split('T')[0]}.DLO`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
      
      // Check upload status from headers
      const blobSuccess = response.headers.get('X-Blob-Upload-Success') === 'true'
      const sharePointSuccess = response.headers.get('X-SharePoint-Upload-Success') === 'true'
      
      const locations = []
      if (blobSuccess) locations.push('Cloud')
      if (sharePointSuccess) locations.push('SharePoint')
      
      if (locations.length > 0) {
        setSuccessMessage(`DLO file generated and saved to ${locations.join(' & ')}!`)
      } else {
        setSuccessMessage('DLO file downloaded successfully!')
      }
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate DLO')
    } finally {
      setGeneratingDlo(false)
    }
  }
  
  const addAdditionalCharge = async () => {
    if (!job?.bookingId) {
      setError('No job selected')
      return
    }
    
    if (additionalAmount <= 0) {
      setError('Enter a valid amount')
      return
    }
    
    if (!additionalReason.trim()) {
      setError('Enter a reason for the charge')
      return
    }
    
    setAddingCharge(true)
    setError(null)
    
    try {
      const response = await fetch('/api/additional-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: job.bookingId,
          amount: additionalAmount,
          reason: additionalReason.trim(),
          sendPaymentLink: sendChargeLink,
          addedBy: user?.email || 'admin'
        })
      })
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to add charge')
      }
      
      // Refresh job data
      const updatedJob = await fetchFullJobData(job.bookingId)
      if (updatedJob) {
        setJob(updatedJob)
      }
      
      // Reset form
      setAdditionalAmount(0)
      setAdditionalReason('')
      
      if (sendChargeLink && job.customerEmail) {
        setSuccessMessage(`Additional charge of $${additionalAmount.toFixed(2)} added. Payment link sent to ${job.customerEmail}.`)
      } else {
        setSuccessMessage(`Additional charge of $${additionalAmount.toFixed(2)} added to job.`)
      }
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add charge')
    } finally {
      setAddingCharge(false)
    }
  }

  const sendInvoice = async () => {
    if (!job) {
      setError('Please search for a job first')
      return
    }

    if (formData.amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use internal send API for invoices
      const response = await fetch('/api/send-booking-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          link: `Invoice: $${formData.amount} - ${formData.description}`,
          phone: job.customerPhone,
          email: job.customerEmail,
          customerName: job.customerName || 'Customer',
          price: `$${formData.amount}`,
          eta: 'Invoice',
          method: job.customerEmail ? 'email' : 'sms',
          isInvoice: true,
          invoiceData: {
            jobId: job.id,
            amount: formData.amount,
            description: formData.description,
            sendToCustomer: formData.sendToCustomer,
            sentBy: user?.email || 'unknown',
            sentAt: new Date().toISOString()
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send invoice')
      }

      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send invoice')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSearchId('')
    setJob(null)
    setFormData({
      jobId: '',
      amount: 0,
      description: '',
      sendToCustomer: true
    })
    setSupplierPaymentAmount(0)
    setAdditionalAmount(0)
    setAdditionalReason('')
    setSendChargeLink(true)
    setSuccess(false)
    setSuccessMessage('')
    setError(null)
  }
  
  const continueWithJob = () => {
    setSuccess(false)
    setSuccessMessage('')
  }

  if (success) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Success!</h2>
        <p className="text-zinc-400 mb-8">{successMessage}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={continueWithJob}
            className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Continue with Job
          </button>
          <button
            onClick={resetForm}
            className="bg-red hover:bg-red-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Bill Another Job
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Error */}
      {error && (
        <div className="bg-red/10 border border-red/20 text-red px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Select Job */}
      <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-red" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Select Job to Invoice</h2>
            <p className="text-zinc-500 text-sm">Choose from completed jobs ready for billing</p>
          </div>
        </div>

        <JobPicker
          value={searchId}
          onChange={async (rego, selectedJob) => {
            setSearchId(rego)
            if (selectedJob) {
              // Fetch full job data including supplier info
              const fullJob = await fetchFullJobData(selectedJob.bookingId || selectedJob.rego)
              if (fullJob) {
                setJob(fullJob)
                setFormData(prev => ({
                  ...prev,
                  jobId: fullJob.id,
                  amount: fullJob.quotedPrice || 0
                }))
                const supplierAmount = (fullJob.supplierInvoiceAmount || fullJob.supplierPrice || 0) / 100
                setSupplierPaymentAmount(supplierAmount)
              }
            } else {
              setJob(null)
            }
          }}
          placeholder="Select job to invoice..."
          statusFilter={['pending', 'booked', 'assigned', 'in_progress', 'completed']}
        />
      </div>

      {/* Job Details */}
      {job && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Job Found</h2>
              <p className="text-zinc-500 text-sm">Job #{job.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <User className="w-4 h-4" />
                Customer
              </div>
              <div className="font-medium">{job.customerName}</div>
              <div className="text-zinc-400 text-sm">{job.customerPhone}</div>
              {job.customerEmail && (
                <div className="text-zinc-400 text-sm">{job.customerEmail}</div>
              )}
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <MapPin className="w-4 h-4" />
                Location
              </div>
              <div className="font-medium">{job.pickupLocation}</div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <Car className="w-4 h-4" />
                Vehicle
              </div>
              <div className="font-medium">{job.vehicleRego || 'Not provided'}</div>
              <div className="text-zinc-400 text-sm">{job.issueType}</div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Original Payment
              </div>
              <div className="font-medium text-lg text-green-400">
                {job.quotedPrice ? FORMATTERS.currency(job.quotedPrice) : 'No quote'}
              </div>
            </div>
          </div>
          
          {/* Additional Charges Summary */}
          {job.additionalCharges && job.additionalCharges.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h3 className="font-medium text-sm text-zinc-400 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Additional Charges
              </h3>
              <div className="space-y-2">
                {job.additionalCharges.map((charge, i) => (
                  <div key={i} className="flex items-center justify-between bg-zinc-800/30 rounded-lg p-3 text-sm">
                    <div className="flex-1">
                      <span className="text-white">{charge.reason}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        charge.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        charge.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {charge.status}
                      </span>
                    </div>
                    <span className={`font-medium ${charge.status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                      {FORMATTERS.currency(charge.amount / 100)}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Total Received */}
              <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Total Customer Paid:</span>
                <span className="text-xl font-bold text-green-400">
                  {FORMATTERS.currency(
                    (job.quotedPrice || 0) + 
                    job.additionalCharges
                      .filter(c => c.status === 'paid')
                      .reduce((sum, c) => sum + c.amount / 100, 0)
                  )}
                </span>
              </div>
              
              {/* Pending charges */}
              {job.additionalCharges.some(c => c.status === 'pending') && (
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-yellow-400">Pending charges:</span>
                  <span className="text-yellow-400 font-medium">
                    {FORMATTERS.currency(
                      job.additionalCharges
                        .filter(c => c.status === 'pending')
                        .reduce((sum, c) => sum + c.amount / 100, 0)
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Add Additional Charge Section */}
      {job && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Plus className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Add Additional Charge</h2>
              <p className="text-zinc-500 text-sm">Charge extra for supplier swap, location change, etc.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-zinc-500 mb-2">Amount *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  value={additionalAmount || ''}
                  onChange={(e) => setAdditionalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-yellow-500 text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-zinc-500 mb-2">Reason *</label>
              <select
                value={additionalReason}
                onChange={(e) => setAdditionalReason(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="">Select reason...</option>
                <option value="Supplier swap - rate adjustment">Supplier swap - rate adjustment</option>
                <option value="Location change - distance adjustment">Location change - distance adjustment</option>
                <option value="After-hours callout fee">After-hours callout fee</option>
                <option value="Winching / recovery fee">Winching / recovery fee</option>
                <option value="Wait time charge">Wait time charge</option>
                <option value="Lockout service">Lockout service</option>
                <option value="Fuel delivery">Fuel delivery</option>
                <option value="Tyre change">Tyre change</option>
                <option value="Jump start">Jump start</option>
                <option value="Storage fee">Storage fee</option>
                <option value="Administration fee">Administration fee</option>
                <option value="Other - see description">Other - see description</option>
              </select>
            </div>
          </div>
          
          {additionalReason === 'Other - see description' && (
            <div className="mb-4">
              <label className="block text-sm text-zinc-500 mb-2">Custom reason</label>
              <input
                type="text"
                value=""
                onChange={(e) => setAdditionalReason(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                placeholder="Describe the reason..."
              />
            </div>
          )}
          
          <div 
            onClick={() => setSendChargeLink(!sendChargeLink)}
            className="flex items-center gap-3 cursor-pointer group mb-4"
          >
            <div className={`relative w-10 h-5 rounded-full transition-colors ${sendChargeLink ? 'bg-yellow-500' : 'bg-zinc-600'}`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${sendChargeLink ? 'left-5' : 'left-0.5'}`} />
            </div>
            <span className="text-sm group-hover:text-white transition-colors">
              Send payment link to customer ({job.customerEmail || 'no email'})
            </span>
          </div>
          
          <button
            onClick={addAdditionalCharge}
            disabled={addingCharge || additionalAmount <= 0 || !additionalReason.trim()}
            className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {addingCharge ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            Add Charge {additionalAmount > 0 && `(${FORMATTERS.currency(additionalAmount)})`}
          </button>
        </div>
      )}
      
      {/* Supplier Payment Section */}
      {job && job.supplierName && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Supplier Payment</h2>
              <p className="text-zinc-500 text-sm">{job.supplierName}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <Building2 className="w-4 h-4" />
                Supplier
              </div>
              <div className="font-medium">{job.supplierName}</div>
              {job.supplierEmail && (
                <div className="text-zinc-400 text-sm">{job.supplierEmail}</div>
              )}
              {job.supplierPhone && (
                <a href={`tel:${job.supplierPhone}`} className="text-orange-400 text-sm hover:underline">
                  {job.supplierPhone}
                </a>
              )}
            </div>
            
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Status
              </div>
              {job.supplierPaidAt ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-400 font-medium">Paid</span>
                </div>
              ) : job.supplierPaymentApproved ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-400 font-medium">Approved - Pending DLO</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="text-yellow-400 font-medium">Awaiting Approval</span>
                </div>
              )}
            </div>
            
            {job.supplierInvoiceRef && (
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                  <FileText className="w-4 h-4" />
                  Supplier Invoice
                </div>
                <div className="font-medium font-mono">{job.supplierInvoiceRef}</div>
                {job.supplierInvoiceAmount && (
                  <div className="text-zinc-400 text-sm">
                    Requested: {FORMATTERS.currency(job.supplierInvoiceAmount / 100)}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-zinc-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-zinc-500 text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Agreed Rate
              </div>
              <div className="font-medium text-lg text-orange-400">
                {(job.supplierApprovedAmount || job.supplierPrice) 
                  ? FORMATTERS.currency((job.supplierApprovedAmount || job.supplierPrice || 0) / 100) 
                  : 'Not set'}
              </div>
            </div>
          </div>
          
          {/* Payment Approval Form */}
          {!job.supplierPaymentApproved && !job.supplierPaidAt && (
            <div className="bg-zinc-800/30 rounded-xl p-4 border border-zinc-700">
              <h3 className="font-medium mb-4">Approve Supplier Payment</h3>
              
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-500 mb-2">Payment Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      value={supplierPaymentAmount || ''}
                      onChange={(e) => setSupplierPaymentAmount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white focus:outline-none focus:border-orange-500 text-lg"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">
                    Edit amount if needed, then approve
                  </p>
                </div>
                
                <button
                  onClick={approveSupplierPayment}
                  disabled={approvingPayment || supplierPaymentAmount <= 0}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                >
                  {approvingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Approve Payment
                </button>
              </div>
            </div>
          )}
          
          {/* Already approved - with edit option */}
          {job.supplierPaymentApproved && !job.supplierPaidAt && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              {editingApprovedAmount ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-400">Edit Approved Amount</span>
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm text-zinc-500 mb-2">New Amount</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                        <input
                          type="number"
                          value={supplierPaymentAmount || ''}
                          onChange={(e) => setSupplierPaymentAmount(parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white"
                          placeholder={(job.supplierApprovedAmount || 0) / 100 + ''}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <button
                      onClick={approveSupplierPayment}
                      disabled={approvingPayment || supplierPaymentAmount <= 0}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
                    >
                      {approvingPayment ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Update
                    </button>
                    <button
                      onClick={() => setEditingApprovedAmount(false)}
                      className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="font-medium text-green-400">Payment Approved</p>
                      <p className="text-zinc-500 text-sm">
                        {FORMATTERS.currency((job.supplierApprovedAmount || 0) / 100)} - Ready for DLO
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSupplierPaymentAmount((job.supplierApprovedAmount || 0) / 100)
                      setEditingApprovedAmount(true)
                    }}
                    className="text-orange-400 hover:text-orange-300 text-sm font-medium flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Edit Amount
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invoice Form */}
      {job && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-red/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Invoice Details</h2>
              <p className="text-zinc-500 text-sm">Set the amount and send</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Amount <span className="text-red">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-8 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red text-lg"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-red"
                rows={3}
                placeholder="Invoice description or notes..."
              />
            </div>

            <div 
              onClick={() => setFormData(prev => ({ ...prev, sendToCustomer: !prev.sendToCustomer }))}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.sendToCustomer ? 'bg-red' : 'bg-zinc-600'}`}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.sendToCustomer ? 'left-5' : 'left-0.5'}`} />
              </div>
              <span className="text-sm group-hover:text-white transition-colors">
                Send invoice to customer via email
              </span>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={sendInvoice}
              disabled={loading}
              className="bg-red hover:bg-red-dark text-white font-semibold px-8 py-3 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      {job && (
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold">Quick Actions</h2>
              <p className="text-zinc-500 text-sm">Close job and process payments</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Close Job */}
            {job.status !== 'completed' && job.status !== 'closed' && (
              <button
                onClick={closeJob}
                disabled={closingJob}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
              >
                {closingJob ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                <div className="text-left">
                  <div>Close Job</div>
                  <div className="text-xs font-normal opacity-75">Mark complete & notify customer</div>
                </div>
              </button>
            )}
            
            {/* Generate DLO */}
            <button
              onClick={generateDlo}
              disabled={generatingDlo}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
            >
              {generatingDlo ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <div className="text-left">
                <div>Generate DLO</div>
                <div className="text-xs font-normal opacity-75">Save to Cloud & SharePoint</div>
              </div>
            </button>
            
            {/* View Customer Invoice */}
            {job.bookingId && (
              <a
                href={`/invoice/${job.bookingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div>Customer Invoice</div>
                  <div className="text-xs font-normal opacity-75">View/print invoice</div>
                </div>
              </a>
            )}
            
            {/* View Supplier Invoice */}
            {job.bookingId && job.supplierName && (
              <a
                href={`/supplier-invoice/${job.bookingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-zinc-700 hover:bg-zinc-600 text-white font-semibold px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
              >
                <Truck className="w-5 h-5" />
                <div className="text-left">
                  <div>Supplier Invoice</div>
                  <div className="text-xs font-normal opacity-75">Buyer-created invoice</div>
                </div>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
