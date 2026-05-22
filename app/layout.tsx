import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Recepten',
  description: 'Familierecepten en weekplanning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  )
}
