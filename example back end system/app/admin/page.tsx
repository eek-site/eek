'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Head from 'next/head'
import Logo from '@/components/Logo'
import AdminNotificationBell from '@/components/AdminNotificationBell'
import { 
  Phone, 
  ClipboardList, 
  DollarSign, 
  MessageSquare,
  LogOut,
  Menu,
  X,
  Clock,
  Truck,
  Send,
  Building2,
  FileText,
  Eye
} from 'lucide-react'

// Import form components
import BookingForm from './booking-form'
import BillingForm from './billing-form'
import CommsForm from './comms-form'
import SendBookingForm from './send-booking-form'
import SupplierBookingForm from './supplier-booking-form'
import JobsList from './jobs-list'
import VisitorsPanel from './visitors-panel'

interface User {
  email: string
  name: string
  role: string
}

type TabType = 'send' | 'jobs' | 'booking' | 'supplier' | 'comms' | 'billing' | 'visitors'

// Inner component that uses searchParams
function AdminContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('send')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [observeVisitorId, setObserveVisitorId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const session = sessionStorage.getItem('hookSession')
    
    // Build return URL with current params
    const returnUrl = typeof window !== 'undefined' 
      ? encodeURIComponent(window.location.pathname + window.location.search)
      : '/admin'
    
    if (!session) {
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }

    try {
      const data = JSON.parse(session)
      if (!data.token || data.expires < Date.now()) {
        sessionStorage.removeItem('hookSession')
        router.push(`/login?returnUrl=${returnUrl}`)
        return
      }
      setUser(data.user)
    } catch {
      sessionStorage.removeItem('hookSession')
      router.push(`/login?returnUrl=${returnUrl}`)
      return
    }
    
    setLoading(false)
    
    // Register admin service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/admin-sw.js').catch((err) => {
        console.log('Admin SW registration failed:', err)
      })
    }
  }, [router])
  
  // Handle URL params for tab and observe
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType | null
    const observe = searchParams.get('observe')
    
    // Handle all tab types from URL
    if (tab && ['send', 'jobs', 'booking', 'supplier', 'comms', 'billing', 'visitors'].includes(tab)) {
      setActiveTab(tab)
    }
    if (observe) {
      setObserveVisitorId(observe)
      setActiveTab('visitors')
    }
  }, [searchParams])

  const handleLogout = () => {
    sessionStorage.removeItem('hookSession')
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full" />
      </main>
    )
  }

  // Tabs in order: Send Link → Jobs → Book Job → Book Supplier → Comms → Billing
  const tabs = [
    { id: 'send' as TabType, label: 'Send Link', icon: Send, description: 'Send payment link to customer' },
    { id: 'jobs' as TabType, label: 'Jobs', icon: FileText, description: 'View all open jobs' },
    { id: 'booking' as TabType, label: 'Book Job', icon: ClipboardList, description: 'Create new towing job' },
    { id: 'supplier' as TabType, label: 'Book Supplier', icon: Building2, description: 'Assign job to tow company' },
    { id: 'comms' as TabType, label: 'Comms', icon: MessageSquare, description: 'Message customer or supplier' },
    { id: 'billing' as TabType, label: 'Billing', icon: DollarSign, description: 'Invoice and payments' },
    { id: 'visitors' as TabType, label: 'Visitors', icon: Eye, description: 'Track website visitors' },
  ]

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 
        transform transition-transform lg:translate-x-0 lg:static flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-3">
            <Logo className="w-8 h-8" />
            <div>
              <span className="font-display font-bold block">Eek Mechanical</span>
              <span className="text-xs text-zinc-500">Admin</span>
            </div>
          </Link>
        </div>
        
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4">
            <div className="text-xs text-zinc-600 uppercase tracking-wider mb-3 px-3">Actions</div>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors mb-1 ${
                  activeTab === tab.id 
                    ? 'bg-red text-white' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium text-sm">{tab.label}</div>
                  <div className={`text-xs ${activeTab === tab.id ? 'text-red-200' : 'text-zinc-600'}`}>
                    {tab.description}
                  </div>
                </div>
              </button>
            ))}
          </nav>

          {/* Targets */}
          <div className="p-4 border-t border-zinc-800">
            <div className="text-xs text-zinc-600 uppercase tracking-wider mb-3 px-3">Targets</div>
            <div className="space-y-2 px-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Phone className="w-3 h-3" /> Answer
                </span>
                <span className="text-green-500 font-medium">&lt;30s</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Book
                </span>
                <span className="text-green-500 font-medium">&lt;2m</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500 flex items-center gap-2">
                  <Truck className="w-3 h-3" /> Daily
                </span>
                <span className="text-red font-medium">20+</span>
              </div>
            </div>
            
            {/* Visitors Button */}
            <button
              onClick={() => {
                setActiveTab('visitors')
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                activeTab === 'visitors'
                  ? 'bg-purple-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Eye className="w-5 h-5" />
              <div>
                <div className="font-medium text-sm">Visitors</div>
                <div className={`text-xs ${activeTab === 'visitors' ? 'text-purple-200' : 'text-zinc-600'}`}>
                  Track website visitors
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* User - fixed at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{user?.name}</div>
              <div className="text-zinc-500 text-xs truncate">{user?.email}</div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-zinc-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="font-display font-bold text-lg">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && <AdminNotificationBell adminEmail={user.email} />}
            <a 
              href="tel:0800769000" 
              className="text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">0800 769 000</span>
            </a>
          </div>
        </header>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === 'send' && <SendBookingForm user={user} />}
          {activeTab === 'jobs' && <JobsList user={user} />}
          {activeTab === 'booking' && <BookingForm user={user} />}
          {activeTab === 'supplier' && <SupplierBookingForm user={user} />}
          {activeTab === 'comms' && <CommsForm user={user} initialRego={searchParams.get('rego') || undefined} />}
          {activeTab === 'billing' && <BillingForm user={user} initialRego={searchParams.get('rego') || undefined} />}
          {activeTab === 'visitors' && <VisitorsPanel user={user} observeId={observeVisitorId} />}
        </div>
      </main>
    </div>
  )
}

// Main page component wrapped in Suspense
export default function AdminPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full" />
      </main>
    }>
      <AdminContent />
    </Suspense>
  )
}
