'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, CheckCircle } from 'lucide-react'
import { getAllStories } from '@/lib/stories'

export default function StoriesPageCarousel() {
  const stories = getAllStories()
  
  // Start unmounted - render nothing on server
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Only run on client after mount
  useEffect(() => {
    setCurrentIndex(Math.floor(Math.random() * stories.length))
    setMounted(true)
  }, [stories.length])

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % stories.length)
  }, [stories.length])

  useEffect(() => {
    if (isPaused || !mounted) return
    const timer = setInterval(nextSlide, 2500)
    return () => clearInterval(timer)
  }, [isPaused, nextSlide, mounted])

  // Show placeholder until mounted
  if (!mounted) {
    return (
      <div className="h-32 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
    )
  }

  const currentStory = stories[currentIndex]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 80 : -80,
      opacity: 0,
    }),
  }

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Link href={`/${currentStory.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-red" />
                  <span className="text-red font-medium">{currentStory.location}</span>
                </div>

                <div className="flex-1">
                  <span className="font-semibold text-white">{currentStory.vehicle}</span>
                  <span className="text-zinc-600 mx-2">•</span>
                  <span className="text-zinc-400">{currentStory.issue}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{currentStory.responseTime}</span>
                </div>

                <div className="flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  Sorted
                </div>
              </div>

              <p className="text-zinc-400 text-sm mt-3 line-clamp-2">
                {currentStory.story}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </Link>
    </div>
  )
}
