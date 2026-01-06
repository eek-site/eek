'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, Phone } from 'lucide-react'

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: '',
  })

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      setTimeout(() => {
        setIsSuccess(false)
        setFormData({ name: '', phone: '', location: '' })
      }, 300)
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, issue: 'towing' }),
      })
      setIsSuccess(true)
    } catch {
      setIsSuccess(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {!isSuccess ? (
              <>
                <h3 className="font-display text-2xl font-bold mb-6">Need a tow?</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Name"
                    required
                    value={formData.name}
                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  
                  <input
                    type="tel"
                    placeholder="Phone"
                    required
                    value={formData.phone}
                    onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                  
                  <input
                    type="text"
                    placeholder="Where are you?"
                    required
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-black border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                  />

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-red hover:bg-red-dark text-white font-semibold py-4 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Get help'}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                  <a 
                    href="tel:0800769000" 
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    0800 769 000
                  </a>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-2">Got it.</h3>
                <p className="text-zinc-400">Calling you now.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
