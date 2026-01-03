'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Shield, Calendar } from 'lucide-react'
import { useCountdown } from '@/lib/judge/hooks'

interface JudgeWaitingScreenProps {
  revealTime: string
  isJudge: boolean
}

export function JudgeWaitingScreen({ revealTime, isJudge }: JudgeWaitingScreenProps) {
  const { timeLeft, isExpired } = useCountdown(revealTime)
  const revealDate = new Date(revealTime)

  if (isExpired) {
    // This shouldn't happen as we'd show the track data instead
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
              Appathon 2.0 Judge Panel
            </h1>
            <p className="mt-1 text-stone-400">
              {isJudge
                ? 'You have been assigned as a judge for Demo Day!'
                : 'You are not assigned as a judge for this event.'}
            </p>
          </div>
        </div>
      </div>

      {isJudge && (
        <>
          {/* Countdown Card */}
          <Card className="glass-card border-amber-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-stone-100">
                <Clock className="w-5 h-5 text-amber-400" />
                Panel Assignments Reveal
              </CardTitle>
            </CardHeader>
            <CardContent className="relative space-y-6">
              <p className="text-stone-400">
                Your track assignment and submissions will be revealed at:
              </p>

              {/* Reveal Date */}
              <div className="flex items-center gap-3 text-lg text-stone-200">
                <Calendar className="w-5 h-5 text-amber-400" />
                <span className="font-medium">
                  {revealDate.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  {' at '}
                  {revealDate.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Countdown Timer */}
              {timeLeft && (
                <div className="grid grid-cols-4 gap-3 sm:gap-4 pt-4">
                  <CountdownUnit value={timeLeft.days} label="Days" />
                  <CountdownUnit value={timeLeft.hours} label="Hours" />
                  <CountdownUnit value={timeLeft.minutes} label="Minutes" />
                  <CountdownUnit value={timeLeft.seconds} label="Seconds" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card className="glass-card border-stone-700">
            <CardHeader>
              <CardTitle className="text-stone-100">What to Expect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-stone-400">
                <p className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">1.</span>
                  Once assignments are revealed, you&apos;ll see your assigned track and all submissions in that track.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2.</span>
                  You will score each submission on 6 criteria (1-10 scale) plus bonus checkboxes.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">3.</span>
                  Your scores auto-save as you work. Submit when you&apos;re done.
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">4.</span>
                  Builder names are hidden to ensure fair judging.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isJudge && (
        <Card className="glass-card border-stone-700">
          <CardContent className="py-12 text-center">
            <Shield className="w-16 h-16 mx-auto text-stone-500 mb-4" />
            <h2 className="text-xl font-semibold text-stone-200 mb-2">Not a Judge</h2>
            <p className="text-stone-400 max-w-md mx-auto">
              You are not currently assigned as a judge for Appathon 2.0.
              If you believe this is an error, please contact the event organizers.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass-card rounded-xl p-3 sm:p-4 text-center">
      <div className="text-2xl sm:text-4xl font-bold text-amber-400 font-display">
        {value.toString().padStart(2, '0')}
      </div>
      <div className="text-xs sm:text-sm text-stone-500 mt-1">{label}</div>
    </div>
  )
}
