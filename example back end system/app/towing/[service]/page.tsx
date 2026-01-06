import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Phone, MapPin, Car, Clock, CheckCircle, Truck } from 'lucide-react'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { services, getServiceBySlug } from '@/lib/services'
import { getStoriesByJobType } from '@/lib/stories'

interface Props {
  params: { service: string }
}

// Client component for displaying filtered stories
function ServiceStories({ serviceSlug, issueMatch }: { serviceSlug: string; issueMatch?: string }) {
  // Get stories matching this service type
  const stories = issueMatch ? getStoriesByJobType(issueMatch.toLowerCase().replace(/\s+/g, '-')) : []
  
  if (stories.length === 0) return null
  
  return (
    <section className="py-16 px-6 border-t border-zinc-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-display text-2xl font-bold mb-2 text-center">
          Real Customer Stories
        </h2>
        <p className="text-zinc-500 mb-8 text-center">
          {stories.length} jobs completed across New Zealand
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
              
              <div className="flex items-center gap-2 text-zinc-400 text-sm mb-4">
                <Car className="w-4 h-4" />
                <span>{story.vehicle}</span>
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
            And {stories.length - 12} more jobs like this...
          </p>
        )}
      </div>
    </section>
  )
}

export async function generateStaticParams() {
  return services.map((s) => ({
    service: s.slug,
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getServiceBySlug(params.service)
  if (!service) return {}

  return {
    title: `${service.title} NZ | 24/7 ${service.title} | Eek Mechanical`,
    description: `${service.description} Call 0800 769 000 for fast ${service.title.toLowerCase()} across New Zealand.`,
    keywords: service.keywords.join(', '),
    openGraph: {
      title: `${service.title} | Eek Mechanical NZ`,
      description: `24/7 ${service.title.toLowerCase()} service across New Zealand. Fast, reliable, professional. Call 0800 769 000.`,
      type: 'website',
      locale: 'en_NZ',
      siteName: 'Eek Mechanical',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${service.title} | Eek Mechanical`,
      description: service.description,
    },
    alternates: {
      canonical: `https://eek.co.nz/towing/${service.slug}`,
    },
  }
}

export default function ServicePage({ params }: Props) {
  const service = getServiceBySlug(params.service)
  if (!service) notFound()

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
            <Link href="/towing" className="hover:text-white transition-colors">Towing</Link>
            <span>/</span>
            <span className="text-white">{service.title}</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            {service.title}
          </h1>
          
          <p className="text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
            {service.description}
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
                <h3 className="font-semibold mb-1">Flatbed Fleet</h3>
                <p className="text-zinc-500 text-sm">Modern flatbed trucks for safe, damage-free transport.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-red" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">All Vehicles</h3>
                <p className="text-zinc-500 text-sm">Cars, SUVs, utes, vans - we handle them all.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-invert prose-zinc max-w-none">
            {service.content.split('\n\n').map((para, i) => (
              <p key={i} className="text-zinc-400 text-lg leading-relaxed mb-6">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      {service.caseStudies.length > 0 && (
        <section className="py-16 px-6 border-t border-zinc-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-display text-2xl font-bold mb-8 text-center">
              Real Jobs We've Done
            </h2>
            <div className="space-y-6">
              {service.caseStudies.map((study, i) => (
                <div key={i} className="bg-zinc-900 rounded-2xl p-8">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h3 className="font-semibold text-lg">{study.title}</h3>
                    <span className="text-zinc-500 text-sm">{study.location}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Problem</h4>
                      <p className="text-zinc-300 text-sm">{study.problem}</p>
                    </div>
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Solution</h4>
                      <p className="text-zinc-300 text-sm">{study.solution}</p>
                    </div>
                    <div>
                      <h4 className="text-zinc-500 text-xs uppercase tracking-wide mb-2">Time</h4>
                      <p className="text-red font-semibold">{study.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Real Customer Stories */}
      <ServiceStories serviceSlug={service.slug} issueMatch={service.issueMatch} />

      {/* Other Services */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-6 text-center">
            Other Services
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {services.filter(s => s.slug !== service.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/towing/${s.slug}`}
                className="bg-zinc-900 hover:bg-zinc-800 rounded-xl p-4 transition-colors group"
              >
                <span className="text-sm font-medium group-hover:text-red transition-colors">
                  {s.title}
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
            Need {service.title}?
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
            {service.title} Service Across New Zealand
          </h2>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400">
              Eek Mechanical provides professional 24/7 {service.title.toLowerCase()} services throughout New Zealand. 
              Whether you&apos;re in Auckland, Wellington, Christchurch, or anywhere in between, our network of experienced operators is ready to help.
            </p>
            <p className="text-zinc-400">
              Our fleet of modern flatbed tow trucks ensures your vehicle is transported safely, without the risk of damage that can occur with traditional towing methods. 
              We handle all types of vehicles including lowered cars, luxury vehicles, and SUVs.
            </p>
            <p className="text-zinc-400">
              Don&apos;t waste time searching for &quot;{service.title.toLowerCase()} near me&quot; - just call 0800 769 000 and we&apos;ll dispatch the nearest available operator to your location immediately.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
