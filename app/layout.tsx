import './globals.css'
import EcosystemNav from './components/EcosystemNav'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://records.mailmypdf.com'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Public Records Requests | Request, Track & Audit Government Records',
  description: 'Build precise public-records and government-records requests, track agency responses, organize productions, and audit what you actually received.',
  openGraph: {
    title: 'Public Records Requests',
    description: 'Request, track, receive, and audit government records in one evidence-first workspace.',
    type: 'website',
    siteName: 'Records Requests',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><EcosystemNav />{children}</body></html>
}
