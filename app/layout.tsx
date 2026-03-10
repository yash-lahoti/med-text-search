import type { Metadata } from 'next'
import { Syne, Inter, DM_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-display', weight: ['700', '800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const dmMono = DM_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'], style: ['normal', 'italic'] })

export const metadata: Metadata = {
  title: 'MedApp — Unified Dashboard',
  description: 'Medical knowledge graph, transcripts, and AI assistant',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${inter.variable} ${dmMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
