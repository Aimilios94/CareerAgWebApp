import type { Metadata } from 'next'
import { Poppins, Lora } from 'next/font/google'
import { Providers } from './providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Career Agent - Find Your Perfect Job Match',
  description: 'AI-powered career management platform that helps you find job matches, analyze skill gaps, and improve your applications.',
  openGraph: {
    title: 'Career Agent - Find Your Perfect Job Match',
    description: 'AI-powered career management platform that helps you find job matches, analyze skill gaps, and improve your applications.',
    type: 'website',
    siteName: 'Career Agent',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Career Agent - Find Your Perfect Job Match',
    description: 'AI-powered career management platform that helps you find job matches, analyze skill gaps, and improve your applications.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${lora.variable}`}>
      <body className="min-h-screen bg-brand-light antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
