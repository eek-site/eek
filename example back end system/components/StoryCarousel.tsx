'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, MapPin, Quote, ChevronRight } from 'lucide-react'
import { Story, getAllStories } from '@/lib/stories'

interface StoryCarouselProps {
  autoPlay?: boolean
  interval?: number
}

// Get a random starting index
function getRandomIndex(max: number): number {
  return Math.floor(Math.random() * max)
}

export default function StoryCarousel({ autoPlay = true, interval = 2500 }: StoryCarouselProps) {
  const stories = getAllStories()
  
  // Start with null - don't render anything until mounted
  const [mounted, setMounted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  // Only run on client after mount
  useEffect(() => {
    setCurrentIndex(getRandomIndex(stories.length))
    setMounted(true)
  }, [stories.length])

  const nextSlide = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % stories.length)
  }, [stories.length])

  useEffect(() => {
    if (!autoPlay || isPaused || !mounted) return
    const timer = setInterval(nextSlide, interval)
    return () => clearInterval(timer)
  }, [autoPlay, interval, isPaused, nextSlide, mounted])

  // Show loading placeholder until mounted
  if (!mounted) {
    return (
      <div className="h-48 bg-zinc-900/50 rounded-2xl border border-zinc-800 animate-pulse" />
    )
  }

  const currentStory = stories[currentIndex]

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  return (
    <div 
      className="relative w-full"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Link 
        href={`/${currentStory.slug}`}
        className="block relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70 transition-all cursor-pointer"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 sm:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-6">
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-sm text-red mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{currentStory.location}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
                  {currentStory.vehicle}
                </h3>

                <p className="text-zinc-300 text-sm mb-4 leading-relaxed">
                  {currentStory.story || `${currentStory.customerName}'s ${currentStory.vehicle} broke down. We responded quickly and towed the vehicle to their preferred mechanic.`}
                </p>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{currentStory.responseTime}</span>
                  <span className="text-zinc-600">response</span>
                </div>
              </div>

              {currentStory.quote && (
                <div className="sm:w-64 flex-shrink-0 bg-zinc-800/50 rounded-xl p-4 border-l-2 border-red">
                  <Quote className="w-5 h-5 text-zinc-600 mb-2" />
                  <p className="text-zinc-300 text-sm italic mb-2">
                    &ldquo;{currentStory.quote}&rdquo;
                  </p>
                  <p className="text-zinc-600 text-xs">
                    — {currentStory.customerName}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-zinc-800">
              <span className="text-sm text-zinc-500 inline-flex items-center gap-1">
                View more stories in {currentStory.location}
                <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </Link>
    </div>
  )
}
