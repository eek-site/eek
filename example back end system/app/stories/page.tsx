import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, MapPin, Clock, Quote, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import StoriesPageCarousel from '@/components/StoriesPageCarousel'
import { stories, getAllRegions } from '@/lib/stories'

export const metadata: Metadata = {
  title: 'Real Towing Stories | Jobs We\'ve Done | Eek Mechanical NZ',
  description: 'Real towing jobs across New Zealand. See how we\'ve helped Kiwis get back on the road - breakdowns, flat tyres, lockouts, accidents. 24/7 service.',
  keywords: 'towing stories, towing testimonials, NZ towing, roadside assistance stories, breakdown recovery',
}

// Group stories by region
const storiesByRegion = stories.reduce((acc, story) => {
  if (!acc[story.region]) {
    acc[story.region] = []
  }
  acc[story.region].push(story)
  return acc
}, {} as Record<string, typeof stories>)

// Order regions with Waikato first
const regionOrder = ['Waikato', 'Auckland', 'Wellington', 'Canterbury', 'Bay of Plenty', 'Hawkes Bay', 'Manawatu', 'Marlborough', 'Otago', 'Northland']
const orderedRegions = regionOrder.filter(r => storiesByRegion[r])

export default function StoriesPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-40 bg-black/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Logo className="w-8 h-8" animated={false} />
            <span className="font-display font-bold hidden sm:inline">Eek Mechanical</span>
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
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Stories</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Real jobs. Real people.
          </h1>
          <p className="text-zinc-400 text-lg mt-6 max-w-2xl">
            Every call is someone who needs help. Here are real jobs we&apos;ve completed across New Zealand.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="tel:0800769000"
              className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
              0800 769 000
            </a>
            <Link
              href="/locations"
              className="inline-flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <MapPin className="w-5 h-5" />
              Find Your Area
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 px-6 border-y border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">{getAllRegions().length}</div>
              <div className="text-zinc-500 text-sm">Regions covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-500">24/7</div>
              <div className="text-zinc-500 text-sm">Always available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Stories Carousel */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <StoriesPageCarousel />
        </div>
      </section>

      {/* Stories by Region */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          {orderedRegions.map((region) => (
            <div key={region} className="mb-16">
              <h2 className="font-display text-2xl font-bold mb-8 flex items-center gap-3">
                <MapPin className="w-6 h-6 text-red" />
                {region}
                <span className="text-zinc-600 text-lg font-normal">({storiesByRegion[region].length} jobs)</span>
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storiesByRegion[region].map((story) => (
                  <Link
                    key={story.id}
                    href={`/${story.slug}`}
                    className="block bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  >
                    {/* Location & Vehicle */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-sm text-red">
                          {story.location}
                        </span>
                        <div className="font-semibold mt-1">{story.vehicle}</div>
                      </div>
                      <div className="flex items-center gap-1 text-green-500 text-xs bg-green-500/10 px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Sorted
                      </div>
                    </div>

                    {/* Issue */}
                    <div className="mb-4">
                      <div className="text-zinc-500 text-xs uppercase tracking-wide mb-1">The problem</div>
                      <p className="text-zinc-300 text-sm">{story.issue}</p>
                    </div>

                    {/* Solution */}
                    <div className="mb-4">
                      <div className="text-zinc-500 text-xs uppercase tracking-wide mb-1">What we did</div>
                      <p className="text-zinc-300 text-sm">{story.solution}</p>
                    </div>

                    {/* Response Time */}
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-4">
                      <Clock className="w-4 h-4" />
                      {story.responseTime} response
                    </div>

                    {/* Quote if available */}
                    {story.quote && (
                      <div className="border-t border-zinc-800 pt-4 mt-4">
                        <div className="flex gap-2">
                          <Quote className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />
                          <p className="text-zinc-400 text-sm italic">&ldquo;{story.quote}&rdquo;</p>
                        </div>
                        <div className="text-zinc-600 text-xs mt-2">— {story.customerName}</div>
                      </div>
                    )}

                    {/* Customer name if no quote */}
                    {!story.quote && (
                      <div className="text-zinc-600 text-xs">
                        Customer: {story.customerName}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Your story could be next
          </h2>
          <p className="text-zinc-400 mb-8">
            Stuck somewhere? One call and we&apos;ll sort it.
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
