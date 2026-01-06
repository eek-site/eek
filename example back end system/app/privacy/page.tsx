import Link from 'next/link'
import Logo from '@/components/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Eek Mechanical',
  description: 'Privacy Policy for Eek Mechanical - How we collect, use, and protect your information.',
}

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-zinc-500 mb-12">Last updated: December 2024</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8">
          <p className="text-zinc-400 leading-relaxed">
            Eek Mechanical ("we", "our", or "us") is committed to protecting your privacy. 
            This Privacy Policy explains how we collect, use, and safeguard your information 
            when you use our services.
          </p>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Information We Collect
            </h2>
            <p className="text-zinc-400 mb-4">When you request our services, we collect:</p>
            <ul className="text-zinc-400 list-disc list-inside space-y-2">
              <li>Your name and contact details (phone number)</li>
              <li>Your location (to dispatch assistance)</li>
              <li>Details about your vehicle and the issue you're experiencing</li>
              <li>Any other information you provide to us</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              How We Use Your Information
            </h2>
            <p className="text-zinc-400 mb-4">We use your information to:</p>
            <ul className="text-zinc-400 list-disc list-inside space-y-2">
              <li>Dispatch towing and roadside assistance services</li>
              <li>Communicate with you about your service request</li>
              <li>Coordinate with our network of operators</li>
              <li>Improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Information Sharing
            </h2>
            <p className="text-zinc-400 mb-4">We share your information only with:</p>
            <ul className="text-zinc-400 list-disc list-inside space-y-2">
              <li>Our network of towing and roadside assistance operators (to fulfill your service request)</li>
              <li>Service providers who assist our operations</li>
              <li>Legal authorities when required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Data Security
            </h2>
            <p className="text-zinc-400">
              We implement appropriate security measures to protect your information. 
              However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Your Rights
            </h2>
            <p className="text-zinc-400 mb-4">Under New Zealand's Privacy Act 2020, you have the right to:</p>
            <ul className="text-zinc-400 list-disc list-inside space-y-2">
              <li>Access your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion of your information</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-semibold text-red mb-4">
              Contact Us
            </h2>
            <p className="text-zinc-400">
              If you have questions about this Privacy Policy, please contact us:<br />
              Phone: <a href="tel:0800769000" className="text-red hover:underline">0800 769 000</a><br />
              EEK Mechanical Ltd
            </p>
          </section>
        </div>
      </article>

      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-3xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © 2025 Eek Mechanical. A service by EEK Mechanical Ltd. | 
          <Link href="/terms" className="hover:text-white ml-2">Terms of Service</Link>
        </div>
      </footer>
    </main>
  )
}
