import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import Script from 'next/script'
import VisitorTracker from '@/components/VisitorTracker'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Eek Mobile Mechanical | NZIFDA Certified Misfuel Services | 24/7 NZ',
  description: 'Eek Mobile Mechanical - 24/7 mobile mechanic service across New Zealand. NZIFDA Certified Misfuel Services Nationwide. 0800 769 000',
  keywords: 'mobile mechanic, car repair, roadside assistance, New Zealand, Auckland, Wellington, Christchurch, 24/7 mechanic, wrong fuel, misfuel',
  openGraph: {
    title: 'Eek Mobile Mechanical | NZIFDA Certified Misfuel Services',
    description: '24/7 mobile mechanic service across New Zealand. NZIFDA Certified Misfuel Services Nationwide.',
    url: 'https://eek.co.nz',
    siteName: 'Eek Mobile Mechanical',
    locale: 'en_NZ',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://eek.co.nz',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="theme-color" content="#ff5500" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Eek Mechanical" />
        {/* Google Ads - Load BOTH account tags */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17084465163"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Configure BOTH Google Ads accounts
            gtag('config', 'AW-17084465163');
            gtag('config', 'AW-17529704008');
            
            // Capture ads source from URL params
            (function() {
              try {
                var params = new URLSearchParams(window.location.search);
                var gclid = params.get('gclid');
                if (gclid) {
                  var data = {
                    gclid: gclid,
                    ads_src: params.get('ads_src'),
                    utm_source: params.get('utm_source'),
                    utm_campaign: params.get('utm_campaign'),
                    landing: window.location.pathname,
                    ts: new Date().toISOString()
                  };
                  sessionStorage.setItem('eek_ads_source', JSON.stringify(data));
                  console.log('📊 Ads source captured:', data);
                }
              } catch(e) {}
            })();
          `}
        </Script>
      </head>
      <body className="bg-black text-white font-sans antialiased">
        <VisitorTracker />
        {children}
      </body>
    </html>
  )
}
