import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Lahasa — Collecte CIN',
  description: 'Plateforme offline-first pour numérisation et extraction OCR de Cartes d\'Identité Nationales malgaches',
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
