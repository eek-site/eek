import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import LocationStoriesList from '@/components/LocationStoriesList'
import OtherLocationsCarousel from '@/components/OtherLocationsCarousel'
import { allLocations, getLocationBySlug as getLocationFromLocations, waikatoLocations } from '@/lib/locations'
import { getAllLocationSlugs, getLocationBySlug as getLocationFromStories, getStoriesByLocation } from '@/lib/stories'

interface Props {
  params: { location: string }
}

export async function generateStaticParams() {
  // Get all location slugs from both locations.ts AND stories.ts
  const locationSlugs = new Set(allLocations.map(loc => loc.slug))
  const storySlugs = getAllLocationSlugs()
  
  // Merge all slugs
  storySlugs.forEach(slug => locationSlugs.add(slug))
  
  return Array.from(locationSlugs).map((slug) => ({
    location: slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Try locations.ts first, then fall back to stories data
  const location = getLocationFromLocations(params.location)
  const storyLocation = getLocationFromStories(params.location)
  
  if (!location && !storyLocation) return {}

  const name = location?.name || storyLocation?.name || params.location
  const region = location?.region || storyLocation?.region || ''
  const isWaikato = waikatoLocations.some(l => l.slug === params.location)
  const description = `${name} towing service - 24/7 tow truck available. Fast response across ${name} and ${region}. Call 0800 769 000.${isWaikato ? ' Local Waikato operators.' : ''}`
  
  return {
    title: `Towing ${name} | 24/7 Tow Truck ${name} | Eek Mechanical`,
    description,
    keywords: location?.keywords?.join(', ') || `${name} towing, tow truck ${name}, ${name} breakdown, ${name} roadside assistance`,
    openGraph: {
      title: `Towing ${name} | Eek Mechanical NZ`,
      description: `24/7 towing service in ${name}. Fast, reliable, professional. Call 0800 769 000.`,
      type: 'website',
      locale: 'en_NZ',
      siteName: 'Eek Mechanical',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Towing ${name} | Eek Mechanical`,
      description,
    },
    alternates: {
      canonical: `https://eek.co.nz/${params.location}`,
    },
  }
}

export default function LocationPage({ params }: Props) {
  // Try locations.ts first, then fall back to stories data
  const location = getLocationFromLocations(params.location)
  const storyLocation = getLocationFromStories(params.location)
  const locationStories = getStoriesByLocation(params.location)
  
  // If location doesn't exist anywhere, 404
  if (!location && !storyLocation && locationStories.length === 0) notFound()

  // Build location data from available sources
  const locationName = location?.name || storyLocation?.name || params.location
  const locationRegion = location?.region || storyLocation?.region || ''
  const locationSlug = params.location
  const locationDescription = location?.description || `${locationName} towing service - 24/7 coverage across ${locationName} and ${locationRegion}.`
  const locationNearby = location?.nearby || []
  
  const isWaikato = waikatoLocations.some(l => l.slug === params.location)

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
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
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">{locationName}</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Towing {locationName}
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            {locationDescription}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
            {isWaikato && (
              <div className="inline-flex items-center gap-2 bg-red/10 border border-red/20 text-red px-4 py-2 rounded-full text-sm">
                <MapPin className="w-4 h-4" />
                Local Waikato Team - Fastest Response
              </div>
            )}

            <a
              href="tel:0800769000"
              className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg"
            >
              <Phone className="w-5 h-5" />
              Call 0800 769 000
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">24/7 Service</h3>
                <p className="text-zinc-500 text-sm">Day or night, we&apos;re here when you need us in {locationName}.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Local Knowledge</h3>
                <p className="text-zinc-500 text-sm">Our operators know {locationName} and {locationRegion} inside out.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">All Vehicles</h3>
                <p className="text-zinc-500 text-sm">Cars, SUVs, utes - we tow them all.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Carousel - shows other areas to navigate to */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-zinc-500 text-sm mb-4 text-center">Click to explore stories from other areas</p>
          <OtherLocationsCarousel currentLocationSlug={locationSlug} showHeader={false} />
        </div>
      </section>

      {/* Stories List for this Location */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-8 text-center">
            Other Kiwis we helped in {locationName}
          </h2>
          <LocationStoriesList locationSlug={locationSlug} locationName={locationName} />
        </div>
      </section>

      {/* Nearby Areas */}
      {locationNearby.length > 0 && (
        <section className="py-16 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-6 text-center">
              Also Covering Near {locationName}
            </h2>
            <div className="flex flex-wrap gap-3">
              {locationNearby.map((area) => {
                const nearbyLoc = allLocations.find(l => l.name === area)
                if (nearbyLoc) {
                  return (
                    <Link
                      key={area}
                      href={`/${nearbyLoc.slug}`}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-sm transition-colors"
                    >
                      {area}
                    </Link>
                  )
                }
                return (
                  <span key={area} className="px-4 py-2 bg-zinc-900 rounded-full text-sm text-zinc-500">
                    {area}
                  </span>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Stuck in {locationName}?
          </h2>
          <p className="text-zinc-400 mb-8">
            One call. We&apos;ll get you going.
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

      {/* SEO Content */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Tow Truck Service in {locationName}{locationRegion ? `, ${locationRegion}` : ''}
          </h2>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400">
              Eek Mechanical provides professional 24/7 towing services throughout {locationName}{locationRegion ? ` and the wider ${locationRegion} region` : ''}. 
              Whether you&apos;ve broken down on a main road or need recovery from a difficult location, our experienced operators are ready to help.
            </p>
            <p className="text-zinc-400">
              We handle all types of vehicles including cars, SUVs, utes, and vans. 
              Our fleet includes flatbed tow trucks for safe transport of lowered, luxury, or damaged vehicles.
            </p>
            {isWaikato && (
              <p className="text-zinc-400">
                As a Waikato-based operation, {locationName} is part of our core service area. 
                This means faster response times and operators who know the local roads and conditions.
              </p>
            )}
            <p className="text-zinc-400">
              Don&apos;t search for &quot;{locationName} tow truck&quot; or &quot;towing near me&quot; - just call 0800 769 000 and we&apos;ll dispatch the nearest available operator immediately.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
