'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, CheckCircle } from 'lucide-react'
import { getStoriesFromOtherLocations } from '@/lib/stories'

interface OtherLocationsCarouselProps {
  currentLocationSlug: string
  showHeader?: boolean
}

export default function OtherLocationsCarousel({ currentLocationSlug, showHeader = true }: OtherLocationsCarouselProps) {
  const stories = getStoriesFromOtherLocations(currentLocationSlug, 100)
  
  // Start unmounted - render nothing on server
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Only run on client after mount
  useEffect(() => {
    if (stories.length > 0) {
      setCurrentIndex(Math.floor(Math.random() * stories.length))
    }
    setMounted(true)
  }, [stories.length])

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % stories.length)
  }, [stories.length])

  useEffect(() => {
    if (isPaused || stories.length === 0 || !mounted) return
    const timer = setInterval(nextSlide, 2500)
    return () => clearInterval(timer)
  }, [isPaused, nextSlide, stories.length, mounted])

  // Show placeholder until mounted
  if (!mounted) {
    return (
      <div className="h-48 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
    )
  }

  if (stories.length === 0) return null

  const currentStory = stories[currentIndex]

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {showHeader && (
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold">
            We also cover these areas
          </h2>
          <p className="text-zinc-500 text-sm mt-1">Click to see stories from other locations</p>
        </div>
      )}

      <Link href={`/${currentStory.slug}`} className="block">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-2xl p-6 md:p-8 cursor-pointer transition-all"
          >
            <div className="inline-flex items-center gap-2 bg-red/10 border border-red/20 text-red px-3 py-1.5 rounded-full text-sm mb-4">
              <MapPin className="w-4 h-4" />
              <span>{currentStory.location}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-white font-semibold">{currentStory.vehicle}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-zinc-400">{currentStory.issue}</span>
              </div>
              <div className="flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Sorted
              </div>
            </div>

            <p className="text-zinc-300 text-base mb-6 leading-relaxed line-clamp-2">
              {currentStory.story}
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
      </Link>
    </div>
  )
}
