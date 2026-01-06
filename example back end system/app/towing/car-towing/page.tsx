import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, CheckCircle } from 'lucide-react'
import { allLocations } from '@/lib/locations'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Car Towing NZ | 24/7 Car Tow Truck Service | Eek Mechanical',
  description: 'Professional car towing across New Zealand. Sedans, SUVs, hatchbacks, wagons. Flatbed towing for all makes and models. Call 0800 769 000.',
  keywords: 'car towing, car tow truck, sedan towing, SUV towing, hatchback towing, NZ car towing',
}

export default function CarTowingPage() {
  const features = [
    'All makes and models',
    'Flatbed towing available',
    'Luxury car specialists',
    'Low clearance vehicles',
    'AWD and 4WD vehicles',
    'Electric vehicles',
  ]

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 inset-x-0 z-40 bg-black/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-display font-bold">Eek Mechanical</span>
          </Link>
          <a href="tel:0800769000" className="text-zinc-500 hover:text-white transition-colors text-sm">
            0800 769 000
          </a>
        </div>
      </nav>

      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <Link href="/towing" className="hover:text-white">Towing</Link>
            <span>/</span>
            <span className="text-white">Car Towing</span>
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Car Towing
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            Professional car towing for all makes and models. Whether your car won't start, has been in an accident, or just needs to get somewhere—we'll get it there safely.
          </p>
          
          <a
            href="tel:0800769000"
            className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg"
          >
            <Phone className="w-5 h-5" />
            0800 769 000
          </a>
        </div>
      </section>

      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">What We Handle</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {features.map(feature => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-red" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-zinc-900/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8">Car Towing by City</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {allLocations.slice(0, 8).map(loc => (
              <Link 
                key={loc.slug}
                href={`/towing/${loc.slug}`}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                Car Towing {loc.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Need your car towed?</h2>
          <a
            href="tel:0800769000"
            className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-10 py-5 rounded-full transition-colors text-xl"
          >
            <Phone className="w-6 h-6" />
            0800 769 000
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
