import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MapPin, ArrowRight } from 'lucide-react'
import { allLocations } from '@/lib/locations'
import { services } from '@/lib/services'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  title: 'Towing Services New Zealand | 24/7 Nationwide | Eek Mechanical',
  description: '24/7 towing services across New Zealand. Auckland, Wellington, Christchurch, and all major cities. Car towing, truck towing, accident recovery. Call 0800 769 000.',
  keywords: 'towing New Zealand, NZ towing, nationwide towing, 24/7 towing, tow truck NZ, breakdown towing, accident towing',
  openGraph: {
    title: 'Towing Services New Zealand | Eek Mechanical',
    description: '24/7 towing services across New Zealand. All major cities covered. Call 0800 769 000.',
    type: 'website',
    locale: 'en_NZ',
    siteName: 'Eek Mechanical',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Towing Services NZ | Eek Mechanical',
    description: '24/7 towing services across New Zealand. Call 0800 769 000.',
  },
  alternates: {
    canonical: 'https://eek.co.nz/towing',
  },
}

export default function TowingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-black/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" />
            <span className="font-display font-bold">Eek Mechanical</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="tel:0800769000" className="text-zinc-500 hover:text-white transition-colors text-sm">
              0800 769 000
            </a>
            <Link href="/login" className="text-zinc-500 hover:text-white transition-colors text-sm">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            Towing Across New Zealand
          </h1>
          <p className="text-xl text-zinc-400 mb-8">
            24/7 towing services in every major city. One call, problem solved.
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

      {/* Locations Grid */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            Find Towing in Your City
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allLocations.slice(0, 12).map(location => (
              <Link 
                key={location.slug}
                href={`/${location.slug}`}
                className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red" />
                    <h3 className="font-display text-xl font-semibold">{location.name}</h3>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-zinc-500 text-sm mb-3">{location.region}</p>
                <p className="text-zinc-400 text-sm line-clamp-2">{location.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {location.nearby.slice(0, 3).map(area => (
                    <span key={area} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded">
                      {area}
                    </span>
                  ))}
                  {location.nearby.length > 3 && (
                    <span className="text-xs text-zinc-500">+{location.nearby.length - 3} more</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-8 text-center">
            What We Tow
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(service => (
              <Link 
                key={service.slug}
                href={`/towing/${service.slug}`}
                className="bg-black hover:bg-zinc-800 border border-zinc-800 rounded-xl p-6 transition-colors"
              >
                <h3 className="font-semibold mb-2">{service.title}</h3>
                <p className="text-zinc-500 text-sm">{service.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Need a tow?
          </h2>
          <p className="text-zinc-400 mb-8">
            Anywhere in New Zealand. Any time. Any vehicle.
          </p>
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
