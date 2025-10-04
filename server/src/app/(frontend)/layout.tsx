import React from 'react'
import { draftMode } from 'next/headers'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import '../globals.css'

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
      {/*
        Use a flex container on the body to ensure the page fills at least the screen and
        the footer sticks to the bottom when content is short. This does not change
        the logical structure (header → content → footer) but prevents gaps in the
        background on pages like About when the content is short.
      */}
      <body className="bg-slate-900 text-white min-h-screen flex flex-col">
        {isEnabled && (
          <div className="fixed top-0 left-0 right-0 bg-yellow-400 text-black text-center py-2 z-[9999] text-sm font-semibold">
            🔍 Preview Mode — Viewing Draft Content
          </div>
        )}
        <Header />
        {/* Wrap children in a flex-1 div to allow it to grow and push the footer to the bottom */}
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}