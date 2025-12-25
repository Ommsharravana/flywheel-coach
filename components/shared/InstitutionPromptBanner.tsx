'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface InstitutionPromptBannerProps {
  userName?: string | null
}

export function InstitutionPromptBanner({ userName }: InstitutionPromptBannerProps) {
  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-amber-500/30 bg-amber-500/10">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-100">
              Select Your Institution
            </h3>
            <p className="text-sm text-stone-400">
              {userName ? `Hi ${userName}! ` : ''}Please select your institution to start creating cycles and track your progress.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
        >
          <Link href="/select-institution">Select Institution</Link>
        </Button>
      </div>
    </div>
  )
}
