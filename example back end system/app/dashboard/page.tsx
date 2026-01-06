'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { 
  Phone, 
  MapPin, 
  Clock, 
  Truck, 
  Users, 
  BarChart3,
  LogOut,
  Menu,
  X,
  RefreshCw,
  Target
} from 'lucide-react'

interface User {
  email: string
  name: string
  role: string
}

const mockJobs = [
  { id: 1, customer: 'Sarah M.', location: 'Queen St, Auckland', issue: 'Breakdown', status: 'active', eta: '8 min' },
  { id: 2, customer: 'James W.', location: 'Lambton Quay, Wellington', issue: 'Accident', status: 'dispatched', eta: '15 min' },
  { id: 3, customer: 'Emma C.', location: 'Riccarton Rd, Christchurch', issue: 'Towing', status: 'pending', eta: null },
  { id: 4, customer: 'Mike T.', location: 'Victoria St, Hamilton', issue: 'Won\'t start', status: 'active', eta: '12 min' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const session = sessionStorage.getItem('hookSession')
    if (!session) {
      router.push('/login')
      return
    }

    try {
      const data = JSON.parse(session)
      if (!data.token || data.expires < Date.now()) {
        sessionStorage.removeItem('hookSession')
        router.push('/login')
        return
      }
      setUser(data.user)
    } catch {
      sessionStorage.removeItem('hookSession')
      router.push('/login')
      return
    }
    
    setLoading(false)
  }, [router])

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

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-56 bg-zinc-900 border-r border-zinc-800 
        transform transition-transform lg:translate-x-0 lg:static
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="font-display font-bold">Hook</span>
          </Link>
        </div>
        
        <nav className="p-3">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/dashboard/jobs" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 text-sm mt-1">
            <Truck className="w-4 h-4" /> Active Jobs
          </Link>
          <Link href="/dashboard/operators" className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-800 text-sm mt-1">
            <Users className="w-4 h-4" /> Operators
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          <div className="text-sm mb-3">
            <div className="font-medium">{user?.name}</div>
            <div className="text-zinc-500 text-xs">{user?.role}</div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-zinc-400 hover:bg-zinc-800 text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* Main */}
      <main className="flex-1">
        <header className="sticky top-0 z-30 bg-black/90 backdrop-blur border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-zinc-400"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="font-display font-bold">Dashboard</h1>
          </div>
          <a href="tel:0800769000" className="text-zinc-500 hover:text-white text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">0800 769 000</span>
          </a>
        </header>

        <div className="p-6">
          {/* Targets */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                Call Answer
              </div>
              <div className="text-2xl font-bold">&lt;30s</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                Job Booked
              </div>
              <div className="text-2xl font-bold">&lt;2m</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                Coverage
              </div>
              <div className="text-2xl font-bold">24/7</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
                <Target className="w-3 h-3" />
                Daily Target
              </div>
              <div className="text-2xl font-bold text-red">20+</div>
            </div>
          </div>

          {/* Jobs */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold">Active Jobs</h2>
            <button className="text-zinc-500 hover:text-white text-sm flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-left">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Issue</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {mockJobs.map(job => (
                  <tr key={job.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium">{job.customer}</td>
                    <td className="px-4 py-3 text-zinc-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                    </td>
                    <td className="px-4 py-3">{job.issue}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        job.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 
                        job.status === 'dispatched' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {job.eta ? (
                        <span className="flex items-center gap-1 text-green-400">
                          <Clock className="w-3 h-3" />
                          {job.eta}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
