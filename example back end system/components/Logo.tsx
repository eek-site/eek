'use client'

import { motion } from 'framer-motion'

interface LogoProps {
  className?: string
  animated?: boolean
}

export default function Logo({ className = 'w-10 h-10', animated = true }: LogoProps) {
  // Eek Mechanical Logo - A stylized wrench forming an "E" shape
  // The logo animates: wrench rotates into position, then the E shapes draw in
  
  if (!animated) {
    // Static version - the final wrench-E form
    return (
      <svg viewBox="0 0 100 100" fill="none" className={className}>
        {/* Wrench head (top) */}
        <path
          d="M25 15 L45 15 L45 25 L35 35 L25 25 Z"
          fill="currentColor"
        />
        {/* Wrench shaft */}
        <rect
          x="32"
          y="35"
          width="10"
          height="50"
          rx="2"
          fill="currentColor"
        />
        {/* E horizontal bars */}
        <rect x="42" y="35" width="35" height="8" rx="2" fill="currentColor" />
        <rect x="42" y="55" width="28" height="8" rx="2" fill="currentColor" />
        <rect x="42" y="77" width="35" height="8" rx="2" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      {/* Wrench head - draws first */}
      <motion.path
        d="M25 15 L45 15 L45 25 L35 35 L25 25 Z"
        fill="currentColor"
        initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transformOrigin: '35px 25px' }}
      />
      
      {/* Wrench shaft - drops down */}
      <motion.rect
        x="32"
        y="35"
        width="10"
        height="50"
        rx="2"
        fill="currentColor"
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ 
          duration: 0.4, 
          delay: 0.3,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transformOrigin: '37px 35px' }}
      />
      
      {/* Top E bar */}
      <motion.rect 
        x="42" 
        y="35" 
        width="35" 
        height="8" 
        rx="2" 
        fill="currentColor"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: 0.6,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transformOrigin: '42px 39px' }}
      />
      
      {/* Middle E bar */}
      <motion.rect 
        x="42" 
        y="55" 
        width="28" 
        height="8" 
        rx="2" 
        fill="currentColor"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: 0.75,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transformOrigin: '42px 59px' }}
      />
      
      {/* Bottom E bar */}
      <motion.rect 
        x="42" 
        y="77" 
        width="35" 
        height="8" 
        rx="2" 
        fill="currentColor"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ 
          duration: 0.3, 
          delay: 0.9,
          ease: [0.16, 1, 0.3, 1]
        }}
        style={{ transformOrigin: '42px 81px' }}
      />
      
      {/* Accent spark - appears at the end */}
      <motion.circle
        cx="80"
        cy="20"
        r="0"
        fill="#ff5500"
        initial={{ r: 0, opacity: 0 }}
        animate={{ r: 4, opacity: [0, 1, 0] }}
        transition={{ 
          duration: 0.6,
          delay: 1.1,
          ease: "easeOut"
        }}
      />
    </svg>
  )
}
