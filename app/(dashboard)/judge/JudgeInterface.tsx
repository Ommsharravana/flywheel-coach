'use client'

import { useState } from 'react'
import { useJudgeAccess } from '@/lib/judge/hooks'
import { JudgeWaitingScreen, SubmissionsList, ScoringForm } from '@/components/judge'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ViewState =
  | { type: 'list' }
  | { type: 'scoring'; submissionId: string }

export function JudgeInterface() {
  const { data, loading, error, refresh } = useJudgeAccess()
  const [view, setView] = useState<ViewState>({ type: 'list' })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-stone-400">Unable to load judge data.</p>
        <Button onClick={refresh} variant="outline" className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  // Not a judge or panel not revealed yet
  if (!data.isJudge || !data.isPanelRevealed) {
    return (
      <JudgeWaitingScreen
        revealTime={data.revealTime}
        isJudge={data.isJudge}
      />
    )
  }

  // Panel revealed but no track data (error state)
  if (!data.trackData) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-amber-400 mb-4">
          Panel is revealed but your track data could not be loaded.
        </p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    )
  }

  // Scoring a specific submission
  if (view.type === 'scoring') {
    return (
      <ScoringForm
        submissionId={view.submissionId}
        onBack={() => {
          setView({ type: 'list' })
          refresh() // Refresh to get updated status
        }}
      />
    )
  }

  // Show submissions list
  return (
    <SubmissionsList
      trackData={data.trackData}
      onSelectSubmission={(submissionId) =>
        setView({ type: 'scoring', submissionId })
      }
    />
  )
}
