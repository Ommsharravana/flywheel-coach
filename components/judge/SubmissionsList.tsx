'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from '@/components/ui/progress-ring'
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Circle,
  MapPin,
  ChevronRight,
  Zap,
} from 'lucide-react'
import type { JudgeTrackWithSubmissions, JudgeSubmission } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

interface SubmissionsListProps {
  trackData: JudgeTrackWithSubmissions
  onSelectSubmission: (submissionId: string) => void
}

export function SubmissionsList({ trackData, onSelectSubmission }: SubmissionsListProps) {
  const { track, submissions, judge_info } = trackData

  // Calculate progress
  const completedCount = submissions.filter((s) => s.scoring_status === 'completed').length
  const inProgressCount = submissions.filter((s) => s.scoring_status === 'in_progress').length
  const totalCount = submissions.length

  return (
    <div className="space-y-6">
      {/* Track Header - Clean & Focused */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-[#0b6d41]/30">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Progress Ring */}
          <ProgressRing
            value={completedCount}
            max={totalCount}
            size={100}
            strokeWidth={10}
            color="jkkn"
            showValue={true}
            label="scored"
          />

          {/* Track Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
                {track.name}
              </h1>
              {judge_info.is_lead && (
                <Badge className="bg-[#ffde59]/20 text-[#ffde59] border-[#ffde59]/50">
                  <Zap className="w-3 h-3 mr-1" />
                  Lead Judge
                </Badge>
              )}
            </div>
            <p className="mt-1 text-stone-400">{track.description || 'Judging track'}</p>
            {track.room_location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-stone-500">
                <MapPin className="w-4 h-4" />
                <span>{track.room_location}</span>
              </div>
            )}

            {/* Quick Stats */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#0b6d41]" />
                <span className="text-sm text-stone-400">
                  <span className="font-semibold text-[#0b6d41]">{completedCount}</span> completed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#ffde59]" />
                <span className="text-sm text-stone-400">
                  <span className="font-semibold text-[#ffde59]">{inProgressCount}</span> in progress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-stone-500" />
                <span className="text-sm text-stone-400">
                  <span className="font-semibold text-stone-300">{totalCount - completedCount - inProgressCount}</span> pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <Card className="glass-card border-stone-700">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-stone-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-[#0b6d41]" />
              Submissions to Score
            </div>
            <Badge variant="outline" className="text-stone-400 border-stone-600">
              {totalCount} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-stone-600" />
              <p>No submissions assigned to this track yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-700/50">
              {submissions
                .sort((a, b) => {
                  // Sort by demo slot, then by submission number
                  if (a.demo_slot !== null && b.demo_slot !== null) {
                    return a.demo_slot - b.demo_slot
                  }
                  if (a.demo_slot !== null) return -1
                  if (b.demo_slot !== null) return 1
                  return a.submission_number.localeCompare(b.submission_number)
                })
                .map((submission, index) => (
                  <SubmissionRow
                    key={submission.submission_id}
                    submission={submission}
                    onClick={() => onSelectSubmission(submission.submission_id)}
                    isOdd={index % 2 === 1}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function SubmissionRow({
  submission,
  onClick,
  isOdd,
}: {
  submission: JudgeSubmission
  onClick: () => void
  isOdd?: boolean
}) {
  const statusConfig = {
    pending: {
      icon: Circle,
      label: 'Not Started',
      color: 'text-stone-400',
      bgColor: 'bg-stone-500/20',
      borderColor: 'border-stone-600',
    },
    in_progress: {
      icon: Clock,
      label: 'In Progress',
      color: 'text-[#ffde59]',
      bgColor: 'bg-[#ffde59]/20',
      borderColor: 'border-[#ffde59]/50',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Completed',
      color: 'text-[#0b6d41]',
      bgColor: 'bg-[#0b6d41]/20',
      borderColor: 'border-[#0b6d41]/50',
    },
  }

  const config = statusConfig[submission.scoring_status]
  const StatusIcon = config.icon

  return (
    <div
      className={cn(
        "p-4 sm:p-5 hover:bg-stone-800/50 transition-colors cursor-pointer",
        isOdd ? "bg-stone-800/20" : "bg-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Demo Slot / Status Icon */}
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl border",
          config.bgColor,
          config.borderColor
        )}>
          {submission.demo_slot ? (
            <span className={cn("font-display font-bold text-lg", config.color)}>
              {submission.demo_slot}
            </span>
          ) : (
            <StatusIcon className={cn("w-6 h-6", config.color)} />
          )}
        </div>

        {/* Submission Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-100 truncate">{submission.app_name}</h3>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                submission.scoring_status === 'completed'
                  ? "text-[#0b6d41] border-[#0b6d41]/50"
                  : submission.scoring_status === 'in_progress'
                    ? "text-[#ffde59] border-[#ffde59]/50"
                    : "text-stone-500 border-stone-600"
              )}
            >
              {config.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
            <span className="font-mono text-xs">{submission.submission_number}</span>
            <span className="text-stone-600">•</span>
            <span>{submission.category}</span>
          </div>
        </div>

        {/* Score Badge */}
        {submission.my_score !== null && (
          <div className="text-right hidden sm:block">
            <div className={cn(
              "text-xl font-bold font-display px-3 py-1 rounded-full",
              submission.scoring_status === 'completed'
                ? "bg-[#0b6d41] text-white"
                : "bg-stone-700 text-stone-200"
            )}>
              {submission.my_score.toFixed(1)}
            </div>
          </div>
        )}

        {/* Action Arrow */}
        <ChevronRight className={cn(
          "w-5 h-5 transition-colors",
          submission.scoring_status === 'completed'
            ? "text-[#0b6d41]"
            : "text-stone-500"
        )} />
      </div>
    </div>
  )
}
