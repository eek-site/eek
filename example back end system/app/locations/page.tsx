import { Metadata } from 'next'
import Link from 'next/link'
import { allLocations } from '@/lib/locations'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { Phone, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: 'All Locations | Eek Mechanical | 24/7 Towing Across New Zealand',
  description: 'Eek Mechanical provides 24/7 tow truck service across all of New Zealand. Find towing services in Auckland, Wellington, Christchurch, and every major town.',
  keywords: 'towing New Zealand, tow truck NZ, towing locations, New Zealand towing service',
}

// Group locations by region
const locationsByRegion = allLocations.reduce((acc, location) => {
  if (!acc[location.region]) {
    acc[location.region] = []
  }
  acc[location.region].push(location)
  return acc
}, {} as Record<string, typeof allLocations>)

export default function LocationsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-black/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" animated={false} />
            <span className="font-display font-bold">Hook</span>
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
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Towing across New Zealand
          </h1>
          <p className="text-zinc-400 text-lg mt-6 max-w-2xl">
            350+ operators covering every corner of the country. From Cape Reinga to Bluff, we&apos;ve got you covered.
          </p>
          
          <div className="mt-8">
            <a
              href="tel:0800769000"
              className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
              0800 769 000
            </a>
          </div>
        </div>
      </section>

      {/* Locations by Region */}
      <section className="py-16 px-6 border-t border-zinc-900 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-12">
            {Object.entries(locationsByRegion).map(([region, locs]) => (
              <div key={region}>
                <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-red" />
                  {region}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {locs.map(location => (
                    <Link
                      key={location.slug}
                      href={`/${location.slug}`}
                      className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-sm transition-colors group"
                    >
                      <span className="text-white group-hover:text-red transition-colors">{location.name}</span>
                      <span className="text-zinc-600 text-xs block mt-1">{location.region}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Don&apos;t see your area?</h2>
          <p className="text-zinc-400 mb-6">We cover more than what&apos;s listed. Call us and we&apos;ll sort it.</p>
          <a
            href="tel:0800769000"
            className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors"
          >
            <Phone className="w-5 h-5" />
            0800 769 000
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
