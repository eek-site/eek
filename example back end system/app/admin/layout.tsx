import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#DC2626',
}

export const metadata: Metadata = {
  title: 'Hook Admin | Dashboard',
  description: 'Eek Mechanical Admin Dashboard - Manage jobs, suppliers, and operations',
  manifest: '/admin-manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hook Admin',
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="manifest" href="/admin-manifest.json" />
      <link rel="apple-touch-icon" href="/admin-icon.svg" />
      {children}
    </>
  )
}
