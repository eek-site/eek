import { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Car, Globe } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { vehicleBrands } from '@/lib/brands'
import { getAllVehicleBrands } from '@/lib/stories'

export const metadata: Metadata = {
  title: 'Vehicle Towing by Brand | All Makes & Models | Eek Mechanical',
  description: 'Professional towing for all vehicle brands - Toyota, Ford, Mazda, BMW, Mercedes, and more. 24/7 service across New Zealand. Call 0800 769 000.',
  keywords: 'car towing, vehicle towing, toyota towing, ford towing, bmw towing, mercedes towing, nz towing, audi towing, subaru towing',
  openGraph: {
    title: 'Vehicle Towing by Brand | Eek Mechanical NZ',
    description: 'Professional towing for all vehicle brands. Toyota, Ford, BMW, Mercedes, and more. 24/7 across New Zealand.',
    type: 'website',
    locale: 'en_NZ',
    siteName: 'Eek Mechanical',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vehicle Towing by Brand | Eek Mechanical',
    description: 'Professional towing for all vehicle brands. 24/7 across New Zealand.',
  },
  alternates: {
    canonical: 'https://eek.co.nz/vehicles',
  },
}

export default function VehiclesPage() {
  // Get actual story counts
  const storyCounts = getAllVehicleBrands()
  const countMap = new Map(storyCounts.map(b => [b.slug, b.count]))

  // Group brands by country
  const brandsByCountry = vehicleBrands.reduce((acc, brand) => {
    if (!acc[brand.country]) acc[brand.country] = []
    acc[brand.country].push(brand)
    return acc
  }, {} as Record<string, typeof vehicleBrands>)

  const countryOrder = ['Japan', 'Germany', 'Korea', 'USA', 'Australia']

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
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Vehicles</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            Towing by Vehicle Brand
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl">
            We tow all makes and models. Find your vehicle brand below to see our experience and real customer stories.
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

      {/* Brands by Country */}
      {countryOrder.map(country => {
        const brands = brandsByCountry[country]
        if (!brands) return null

        return (
          <section key={country} className="py-12 px-6 border-t border-zinc-900">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center gap-3 mb-8">
                <Globe className="w-5 h-5 text-zinc-500" />
                <h2 className="font-display text-2xl font-bold">{country}</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {brands.map(brand => {
                  const storyCount = countMap.get(brand.slug) || 0
                  
                  return (
                    <Link
                      key={brand.slug}
                      href={`/vehicles/${brand.slug}`}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 hover:bg-zinc-800/50 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Car className="w-6 h-6 text-zinc-600 group-hover:text-red transition-colors" />
                          <h3 className="font-semibold text-lg group-hover:text-red transition-colors">
                            {brand.name}
                          </h3>
                        </div>
                        {storyCount > 0 && (
                          <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">
                            {storyCount} jobs
                          </span>
                        )}
                      </div>
                      
                      <p className="text-zinc-400 text-sm line-clamp-2">
                        {brand.description}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      {/* All Brands We Tow */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Any Vehicle. Any Brand.
          </h2>
          <p className="text-zinc-400 mb-8">
            Don't see your brand? We tow everything - European, Japanese, American, Korean, and more. 
            Classic cars, modern EVs, commercial vehicles. If it has wheels, we can move it.
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
