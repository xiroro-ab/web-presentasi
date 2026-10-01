import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Premium Presentation',
  description: 'Immersive, highly interactive presentation experience.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
