'use client'

import Link from 'next/link'
import { FlywheelLogo } from '@/components/shared/FlywheelLogo'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh" />
      <div className="fixed inset-0 noise-bg" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <FlywheelLogo size="sm" />
          <span className="font-display text-lg font-bold tracking-tight text-stone-100">
            JKKN
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {' '}Solution Studio
            </span>
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center text-sm text-stone-500">
        <p>JKKN Solution Studio • JKKN Institutions</p>
      </footer>
    </div>
  )
}
