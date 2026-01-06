import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getArticle, getAllArticleSlugs, articles } from '@/lib/articles'
import Logo from '@/components/Logo'
import Footer from '@/components/Footer'
import { Phone, Clock, ArrowLeft } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return getAllArticleSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getArticle(params.slug)
  if (!article) return {}
  
  return {
    title: `${article.title} | Eek Mechanical`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      url: `https://eek.co.nz/help/${params.slug}`,
    },
    alternates: {
      canonical: `https://eek.co.nz/help/${params.slug}`,
    },
  }
}

export default function ArticlePage({ params }: Props) {
  const article = getArticle(params.slug)
  
  if (!article) {
    notFound()
  }

  // Simple markdown-like parsing
  const parseContent = (content: string) => {
    const lines = content.trim().split('\n')
    const elements: JSX.Element[] = []
    let currentList: string[] = []
    let listKey = 0
    
    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${listKey++}`} className="list-disc pl-6 space-y-2 my-4 text-zinc-300">
            {currentList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )
        currentList = []
      }
    }
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('# ')) {
        flushList()
        elements.push(<h1 key={index} className="font-display text-3xl font-bold mt-8 mb-4">{trimmed.slice(2)}</h1>)
      } else if (trimmed.startsWith('## ')) {
        flushList()
        elements.push(<h2 key={index} className="font-display text-2xl font-bold mt-8 mb-4">{trimmed.slice(3)}</h2>)
      } else if (trimmed.startsWith('### ')) {
        flushList()
        elements.push(<h3 key={index} className="font-display text-xl font-bold mt-6 mb-3">{trimmed.slice(4)}</h3>)
      } else if (trimmed.startsWith('- ')) {
        currentList.push(trimmed.slice(2))
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        flushList()
        elements.push(<p key={index} className="font-semibold text-white mt-4 mb-2">{trimmed.slice(2, -2)}</p>)
      } else if (trimmed.length > 0) {
        flushList()
        // Handle inline bold
        const withBold = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        elements.push(<p key={index} className="text-zinc-300 my-3" dangerouslySetInnerHTML={{ __html: withBold }} />)
      }
    })
    
    flushList()
    return elements
  }

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

      {/* Article */}
      <article className="pt-32 pb-16 px-6 flex-1">
        <div className="max-w-3xl mx-auto">
          <Link href="/help" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All help articles
          </Link>
          
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-4">
            {article.title}
          </h1>
          
          <p className="text-zinc-400 text-lg mb-8">
            {article.description}
          </p>

          {/* Quick CTA */}
          <div className="bg-zinc-900 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-zinc-300">Need help right now?</span>
            <a
              href="tel:0800769000"
              className="inline-flex items-center gap-2 bg-red hover:bg-red-dark text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              <Phone className="w-5 h-5" />
              0800 769 000
            </a>
          </div>

          {/* Content */}
          <div className="prose prose-invert max-w-none">
            {parseContent(article.content)}
          </div>

          {/* Case Study */}
          {article.caseStudy && (
            <div className="mt-12 bg-zinc-900 rounded-2xl p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold mb-4">Real Example: {article.caseStudy.title}</h3>
              
              <div className="space-y-4 text-zinc-400">
                <div>
                  <span className="text-zinc-500 text-sm uppercase tracking-wide">The situation</span>
                  <p className="mt-1">{article.caseStudy.situation}</p>
                </div>
                
                <div>
                  <span className="text-zinc-500 text-sm uppercase tracking-wide">What we did</span>
                  <p className="mt-1">{article.caseStudy.solution}</p>
                </div>
                
                <div>
                  <span className="text-zinc-500 text-sm uppercase tracking-wide">Result</span>
                  <p className="mt-1 text-white">{article.caseStudy.result}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>

      {/* Related Articles */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-xl font-bold mb-6">More help</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {articles
              .filter(a => a.slug !== article.slug)
              .slice(0, 4)
              .map(a => (
                <Link
                  key={a.slug}
                  href={`/help/${a.slug}`}
                  className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <h3 className="font-semibold text-white mb-1">{a.title}</h3>
                  <p className="text-sm text-zinc-500 line-clamp-2">{a.description}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-zinc-900">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-6">Still stuck?</h2>
          <a
            href="tel:0800769000"
            className="inline-flex items-center gap-3 bg-red hover:bg-red-dark text-white font-semibold px-10 py-5 rounded-full transition-colors text-xl"
          >
            <Phone className="w-6 h-6" />
            0800 769 000
          </a>
          <p className="text-zinc-600 mt-4 text-sm">24/7 - We&apos;ll sort it</p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
