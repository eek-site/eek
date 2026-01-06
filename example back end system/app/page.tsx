'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import StoryCarousel from '@/components/StoryCarousel'
import { Phone } from 'lucide-react'

// VERSION FLAG - check console to confirm deployment
console.log('🔧 EEK MECHANICAL BUILD v2025.01.06 - Rebranded from Eek Mechanical')

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <Logo className="w-10 h-10" animated />
          <div className="flex items-center gap-6">
            <a 
              href="tel:0800769000" 
              className="text-zinc-500 hover:text-white transition-colors text-sm"
            >
              0800 769 000
            </a>
            <Link 
              href="/login"
              className="text-zinc-500 hover:text-white transition-colors text-sm"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero - call only */}
      <section className="pt-32 pb-16 flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-none">
            Eek Mechanical.
          </h1>
          <p className="text-red text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight mt-2">
            NZIFDA Certified.
          </p>
          
          <motion.a
            href="tel:0800769000"
            className="mt-16 inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-10 py-5 rounded-full transition-colors text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 2, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Phone className="w-6 h-6" />
            0800 769 000
          </motion.a>
          
          <motion.p
            className="text-zinc-600 mt-6 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 2.3 }}
          >
            24/7 mobile mechanics across New Zealand
          </motion.p>
        </motion.div>
      </section>

      {/* Services highlight */}
      <motion.section 
        className="py-12 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { emoji: '⛽', label: 'Wrong Fuel' },
              { emoji: '🔧', label: 'Repairs' },
              { emoji: '🔋', label: 'Flat Battery' },
              { emoji: '🚗', label: 'Breakdowns' },
            ].map((service, idx) => (
              <motion.div
                key={service.label}
                className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 2.4 + idx * 0.1 }}
              >
                <span className="text-3xl">{service.emoji}</span>
                <p className="text-zinc-400 text-sm mt-2">{service.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Story Carousel */}
      <motion.section 
        className="py-16 px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-zinc-500 text-sm uppercase tracking-wider mb-6">
            Real Kiwis we&apos;ve helped
          </h2>
          <StoryCarousel autoPlay interval={2500} />
        </div>
      </motion.section>

      <Footer />
    </main>
  )
}
