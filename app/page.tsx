'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/shared/Header'
import { FlywheelLogo } from '@/components/shared/FlywheelLogo'

const flywheelSteps = [
  { number: 1, name: 'Problem', description: 'Discover problems worth solving', icon: '🔍' },
  { number: 2, name: 'Context', description: 'Understand who, when, how painful', icon: '🎯' },
  { number: 3, name: 'Value', description: 'Validate with desperate users', icon: '💎' },
  { number: 4, name: 'Workflow', description: 'Classify the AI workflow type', icon: '⚙️' },
  { number: 5, name: 'Prompt', description: 'Generate Lovable-ready prompt', icon: '✨' },
  { number: 6, name: 'Build', description: 'Create with Lovable AI', icon: '🔨' },
  { number: 7, name: 'Deploy', description: 'Ship to real users', icon: '🚀' },
  { number: 8, name: 'Impact', description: 'Measure and discover more', icon: '📊' },
]

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh" />
      <div className="fixed inset-0 noise-bg" />

      <Header />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-16">
          <div className="mx-auto max-w-4xl text-center">
            {/* Floating logo */}
            <div className="mb-8 flex justify-center">
              <FlywheelLogo size="xl" animate className="animate-float" />
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-bold tracking-tight text-stone-100 sm:text-5xl md:text-6xl lg:text-7xl">
              Turn Problems Into
              <span className="block text-gradient">Working Solutions</span>
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-400 sm:text-xl">
              Master the Problem-to-Impact Flywheel with AI-guided coaching.
              Find real problems, validate them, and ship AI-powered solutions
              that make a difference.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 text-lg px-8 py-6"
              >
                <Link href="/signup">Start Your Journey</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-stone-700 text-stone-300 hover:bg-stone-800/50 hover:text-stone-100 text-lg px-8 py-6"
              >
                <Link href="/login">Sign In</Link>
              </Button>
            </div>

            {/* Trust badge */}
            <p className="mt-8 text-sm text-stone-500">
              JKKN Solution Studio • Powered by JKKN Institutions
            </p>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <svg
              className="h-6 w-6 text-stone-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </div>
        </section>

        {/* Flywheel Steps Section */}
        <section className="relative py-24 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl font-bold text-stone-100 sm:text-4xl">
                The 8-Step Flywheel
              </h2>
              <p className="mt-4 text-stone-400 max-w-2xl mx-auto">
                A proven methodology to go from problem discovery to measurable impact.
                Each spin of the flywheel builds momentum for the next.
              </p>
            </div>

            {/* Steps grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {flywheelSteps.map((step) => (
                <div
                  key={step.number}
                  className="glass-card group relative rounded-2xl p-6 transition-shadow duration-300 hover:shadow-lg hover:shadow-amber-500/20 hover:border-amber-500/30"
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-bold text-stone-950">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="mb-4 text-4xl">{step.icon}</div>

                  {/* Content */}
                  <h3 className="font-display text-lg font-semibold text-stone-100">
                    {step.name}
                  </h3>
                  <p className="mt-2 text-sm text-stone-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 px-4 bg-stone-900/50">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-12 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                  <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-100">
                  AI-Guided Coaching
                </h3>
                <p className="mt-3 text-stone-400">
                  Your personal AI coach asks the right questions and guides you
                  through each step without doing the work for you.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                  <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-100">
                  Real-World Projects
                </h3>
                <p className="mt-3 text-stone-400">
                  Build actual solutions for real problems. Your portfolio grows
                  with each completed flywheel cycle.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                  <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-semibold text-stone-100">
                  Track Your Impact
                </h3>
                <p className="mt-3 text-stone-400">
                  Measure adoption, retention, and pain reduction. See the real
                  impact of your solutions in numbers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-24 px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold text-stone-100 sm:text-4xl">
              Ready to Start Solving Real Problems?
            </h2>
            <p className="mt-4 text-stone-400">
              Join JKKN Learners who are building AI-powered solutions that make a difference.
              Your first flywheel cycle is just a click away.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                asChild
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25 text-lg px-8 py-6"
              >
                <Link href="/signup">Begin Your First Cycle</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-stone-800 py-8 px-4">
          <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <FlywheelLogo size="sm" />
              <span className="text-sm text-stone-500">
                JKKN Solution Studio • JKKN Institutions
              </span>
            </div>
            <div className="flex gap-6 text-sm text-stone-500">
              <Link href="/about" className="hover:text-stone-300">About</Link>
              <Link href="/privacy" className="hover:text-stone-300">Privacy</Link>
              <Link href="/terms" className="hover:text-stone-300">Terms</Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
