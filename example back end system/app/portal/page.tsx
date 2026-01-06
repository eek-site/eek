'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PortalRedirectPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Try to get stored portal code
    const stored = localStorage.getItem('supplier-portal-code') 
      || sessionStorage.getItem('supplier-portal-code')
      || getCookie('supplier-portal-code')

    if (stored) {
      // Redirect to the supplier's portal
      router.replace(`/portal/${stored}`)
    } else {
      // No stored code - redirect to home
      setChecking(false)
      setTimeout(() => {
        router.replace('/')
      }, 2000)
    }
  }, [router])

  if (!checking) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">No portal code found</p>
          <p className="text-zinc-500 text-sm">Redirecting to home...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
        <p className="text-zinc-400">Loading your portal...</p>
      </div>
    </main>
  )
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}
