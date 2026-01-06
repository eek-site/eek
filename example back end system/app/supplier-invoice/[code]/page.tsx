'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { 
  MapPin, 
  Car, 
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  Building2,
  FileText,
  Printer,
  Clock
} from 'lucide-react'

interface SupplierJobData {
  ref: string
  rego: string
  supplierName: string
  pickup: string
  dropoff?: string
  price: number
  supplierApprovedAmount?: number
  supplierPaymentApproved?: boolean
  supplierPaidAt?: string
  invoiceAmount?: number
  invoiceSubmittedAt?: string
  customerName?: string
  createdAt: string
  bankAccount?: string
  bankName?: string
  accountHolderName?: string
}

export default function SupplierInvoicePage() {
  const params = useParams()
  const code = params.code as string // This is the bookingId (HT-xxx)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobData, setJobData] = useState<SupplierJobData | null>(null)

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        // Try loading from main jobs API (uses bookingId)
        const response = await fetch(`/api/jobs/${code}`)
        const result = await response.json()
        
        if (result.success && result.job) {
          const job = result.job
          // Map job data to supplier invoice format
          setJobData({
            ref: job.bookingId || code,
            rego: job.rego || '',
            supplierName: job.supplierName || 'Supplier',
            pickup: job.pickupLocation || '',
            dropoff: job.dropoffLocation,
            price: job.supplierPrice || job.price || 0,
            supplierApprovedAmount: job.supplierApprovedAmount,
            supplierPaymentApproved: job.supplierPaymentApproved,
            supplierPaidAt: job.supplierPaidAt,
            invoiceAmount: job.supplierInvoiceAmount || job.supplierApprovedAmount,
            invoiceSubmittedAt: job.supplierInvoiceSubmittedAt || job.supplierApprovedAt,
            customerName: job.customerName,
            createdAt: job.createdAt,
            bankAccount: job.supplierBankAccount,
            bankName: job.supplierBankName,
            accountHolderName: job.supplierAccountHolderName
          })
        } else {
          // Fallback to supplier-job API for legacy data
          const sjResponse = await fetch(`/api/supplier-job/${code}`)
          const sjResult = await sjResponse.json()
          
          if (sjResult.success && sjResult.supplierJob) {
            setJobData(sjResult.supplierJob)
          } else {
            setError('Invoice not found')
          }
        }
      } catch (e) {
        console.error('Failed to fetch invoice:', e)
        setError('Failed to load invoice')
      } finally {
        setLoading(false)
      }
    }
    
    loadInvoiceData()
  }, [code])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
      </main>
    )
  }

  if (error || !jobData) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a href="tel:0800769000" className="text-red-600 hover:underline">
            Call 0800 769 000
          </a>
        </div>
      </main>
    )
  }

  const invoiceDate = jobData.invoiceSubmittedAt 
    ? new Date(jobData.invoiceSubmittedAt) 
    : new Date()
  
  const invoiceAmount = jobData.invoiceAmount 
    ? jobData.invoiceAmount / 100 
    : (jobData.price / 100)

  // Generate a simple invoice number
  const invoiceNumber = `INV-${jobData.ref.replace('SJ-', '').slice(0, 8).toUpperCase()}`

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
          @page { margin: 1cm; }
        }
      `}</style>

      <main className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
        {/* Print Button */}
        <div className="no-print max-w-3xl mx-auto mb-4 px-6 flex justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Invoice
          </button>
        </div>

        {/* Invoice */}
        <div className="max-w-3xl mx-auto bg-white shadow-lg print:shadow-none">
          {/* Header - Supplier branding */}
          <div className="bg-zinc-900 text-white px-8 py-6 print:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{jobData.supplierName}</h1>
                <p className="text-zinc-400 text-sm">Towing Services</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-orange-500">INVOICE</div>
                <div className="text-zinc-400 text-sm mt-1">{invoiceNumber}</div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-8">
            {/* Meta Info */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">BILLED TO</h3>
                <p className="font-bold text-gray-900">Eek Mechanical NZ Ltd</p>
                <p className="text-gray-600 text-sm">www.eek.co.nz</p>
                <p className="text-gray-600 text-sm">0800 769 000</p>
              </div>
              <div className="text-right">
                <h3 className="text-gray-500 text-sm font-medium mb-1">INVOICE DATE</h3>
                <p className="font-bold text-gray-900">
                  {invoiceDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {jobData.invoiceSubmittedAt ? (
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium text-sm">SUBMITTED</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <span className="text-yellow-600 font-medium text-sm">DRAFT</span>
                  </div>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 print:bg-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-500" />
                Job Details
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Job Reference</p>
                  <p className="font-mono text-gray-900">{jobData.ref}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Vehicle Rego</p>
                  <p className="font-mono text-red-600 font-bold">{jobData.rego}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">PICKUP</p>
                    <p className="text-gray-900 text-sm">{jobData.pickup}</p>
                  </div>
                </div>
                {jobData.dropoff && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">DROP-OFF</p>
                      <p className="text-gray-900 text-sm">{jobData.dropoff}</p>
                    </div>
                  </div>
                )}
              </div>

              {jobData.customerName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-500 text-xs">CUSTOMER</p>
                  <p className="text-gray-900 text-sm">{jobData.customerName}</p>
                </div>
              )}
            </div>

            {/* Line Items */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 text-gray-500 font-medium text-sm">DESCRIPTION</th>
                  <th className="text-right py-3 text-gray-500 font-medium text-sm">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium text-gray-900">Vehicle Towing Service</p>
                    <p className="text-gray-500 text-sm">
                      {jobData.rego} - {jobData.pickup?.split(',')[0]} to {jobData.dropoff?.split(',')[0] || 'destination'}
                    </p>
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    ${invoiceAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-4 text-right font-bold text-gray-900">TOTAL (NZD)</td>
                  <td className="py-4 text-right text-2xl font-bold text-orange-500">
                    ${invoiceAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment Status & Bank Details */}
            {jobData.supplierPaidAt ? (
              <div className="bg-green-50 rounded-xl p-4 mb-4 print:bg-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-700">Payment Sent</p>
                </div>
                <p className="text-green-600 text-sm">
                  ${invoiceAmount.toFixed(2)} transferred to your bank account via ANZ batch transfer.
                </p>
                {jobData.bankAccount && (
                  <p className="text-green-600 text-xs mt-1">
                    Account: ****{jobData.bankAccount.slice(-4)}
                  </p>
                )}
              </div>
            ) : jobData.supplierPaymentApproved ? (
              <div className="bg-blue-50 rounded-xl p-4 mb-4 print:bg-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <p className="font-medium text-blue-700">Payment Approved - Processing</p>
                </div>
                <p className="text-blue-600 text-sm">
                  Your payment has been approved and will be transferred via ANZ batch transfer.
                </p>
              </div>
            ) : (
              <div className="bg-orange-50 rounded-xl p-4 mb-4 print:bg-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <p className="font-medium text-orange-700">Awaiting Payment Approval</p>
                </div>
                <p className="text-orange-600 text-sm">
                  This invoice is pending approval. Payment will be processed instantly via ANZ batch transfer once approved.
                </p>
              </div>
            )}

            {/* Payment Terms */}
            <div className="bg-gray-50 rounded-xl p-4 print:bg-gray-100">
              <p className="font-medium text-gray-700 mb-2">Payment Terms</p>
              <p className="text-gray-600 text-sm">
                Payments are processed instantly via ANZ batch transfer. Funds typically arrive within:
              </p>
              <ul className="text-gray-600 text-xs mt-2 space-y-1">
                <li>• ANZ to ANZ: Instant</li>
                <li>• ANZ to other banks: Same business day (by 11pm)</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-gray-500 text-sm">
                <div>
                  <p className="font-bold text-gray-900">{jobData.supplierName}</p>
                  <p>Invoice #{invoiceNumber}</p>
                </div>
                <div className="text-right">
                  <p>Generated for Eek Mechanical NZ Ltd</p>
                  <p className="text-xs mt-1">Buyer-created invoice</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="no-print max-w-3xl mx-auto mt-4 px-6">
          <Link 
            href={`/supplier/${code}`}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2"
          >
            ← Back to Job Portal
          </Link>
        </div>
      </main>
    </>
  )
}
