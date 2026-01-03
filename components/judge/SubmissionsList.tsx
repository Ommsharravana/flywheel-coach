'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  Circle,
  Award,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import type { JudgeTrackWithSubmissions, JudgeSubmission } from '@/lib/supabase/types'

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
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Track Header */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
                {track.name}
              </h1>
              {judge_info.is_lead && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50">
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
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-stone-100">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Your Progress
            </div>
            <span className="text-lg font-display">
              {completedCount} / {totalCount}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-emerald-400">{completedCount}</div>
              <div className="text-xs text-stone-500">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{inProgressCount}</div>
              <div className="text-xs text-stone-500">In Progress</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-stone-400">
                {totalCount - completedCount - inProgressCount}
              </div>
              <div className="text-xs text-stone-500">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions List */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Clock className="w-5 h-5 text-amber-400" />
            Submissions to Score
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              No submissions assigned to this track yet.
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
                .map((submission) => (
                  <SubmissionRow
                    key={submission.submission_id}
                    submission={submission}
                    onClick={() => onSelectSubmission(submission.submission_id)}
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
}: {
  submission: JudgeSubmission
  onClick: () => void
}) {
  const statusConfig = {
    pending: {
      icon: Circle,
      label: 'Not Started',
      color: 'text-stone-500',
      bgColor: 'bg-stone-500/20',
    },
    in_progress: {
      icon: Clock,
      label: 'In Progress',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    completed: {
      icon: CheckCircle2,
      label: 'Completed',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
  }

  const config = statusConfig[submission.scoring_status]
  const StatusIcon = config.icon

  return (
    <div className="p-4 sm:p-5 hover:bg-stone-800/30 transition-colors">
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
          <StatusIcon className="w-5 h-5" />
        </div>

        {/* Submission Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {submission.demo_slot && (
              <Badge variant="outline" className="text-amber-400 border-amber-500/50 text-xs">
                #{submission.demo_slot}
              </Badge>
            )}
            <h3 className="font-semibold text-stone-100 truncate">{submission.app_name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-stone-500">
            <span>{submission.submission_number}</span>
            <span>-</span>
            <span>{submission.category}</span>
          </div>
        </div>

        {/* Score Badge */}
        {submission.my_score !== null && (
          <div className="text-right hidden sm:block">
            <div className="text-lg font-bold text-amber-400">
              {submission.my_score.toFixed(1)}
            </div>
            <div className="text-xs text-stone-500">Score</div>
          </div>
        )}

        {/* Action Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          className="text-stone-400 hover:text-amber-400 hover:bg-amber-500/10"
        >
          <span className="hidden sm:inline mr-1">
            {submission.scoring_status === 'completed' ? 'View' : 'Score'}
          </span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
