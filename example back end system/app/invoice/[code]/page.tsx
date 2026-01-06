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
  Calendar,
  FileText,
  Printer,
  Download
} from 'lucide-react'

interface AdditionalCharge {
  amount: number
  reason: string
  addedAt: string
  addedBy: string
  transactionId?: string
  status: 'pending' | 'paid' | 'cancelled'
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
  status?: string
  createdAt: string
  completedAt?: string
  supplierName?: string
  supplierPhone?: string
  vehicleMake?: string
  vehicleModel?: string
  vehicleColor?: string
  vehicleYear?: string
  distanceKm?: number
  transactionId?: string
  additionalCharges?: AdditionalCharge[]
  totalPaid?: number
}

export default function InvoicePage() {
  const params = useParams()
  const code = params.code as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobData, setJobData] = useState<JobData | null>(null)

  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        const response = await fetch(`/api/booking/${code}`)
        const result = await response.json()
        
        if (result.success && result.job) {
          // Parse additional charges if present
          const job = result.job
          if (job.additionalCharges) {
            try {
              job.additionalCharges = typeof job.additionalCharges === 'string'
                ? JSON.parse(job.additionalCharges)
                : job.additionalCharges
            } catch {
              job.additionalCharges = []
            }
          }
          setJobData(job)
        } else {
          setError('Invoice not found')
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

  const invoiceDate = jobData.completedAt 
    ? new Date(jobData.completedAt) 
    : new Date(jobData.createdAt)
  
  const vehicleDisplay = [
    jobData.vehicleColor,
    jobData.vehicleYear,
    jobData.vehicleMake,
    jobData.vehicleModel
  ].filter(Boolean).join(' ') || jobData.rego

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
        {/* Print/Download Buttons */}
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
          {/* Header */}
          <div className="bg-zinc-900 text-white px-8 py-6 print:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Logo className="w-12 h-12" />
                <div>
                  <h1 className="text-2xl font-bold font-display">Eek Mechanical</h1>
                  <p className="text-zinc-400 text-sm">Get Going</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-red-500">INVOICE</div>
                <div className="text-zinc-400 text-sm mt-1">#{jobData.bookingId}</div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="p-8">
            {/* Meta Info */}
            <div className="flex justify-between mb-8">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">BILLED TO</h3>
                <p className="font-bold text-gray-900">{jobData.customerName || 'Customer'}</p>
                {jobData.customerEmail && (
                  <p className="text-gray-600 text-sm">{jobData.customerEmail}</p>
                )}
                {jobData.customerPhone && (
                  <p className="text-gray-600 text-sm">{jobData.customerPhone}</p>
                )}
              </div>
              <div className="text-right">
                <h3 className="text-gray-500 text-sm font-medium mb-1">INVOICE DATE</h3>
                <p className="font-bold text-gray-900">
                  {invoiceDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center justify-end gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-600 font-medium text-sm">PAID</span>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8 print:bg-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-red-600" />
                Service Details
              </h3>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-sm">Vehicle</p>
                  <p className="font-medium text-gray-900">{vehicleDisplay}</p>
                  <p className="font-mono text-red-600 text-sm">{jobData.rego}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Service Type</p>
                  <p className="font-medium text-gray-900">Vehicle Towing</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3 mb-3">
                  <MapPin className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">PICKUP</p>
                    <p className="text-gray-900 text-sm">{jobData.pickupLocation}</p>
                  </div>
                </div>
                {jobData.dropoffLocation && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-red-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">DROP-OFF</p>
                      <p className="text-gray-900 text-sm">{jobData.dropoffLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier */}
              {jobData.supplierName && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-gray-500 text-xs">TOWING COMPANY</p>
                      <p className="font-medium text-gray-900">{jobData.supplierName}</p>
                    </div>
                  </div>
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
                {/* Original towing service */}
                <tr className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium text-gray-900">Vehicle Towing Service</p>
                    <p className="text-gray-500 text-sm">
                      {jobData.rego} - {jobData.pickupLocation?.split(',')[0]} to {jobData.dropoffLocation?.split(',')[0] || 'destination'}
                    </p>
                    {jobData.distanceKm && (
                      <p className="text-gray-400 text-sm">Distance: {jobData.distanceKm}km</p>
                    )}
                  </td>
                  <td className="py-4 text-right font-medium text-gray-900">
                    ${(jobData.price / 100).toFixed(2)}
                  </td>
                </tr>
                
                {/* Additional charges */}
                {jobData.additionalCharges && jobData.additionalCharges
                  .filter(charge => charge.status === 'paid')
                  .map((charge, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{charge.reason}</p>
                        <p className="text-gray-400 text-xs">
                          Added: {new Date(charge.addedAt).toLocaleDateString('en-NZ')}
                        </p>
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        ${(charge.amount / 100).toFixed(2)}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="py-4 text-right font-bold text-gray-900">TOTAL PAID (NZD)</td>
                  <td className="py-4 text-right text-2xl font-bold text-green-600">
                    ${(
                      (jobData.price / 100) + 
                      (jobData.additionalCharges?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount / 100, 0) || 0)
                    ).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Payment Info */}
            <div className="bg-green-50 rounded-xl p-4 flex items-center justify-between print:bg-green-100">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <div>
                  <p className="font-bold text-green-700">Payment Received</p>
                  <p className="text-green-600 text-sm">
                    {invoiceDate.toLocaleDateString('en-NZ')} via Card
                  </p>
                </div>
              </div>
              {jobData.transactionId && (
                <p className="text-green-600 text-xs font-mono">
                  Ref: {jobData.transactionId}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
              <p className="font-bold text-gray-900 mb-1">Eek Mechanical | Get Going</p>
              <p>0800 769 000 • www.eek.co.nz</p>
              <p className="mt-2 text-xs">
                Thank you for choosing Eek Mechanical. For any queries, please call us or message through your portal.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="no-print max-w-3xl mx-auto mt-4 px-6">
          <Link 
            href={`/customer/${code}`}
            className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2"
          >
            ← Back to Job Details
          </Link>
        </div>
      </main>
    </>
  )
}
