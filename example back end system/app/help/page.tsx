import { Metadata } from 'next'
import Link from 'next/link'
import { articles } from '@/lib/articles'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { Phone, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Help & Guides | Eek Mechanical',
  description: 'Guides and information about towing, breakdowns, accidents, and what to do when you need help on New Zealand roads.',
  keywords: 'towing guide, car breakdown help, accident guide, New Zealand towing',
}

export default function HelpPage() {
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
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight">
            Help & Guides
          </h1>
          <p className="text-zinc-400 text-lg mt-4 max-w-2xl">
            Information to help when things go wrong on the road.
          </p>
          
          <div className="mt-8">
            <a
              href="tel:0800769000"
              className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-8 py-4 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
              Need help now? 0800 769 000
            </a>
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="py-16 px-6 border-t border-zinc-900 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-6">
            {articles.map(article => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
                className="p-6 bg-zinc-900 hover:bg-zinc-800 rounded-2xl transition-colors group"
              >
                <h2 className="font-display text-xl font-bold mb-2 group-hover:text-red transition-colors">
                  {article.title}
                </h2>
                <p className="text-zinc-400 text-sm line-clamp-3">
                  {article.description}
                </p>
                {article.caseStudy && (
                  <span className="inline-block mt-4 text-xs text-zinc-500 bg-zinc-800 px-2 py-1 rounded">
                    Includes real example
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">Can&apos;t find what you need?</h2>
          <p className="text-zinc-400 mb-6">Call us and we&apos;ll answer your questions.</p>
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
