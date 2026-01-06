'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Eye, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  MousePointerClick,
  Smartphone,
  Monitor,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  TrendingUp,
  Search,
  X,
  CheckCircle2
} from 'lucide-react'
import { VisitorSession, getSourceLabel, getSourceEmoji } from '@/lib/visitor-tracking'

interface User {
  email: string
  name: string
  role: string
}

interface VisitorsPanelProps {
  user: User | null
  observeId?: string | null
}

export default function VisitorsPanel({ user, observeId }: VisitorsPanelProps) {
  const [visitors, setVisitors] = useState<VisitorSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  
  const loadVisitors = useCallback(async () => {
    try {
      const response = await fetch('/api/visitors?limit=100')
      const data = await response.json()
      if (data.success) {
        setVisitors(data.visitors)
        
        // Auto-select if observeId provided
        if (observeId) {
          const target = data.visitors.find((v: VisitorSession) => v.id === observeId)
          if (target) {
            setSelectedVisitor(target)
            setExpandedId(target.id)
            // Mark as observed
            markAsObserved(target.id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to load visitors:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [observeId])
  
  useEffect(() => {
    loadVisitors()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadVisitors, 30000)
    return () => clearInterval(interval)
  }, [loadVisitors])
  
  const handleRefresh = () => {
    setRefreshing(true)
    loadVisitors()
  }
  
  const markAsObserved = async (visitorId: string) => {
    try {
      await fetch(`/api/visitors/${visitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observed: { by: user?.name || user?.email || 'Admin' }
        })
      })
    } catch (error) {
      console.error('Failed to mark as observed:', error)
    }
  }
  
  const handleSelectVisitor = (visitor: VisitorSession) => {
    setSelectedVisitor(visitor)
    setExpandedId(expandedId === visitor.id ? null : visitor.id)
    if (!visitor.observed) {
      markAsObserved(visitor.id)
    }
  }
  
  const formatTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }
  
  // Filter visitors
  const filteredVisitors = visitors.filter(v => {
    if (!filter) return true
    const search = filter.toLowerCase()
    const source = getSourceLabel(v.source).toLowerCase()
    const landing = v.source.landingPage.toLowerCase()
    return source.includes(search) || landing.includes(search) || v.id.includes(search)
  })
  
  // Stats
  const todayVisitors = visitors.filter(v => {
    const today = new Date()
    const visitDate = new Date(v.createdAt)
    return visitDate.toDateString() === today.toDateString()
  }).length
  
  const googleAdsVisitors = visitors.filter(v => v.source.gclid).length
  const convertedVisitors = visitors.filter(v => v.converted).length
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Today</div>
          <div className="text-2xl font-bold text-white">{todayVisitors}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Total (30d)</div>
          <div className="text-2xl font-bold text-white">{visitors.length}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Google Ads</div>
          <div className="text-2xl font-bold text-blue-500">{googleAdsVisitors}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Converted</div>
          <div className="text-2xl font-bold text-green-500">{convertedVisitors}</div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by source, page, or ID..."
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 text-sm focus:outline-none focus:border-red"
          />
          {filter && (
            <button 
              onClick={() => setFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      
      {/* Visitor List */}
      <div className="space-y-2">
        {filteredVisitors.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            {filter ? 'No visitors match your filter' : 'No visitors tracked yet'}
          </div>
        ) : (
          filteredVisitors.map((visitor) => {
            const sourceLabel = getSourceLabel(visitor.source)
            const sourceEmoji = getSourceEmoji(visitor.source)
            const isExpanded = expandedId === visitor.id
            const isActive = Date.now() - new Date(visitor.metrics.lastActiveAt).getTime() < 5 * 60 * 1000
            
            return (
              <div 
                key={visitor.id}
                className={`bg-zinc-900 border rounded-xl overflow-hidden transition-all ${
                  isExpanded ? 'border-red' : 'border-zinc-800 hover:border-zinc-700'
                } ${visitor.observed ? '' : 'ring-2 ring-red/30'}`}
              >
                {/* Visitor Row */}
                <button
                  onClick={() => handleSelectVisitor(visitor)}
                  className="w-full p-4 text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      isActive ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'
                    }`} />
                    
                    {/* Source & Device */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{sourceEmoji}</span>
                        <span className="font-medium text-white">{sourceLabel}</span>
                        {visitor.source.gclid && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            Paid
                          </span>
                        )}
                        {visitor.converted && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Converted
                          </span>
                        )}
                        {!visitor.observed && (
                          <span className="px-2 py-0.5 bg-red/20 text-red text-xs rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          {visitor.device.isMobile ? (
                            <Smartphone className="w-3 h-3" />
                          ) : (
                            <Monitor className="w-3 h-3" />
                          )}
                          {visitor.device.platform}
                        </span>
                        {visitor.location?.city && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <MapPin className="w-3 h-3" />
                            {visitor.location.city}{visitor.location.region ? `, ${visitor.location.region}` : ''}
                          </span>
                        )}
                        <span className="text-zinc-600">
                          {visitor.source.landingPage}
                        </span>
                      </div>
                    </div>
                    
                    {/* Metrics */}
                    <div className="hidden sm:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-white font-medium">{visitor.metrics.totalPageViews}</div>
                        <div className="text-zinc-600 text-xs">pages</div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-medium">{formatDuration(visitor.metrics.totalTimeOnSite)}</div>
                        <div className="text-zinc-600 text-xs">on site</div>
                      </div>
                    </div>
                    
                    {/* Time & Expand */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-zinc-400 text-sm">{formatTimeAgo(visitor.createdAt)}</div>
                        {visitor.metrics.sessionCount > 1 && (
                          <div className="text-xs text-zinc-600">{visitor.metrics.sessionCount} visits</div>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                      )}
                    </div>
                  </div>
                </button>
                
                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-zinc-800 p-4 bg-zinc-950">
                    {/* Journey Timeline */}
                    <div className="mb-4">
                      <div className="text-xs text-zinc-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" /> Journey
                      </div>
                      <div className="space-y-2">
                        {visitor.pageViews.map((pv, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-sm">
                            <div className="w-16 text-zinc-600 text-xs">
                              {new Date(pv.timestamp).toLocaleTimeString('en-NZ', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                            <ArrowRight className="w-3 h-3 text-zinc-700" />
                            <div className="flex-1 text-zinc-300 font-mono text-xs">{pv.path}</div>
                            {pv.timeOnPage && (
                              <div className="text-zinc-600 text-xs flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {pv.timeOnPage}s
                              </div>
                            )}
                            {pv.scrollDepth && (
                              <div className="text-zinc-600 text-xs">
                                {pv.scrollDepth}% scroll
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Source Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Source Details</div>
                        <div className="space-y-1">
                          {visitor.source.referrer && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">Referrer:</span>
                              <span className="text-zinc-300 truncate">{visitor.source.referrer}</span>
                            </div>
                          )}
                          {visitor.source.utmCampaign && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">Campaign:</span>
                              <span className="text-orange-400">{visitor.source.utmCampaign}</span>
                            </div>
                          )}
                          {visitor.source.gclid && (
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-500">GCLID:</span>
                              <span className="text-blue-400 font-mono text-xs truncate">{visitor.source.gclid}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2">Device Info</div>
                        <div className="space-y-1 text-zinc-400 text-xs">
                          <div>{visitor.device.userAgent.substring(0, 50)}...</div>
                          <div>Screen: {visitor.device.screenWidth}x{visitor.device.screenHeight}</div>
                          <div>Language: {visitor.device.language}</div>
                          <div>Timezone: {visitor.device.timezone}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Visitor ID */}
                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                      <div className="text-xs text-zinc-600 font-mono">{visitor.id}</div>
                      <div className="flex items-center gap-2">
                        {visitor.observed && (
                          <span className="text-xs text-zinc-600">
                            Observed by {visitor.observed.by} at {new Date(visitor.observed.at).toLocaleString('en-NZ')}
                          </span>
                        )}
                        <Eye className="w-4 h-4 text-zinc-600" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
