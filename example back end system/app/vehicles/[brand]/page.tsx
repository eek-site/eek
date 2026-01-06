import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, MapPin, Car, Wrench, Clock, CheckCircle, Truck } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { vehicleBrands, getBrandBySlug } from '@/lib/brands'
import { getStoriesByBrand } from '@/lib/stories'

interface Props {
  params: { brand: string }
}

export async function generateStaticParams() {
  return vehicleBrands.map((b) => ({
    brand: b.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const brand = getBrandBySlug(params.brand)
  if (!brand) return {}

  return {
    title: `${brand.title} NZ | 24/7 ${brand.name} Towing | Eek Mechanical`,
    description: `${brand.description} Call 0800 769 000 for fast ${brand.name} towing across New Zealand.`,
    keywords: brand.keywords.join(', '),
    openGraph: {
      title: `${brand.title} | Eek Mechanical NZ`,
      description: `Professional ${brand.name} towing service across New Zealand. 24/7 flatbed transport. Call 0800 769 000.`,
      type: 'website',
      locale: 'en_NZ',
      siteName: 'Eek Mechanical',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${brand.title} | Eek Mechanical`,
      description: brand.description,
    },
    alternates: {
      canonical: `https://eek.co.nz/vehicles/${brand.slug}`,
    },
  }
}

export default function BrandPage({ params }: Props) {
  const brand = getBrandBySlug(params.brand)
  if (!brand) notFound()

  const stories = getStoriesByBrand(params.brand)

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
            <Link href="/vehicles" className="hover:text-white transition-colors">Vehicles</Link>
            <span>/</span>
            <span className="text-white">{brand.name}</span>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-6">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold">
              {brand.title}
            </h1>
            <span className="text-zinc-600 text-sm border border-zinc-800 px-3 py-1 rounded-full">
              {brand.country}
            </span>
          </div>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            {brand.description}
          </p>

          <a
            href="tel:0800769000"
            className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors text-lg"
          >
            <Phone className="w-5 h-5" />
            Call 0800 769 000
          </a>
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
                <h3 className="font-semibold mb-1">24/7 Available</h3>
                <p className="text-zinc-500 text-sm">Day or night, weekends and holidays - we&apos;re always ready.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Flatbed Transport</h3>
                <p className="text-zinc-500 text-sm">Safe, damage-free transport for your {brand.name}.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Brand Expertise</h3>
                <p className="text-zinc-500 text-sm">We know {brand.name} vehicles and handle them with care.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-zinc max-w-none">
            {brand.content.split('\n\n').map((para, i) => (
              <p key={i} className="text-zinc-400 text-lg leading-relaxed mb-6">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Real Customer Stories */}
      {stories.length > 0 && (
        <section className="py-16 px-6 border-t border-zinc-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-2 text-center">
              {brand.name} Jobs We've Done
            </h2>
            <p className="text-zinc-500 mb-8 text-center">
              {stories.length} {brand.name} vehicles helped across New Zealand
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.slice(0, 12).map((story) => (
                <Link
                  key={story.id}
                  href={`/${story.slug}`}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{story.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                    <Car className="w-4 h-4" />
                    <span>{story.vehicle}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
                    <Wrench className="w-4 h-4" />
                    <span>{story.issue}</span>
                  </div>
                  
                  <p className="text-zinc-300 text-sm line-clamp-3 mb-4">
                    {story.story}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600">{story.customerName}</span>
                    <span className="text-red">View area →</span>
                  </div>
                </Link>
              ))}
            </div>
            
            {stories.length > 12 && (
              <p className="text-center text-zinc-500 mt-8">
                And {stories.length - 12} more {brand.name} vehicles helped...
              </p>
            )}
          </div>
        </section>
      )}

      {/* Other Brands */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Other Brands We Tow
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {vehicleBrands.filter(b => b.slug !== brand.slug).slice(0, 12).map((b) => (
              <Link
                key={b.slug}
                href={`/vehicles/${b.slug}`}
                className="bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 transition-colors group text-center"
              >
                <span className="text-sm font-medium group-hover:text-red transition-colors">
                  {b.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">
            Need {brand.name} Towing?
          </h2>
          <p className="text-zinc-400 mb-8">
            One call. We&apos;ll get your {brand.name} sorted.
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
            Professional {brand.name} Towing Across New Zealand
          </h2>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400">
              Eek Mechanical provides specialist {brand.name} towing services throughout New Zealand. 
              As a {brand.country === 'Germany' ? 'German' : brand.country === 'Japan' ? 'Japanese' : brand.country === 'Korea' ? 'Korean' : brand.country} brand, 
              your {brand.name} deserves expert handling - and that&apos;s exactly what we deliver.
            </p>
            <p className="text-zinc-400">
              Our flatbed tow trucks are the safest way to transport any {brand.name} model. 
              Unlike traditional towing, flatbed transport keeps all four wheels off the ground, 
              protecting your vehicle&apos;s drivetrain, suspension, and bodywork.
            </p>
            <p className="text-zinc-400">
              Whether your {brand.name} has broken down, been in an accident, or needs transport to a specialist dealer, 
              we&apos;re here 24/7. Don&apos;t search for &quot;{brand.name} towing near me&quot; - just call 0800 769 000 and we&apos;ll dispatch help immediately.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
