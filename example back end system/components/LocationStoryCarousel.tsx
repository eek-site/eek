'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle } from 'lucide-react'
import { getStoriesByLocation, Story } from '@/lib/stories'

interface LocationStoryCarouselProps {
  locationSlug: string
  locationName: string
}

export default function LocationStoryCarousel({ locationSlug, locationName }: LocationStoryCarouselProps) {
  const stories = getStoriesByLocation(locationSlug)
  
  // Start unmounted - render nothing on server
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Only run on client after mount
  useEffect(() => {
    if (stories.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * stories.length))
    }
    setMounted(true)
  }, [stories.length])

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  useEffect(() => {
    if (stories.length === 0 || !mounted) return
    
    resetTimeout()
    if (!isPaused) {
      timeoutRef.current = setTimeout(
        () =>
          setCurrentIndex((prevIndex) =>
            prevIndex === stories.length - 1 ? 0 : prevIndex + 1
          ),
        2500
      )
    }
    return () => resetTimeout()
  }, [currentIndex, isPaused, stories.length, mounted])

  // Show placeholder until mounted
  if (!mounted) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold">
            Kiwis we helped in {locationName}
          </h2>
        </div>
        <div className="h-48 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
      </div>
    )
  }

  if (stories.length === 0) {
    return null
  }

  const currentStory = stories[currentIndex]

  const generateStoryText = (story: Story): string => {
    switch (story.issue) {
      case 'Flat Battery':
        return `${story.customerName} was stranded in ${story.location} when their ${story.vehicle} wouldn't start. Our team arrived within ${story.responseTime} and had them back on the road with a successful jump start.`
      case 'Flat Tyre':
        return `A ${story.vehicle} needed roadside assistance in ${story.location} after a tyre blowout. We were on scene in ${story.responseTime} and changed the tyre so ${story.customerName} could continue their journey.`
      case 'Lockout':
        return `${story.customerName} locked their keys in their ${story.vehicle} in ${story.location}. We coordinated a locksmith who had them back in their car within ${story.responseTime}.`
      case 'Accident':
        return `After an incident in ${story.location}, ${story.customerName}'s ${story.vehicle} needed recovery. Our team handled the situation professionally, arriving in ${story.responseTime}.`
      default:
        return `${story.customerName}'s ${story.vehicle} broke down in ${story.location}. We responded in ${story.responseTime} and towed the vehicle to their preferred mechanic.`
    }
  }

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">
          Kiwis we helped in {locationName}
        </h2>
      </div>

      <div className="block">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-red font-semibold">{currentStory.vehicle}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{currentStory.issue}</span>
              </div>
              <div className="flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Sorted
              </div>
            </div>

            <p className="text-zinc-300 text-base mb-6 leading-relaxed">
              {currentStory.story || generateStoryText(currentStory)}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-red" />
                  {currentStory.responseTime} response
                </span>
              </div>
              <div className="text-zinc-600 text-sm">
                — {currentStory.customerName}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
