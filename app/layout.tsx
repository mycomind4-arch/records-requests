import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://records.mailmypdf.com'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Public Records Requests | Request, Track & Audit Government Records | My-CoMind',
  description: 'Build precise public-records and government-records requests, track agency responses, organize productions, and audit what you actually received.',
  openGraph: {
    title: 'Public Records Requests | My-CoMind',
    description: 'Request, track, receive, and audit government records in one evidence-first workspace.',
    type: 'website',
    siteName: 'My-CoMind Records Requests',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
