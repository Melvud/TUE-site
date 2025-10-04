import React from 'react'
import { draftMode } from 'next/headers'
import './globals.css'

export const metadata = {
  title: 'Photonics Society Eindhoven',
  description: 'Join the photonics community at TU/e',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isEnabled } = await draftMode()

  return (
    <html lang="en">
      <body>
        {isEnabled && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black text-center py-2 z-[9999] text-sm font-semibold">
            🔍 Preview Mode — Viewing Draft Content
          </div>
        )}
        {children}
      </body>
    </html>
  )
}