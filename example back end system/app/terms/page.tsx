import Link from 'next/link'
import Logo from '@/components/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Eek Mechanical',
  description: 'Terms of Service for Eek Mechanical services across New Zealand.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0F0F0F]">
      <nav className="border-b border-zinc-800 py-6">
        <div className="max-w-3xl mx-auto px-6 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 text-white">
            <Logo className="w-10 h-8" />
            <span className="font-display text-lg font-bold">Eek Mechanical</span>
          </Link>
          <Link href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="font-display text-4xl font-bold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-zinc-500 mb-12">Last updated: December 2024</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          <p className="text-zinc-400 leading-relaxed">
            These Terms of Service govern your use of Eek Mechanical services. 
            By requesting our services, you agree to these terms.
          </p>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Our Services
            </h2>
            <p className="text-zinc-400">
              Eek Mechanical is a dispatch and coordination service connecting you with our 
              network of 350+ independent towing and roadside assistance operators across 
              New Zealand. We are a service of EEK Mechanical Ltd (Ireland-registered).
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Service Requests
            </h2>
            <p className="text-zinc-400">
              When you request assistance, we will endeavour to dispatch a qualified 
              operator to your location as quickly as possible. Response times may vary 
              based on location, weather, traffic, and operator availability.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Pricing
            </h2>
            <p className="text-zinc-400">
              Prices for services will be communicated to you before work begins. 
              Pricing may vary based on the type of service, distance, time of day, 
              and vehicle specifications. Payment is due upon completion of service 
              unless otherwise arranged.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Operator Network
            </h2>
            <p className="text-zinc-400">
              Services are performed by independent operators in our network. 
              All operators are vetted and carry appropriate insurance. 
              Eek Mechanical coordinates services but the contractual relationship 
              for the service itself is between you and the operator.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Liability
            </h2>
            <p className="text-zinc-400">
              While we take care to coordinate quality services, Eek Mechanical's 
              liability is limited to the coordination service we provide. 
              Claims regarding the physical service should be directed to the 
              operator who performed the work.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Cancellations
            </h2>
            <p className="text-zinc-400">
              If you need to cancel a service request, please do so as early as 
              possible. Cancellation fees may apply if an operator has already 
              been dispatched to your location.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Disputes
            </h2>
            <p className="text-zinc-400">
              Any disputes shall be governed by New Zealand law and resolved 
              through negotiation or, if necessary, through the appropriate 
              New Zealand courts.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Contact Us
            </h2>
            <p className="text-zinc-400">
              If you have questions about these Terms, please contact us:<br />
              Phone: <a href="tel:0800769000" className="text-red hover:underline">0800 769 000</a><br />
              EEK Mechanical Ltd
            </p>
          </section>
        </div>
      </article>

      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © 2025 Eek Mechanical. A service by EEK Mechanical Ltd. | 
          <Link href="/privacy" className="hover:text-white ml-2">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  )
}
