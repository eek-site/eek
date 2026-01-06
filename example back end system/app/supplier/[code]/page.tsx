'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { 
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react'

export default function SupplierJobRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const code = params.code as string
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const lookupAndRedirect = async () => {
      try {
        // Fetch the supplier job data
        const response = await fetch(`/api/supplier-job/${code}`)
        const result = await response.json()
        
        if (!result.success || !result.supplierJob) {
          setError('Invalid or expired link. Please contact Eek Mechanical.')
          setLoading(false)
          return
        }
        
        const supplierName = result.supplierJob.supplierName
        const bookingId = result.supplierJob.bookingId
        
        if (!supplierName) {
          setError('Could not identify supplier. Please contact Eek Mechanical.')
          setLoading(false)
          return
        }
        
        // Look up the supplier's portal code
        const supplierResponse = await fetch(`/api/suppliers/${encodeURIComponent(supplierName)}`)
        const supplierResult = await supplierResponse.json()
        
        if (supplierResult.success && supplierResult.supplier?.portalCode) {
          // Redirect to their portal with the job highlighted and ready to accept
          const portalUrl = `/portal/${supplierResult.supplier.portalCode}?job=${bookingId || code}&accept=${code}`
          router.replace(portalUrl)
        } else {
          // Supplier doesn't have a portal code yet - show error with contact info
          setError('Your supplier portal is being set up. Please contact Eek Mechanical.')
          setLoading(false)
        }
      } catch (e) {
        console.error('Redirect error:', e)
        setError('Something went wrong. Please contact Eek Mechanical.')
        setLoading(false)
      }
    }
    
    lookupAndRedirect()
  }, [code, router])

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <Logo className="w-12 h-12 mb-6" />
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
        <p className="text-zinc-400">Loading your portal...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center p-6">
        <Link href="/" className="mb-8">
          <Logo className="w-12 h-12" />
        </Link>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Link Error</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <a 
            href="tel:0800769000" 
            className="inline-flex items-center gap-2 bg-red hover:bg-red/80 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Phone className="w-5 h-5" />
            Call 0800 769 000
          </a>
        </div>
      </main>
    )
  }

  return null
}
