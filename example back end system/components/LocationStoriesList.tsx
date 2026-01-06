'use client'

import { useState, useMemo } from 'react'
import { Clock, CheckCircle, Filter } from 'lucide-react'
import { getStoriesByLocation, getAllIssueTypes, Story } from '@/lib/stories'

interface LocationStoriesListProps {
  locationSlug: string
  locationName: string
}

export default function LocationStoriesList({ locationSlug, locationName }: LocationStoriesListProps) {
  const allStories = useMemo(() => getStoriesByLocation(locationSlug), [locationSlug])
  const [selectedIssue, setSelectedIssue] = useState<string>('all')
  
  // Get issue types that exist for this location
  const issueTypes = useMemo(() => {
    const types = new Set(allStories.map(s => s.issue))
    return Array.from(types).sort()
  }, [allStories])

  // Filter stories
  const filteredStories = useMemo(() => {
    if (selectedIssue === 'all') return allStories
    return allStories.filter(s => s.issue === selectedIssue)
  }, [allStories, selectedIssue])

  if (allStories.length === 0) return null

  return (
    <div className="w-full">
      {/* Filter - aligned right */}
      <div className="flex justify-end mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            value={selectedIssue}
            onChange={(e) => setSelectedIssue(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
          >
            <option value="all">All issues</option>
            {issueTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}
      </div>

      {filteredStories.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          No stories found for this filter.
        </div>
      )}
    </div>
  )
}

function StoryCard({ story }: { story: Story }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
      {/* Vehicle & Issue */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-semibold text-white">{story.vehicle}</div>
          <div className="text-sm text-zinc-500 mt-1">{story.issue}</div>
        </div>
        <div className="flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
          <CheckCircle className="w-3 h-3" />
          Sorted
        </div>
      </div>

      {/* Story */}
      <p className="text-zinc-300 text-sm leading-relaxed mb-4">
        {story.story}
      </p>

      {/* Solution */}
      <div className="mb-4">
        <div className="text-zinc-600 text-xs uppercase tracking-wide mb-1">What we did</div>
        <p className="text-zinc-400 text-sm">{story.solution}</p>
      </div>

      {/* Response Time & Customer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="w-4 h-4 text-green-500" />
          {story.responseTime}
        </div>
        <div className="text-zinc-600 text-sm">
          — {story.customerName}
        </div>
      </div>
    </div>
  )
}
