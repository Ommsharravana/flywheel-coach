'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft,
  Save,
  Send,
  ExternalLink,
  Video,
  Globe,
  Target,
  Lightbulb,
  Wrench,
  Users,
  Presentation,
  Dna,
  Star,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useSubmissionScore } from '@/lib/judge/hooks'
import { JUDGING_CRITERIA, BONUS_CRITERIA } from '@/lib/appathon/content'
import { InlineHelpTooltip } from '@/components/shared/HelpTooltip'
import { Walkthrough } from '@/components/shared/Walkthrough'
import { JUDGE_SCORING_WALKTHROUGH } from '@/lib/help/walkthroughs'
import { HELP_CONTENT } from '@/lib/help/content'
import { cn } from '@/lib/utils'

interface ScoringFormProps {
  submissionId: string
  onBack: () => void
}

const CRITERIA_ICONS: Record<string, typeof Target> = {
  'Problem Impact': Target,
  'Solution Innovation': Lightbulb,
  'Working Prototype': Wrench,
  'User Validation': Users,
  'Presentation Quality': Presentation,
  'Bioconvergence Alignment': Dna,
}

const CRITERIA_FIELDS: Record<string, string> = {
  'Problem Impact': 'problem_impact',
  'Solution Innovation': 'solution_innovation',
  'Working Prototype': 'working_prototype',
  'User Validation': 'user_validation',
  'Presentation Quality': 'presentation_quality',
  'Bioconvergence Alignment': 'bioconvergence_alignment',
}

const BONUS_FIELDS: Record<string, string> = {
  'Cross-disciplinary team': 'bonus_cross_disciplinary',
  'Cross-institutional team': 'bonus_cross_institutional',
  'First-year participation': 'bonus_first_year',
  'User testimonials': 'bonus_user_testimonials',
}

export function ScoringForm({ submissionId, onBack }: ScoringFormProps) {
  const {
    score,
    submission,
    loading,
    saving,
    error,
    updateField,
    handleSubmit,
    isComplete,
    isSubmitted,
  } = useSubmissionScore(submissionId)

  const [submitting, setSubmitting] = useState(false)
  const [notesExpanded, setNotesExpanded] = useState(false)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    )
  }

  if (!submission || !score) {
    return null
  }

  const handleSubmitClick = async () => {
    setSubmitting(true)
    const success = await handleSubmit()
    setSubmitting(false)
    if (success) {
      onBack()
    }
  }

  // Filter criteria to exclude Audience Score (judges don't score that)
  const judgeableCriteria = JUDGING_CRITERIA.filter(
    (c) => c.name !== 'Audience Score'
  )

  return (
    <>
      {/* Walkthrough Guide */}
      <Walkthrough id="judge-scoring" steps={JUDGE_SCORING_WALKTHROUGH} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-stone-400 hover:text-stone-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>
        <div className="flex-1" />
        {saving && (
          <Badge variant="outline" className="text-amber-400 border-amber-500/50">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Saving...
          </Badge>
        )}
        {isSubmitted && (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        )}
      </div>

      {/* Submission Info - Clean Header */}
      <Card className="glass-card border-[#0b6d41]/30" data-walkthrough="submission-info">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-stone-100 text-xl">
                {submission.app_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1.5 text-sm text-stone-500">
                <Badge variant="outline" className="text-[#0b6d41] border-[#0b6d41]/50 bg-[#0b6d41]/10">
                  {submission.category}
                </Badge>
                <span className="text-stone-600">•</span>
                <span className="font-mono text-xs">{submission.submission_number}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {submission.problem_statement && (
            <div className="p-3 rounded-lg bg-stone-800/30 border border-stone-700/50">
              <Label className="text-stone-500 text-xs uppercase tracking-wider">
                Problem Statement
              </Label>
              <p className="mt-1.5 text-stone-300 text-sm leading-relaxed">
                {submission.problem_statement}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {submission.live_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-[#0b6d41] border-[#0b6d41]/50 hover:bg-[#0b6d41]/10"
              >
                <a
                  href={submission.live_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Try Live App
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
            {submission.demo_video_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-[#0b6d41] border-[#0b6d41]/50 hover:bg-[#0b6d41]/10"
              >
                <a
                  href={submission.demo_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Watch Demo
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scoring Criteria - NASA Mission Control Style */}
      <Card className="glass-card border-[#0b6d41]/30" data-walkthrough="criteria-section">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Star className="w-5 h-5 text-[#0b6d41]" />
            Scoring Criteria
          </CardTitle>
          <p className="text-sm text-stone-500">
            Rate each criterion from 1 (lowest) to 10 (highest)
          </p>
        </CardHeader>
        <CardContent className="space-y-1">
          {judgeableCriteria.map((criterion, index) => {
            const Icon = CRITERIA_ICONS[criterion.name] || Target
            const fieldName = CRITERIA_FIELDS[criterion.name]
            const value = score[fieldName as keyof typeof score] as number | null
            const helpKey = fieldName as keyof typeof HELP_CONTENT.criteria
            const helpContent = HELP_CONTENT.criteria[helpKey]

            return (
              <div
                key={criterion.name}
                className={cn(
                  "p-4 rounded-lg transition-colors",
                  index % 2 === 0 ? "bg-stone-800/30" : "bg-transparent"
                )}
                data-walkthrough={index === 0 ? 'first-criterion' : undefined}
              >
                {/* Criterion Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className="w-4 h-4 text-[#0b6d41]" />
                    <span className="font-medium text-stone-200">
                      {criterion.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs text-[#0b6d41] border-[#0b6d41]/50 bg-[#0b6d41]/10"
                    >
                      {criterion.weight}%
                    </Badge>
                    {helpContent && (
                      <InlineHelpTooltip
                        title={helpContent.title}
                        content={helpContent.description}
                      />
                    )}
                  </div>
                  {/* Score Display - Large Pill */}
                  <div className={cn(
                    "flex items-center justify-center min-w-[3.5rem] h-10 rounded-full font-display text-xl font-bold transition-colors",
                    value !== null
                      ? "bg-[#0b6d41] text-white"
                      : "bg-stone-700 text-stone-400"
                  )}>
                    {value ?? '-'}
                  </div>
                </div>

                {/* Slider with JKKN Green */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-500 w-4 text-center">1</span>
                  <div className="flex-1 relative py-2">
                    <Slider
                      value={value !== null ? [value] : [5]}
                      min={1}
                      max={10}
                      step={1}
                      disabled={isSubmitted}
                      onValueChange={([newValue]) => {
                        updateField(fieldName as 'problem_impact' | 'solution_innovation' | 'working_prototype' | 'user_validation' | 'presentation_quality' | 'bioconvergence_alignment', newValue)
                      }}
                      className="[&_[data-slot=slider-track]]:h-2.5 [&_[data-slot=slider-range]]:bg-[#0b6d41] [&_[data-slot=slider-thumb]]:size-6 [&_[data-slot=slider-thumb]]:border-[#0b6d41] [&_[data-slot=slider-thumb]]:border-2"
                    />
                    {/* Score ticks */}
                    <div className="absolute inset-x-0 top-full flex justify-between px-1 mt-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
                        <div
                          key={tick}
                          className={cn(
                            "w-0.5 h-1.5 rounded-full transition-colors",
                            value !== null && tick <= value
                              ? "bg-[#0b6d41]/60"
                              : "bg-stone-600/40"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-stone-500 w-4 text-center">10</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Bonus Criteria - Horizontal 2x2 Grid */}
      <Card className="glass-card border-[#ffde59]/30" data-walkthrough="bonus-section">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Star className="w-5 h-5 text-[#ffde59]" />
            Bonus Points
          </CardTitle>
          <p className="text-sm text-stone-500">
            Check applicable bonuses
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BONUS_CRITERIA.map((bonus) => {
              const fieldName = BONUS_FIELDS[bonus.name]
              const checked = score[fieldName as keyof typeof score] as boolean
              const bonusKey = fieldName.replace('bonus_', '') as keyof typeof HELP_CONTENT.bonus
              const helpContent = HELP_CONTENT.bonus[bonusKey]

              return (
                <div
                  key={bonus.name}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                    checked
                      ? "bg-[#ffde59]/10 border-[#ffde59]/50"
                      : "bg-stone-800/30 border-stone-700 hover:border-stone-600"
                  )}
                  onClick={() => {
                    if (!isSubmitted) {
                      updateField(fieldName as 'bonus_cross_disciplinary' | 'bonus_cross_institutional' | 'bonus_first_year' | 'bonus_user_testimonials', !checked)
                    }
                  }}
                >
                  <Checkbox
                    id={fieldName}
                    checked={checked}
                    disabled={isSubmitted}
                    onCheckedChange={(value) => {
                      updateField(fieldName as 'bonus_cross_disciplinary' | 'bonus_cross_institutional' | 'bonus_first_year' | 'bonus_user_testimonials', Boolean(value))
                    }}
                    className="border-stone-600 data-[state=checked]:bg-[#ffde59] data-[state=checked]:border-[#ffde59] data-[state=checked]:text-stone-900"
                  />
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor={fieldName}
                      className="text-stone-200 cursor-pointer flex items-center gap-1.5 text-sm"
                    >
                      <span>{bonus.icon}</span>
                      <span className="truncate">{bonus.name}</span>
                      {helpContent && (
                        <InlineHelpTooltip
                          title={helpContent.title}
                          content={helpContent.description}
                        />
                      )}
                    </Label>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-xs",
                      checked
                        ? "text-[#ffde59] border-[#ffde59]/50 bg-[#ffde59]/10"
                        : "text-stone-400 border-stone-600"
                    )}
                  >
                    +{bonus.points}%
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes - Collapsible Section */}
      <Card className="glass-card border-stone-700" data-walkthrough="notes-section">
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setNotesExpanded(!notesExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-stone-100">
            <span className="flex items-center gap-2">
              Judge Notes
              {(score.strengths || score.improvements || score.notes) && (
                <Badge variant="outline" className="text-xs text-[#0b6d41] border-[#0b6d41]/50">
                  Has notes
                </Badge>
              )}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400">
              {notesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
          <p className="text-sm text-stone-500">
            {notesExpanded ? "Click to collapse" : "Optional feedback for the team"}
          </p>
        </CardHeader>
        {notesExpanded && (
          <CardContent className="space-y-4 pt-0">
            <div>
              <Label htmlFor="strengths" className="text-stone-300 text-sm">
                Strengths
              </Label>
              <Textarea
                id="strengths"
                placeholder="What did the team do well?"
                value={score.strengths || ''}
                disabled={isSubmitted}
                onChange={(e) => updateField('strengths', e.target.value)}
                className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600 focus:border-[#0b6d41] focus:ring-[#0b6d41]/20"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="improvements" className="text-stone-300 text-sm">
                Areas for Improvement
              </Label>
              <Textarea
                id="improvements"
                placeholder="What could be better?"
                value={score.improvements || ''}
                disabled={isSubmitted}
                onChange={(e) => updateField('improvements', e.target.value)}
                className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600 focus:border-[#0b6d41] focus:ring-[#0b6d41]/20"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="notes" className="text-stone-300 text-sm flex items-center gap-2">
                Additional Notes
                <Badge variant="outline" className="text-xs text-stone-500 border-stone-600">
                  Private
                </Badge>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any other observations..."
                value={score.notes || ''}
                disabled={isSubmitted}
                onChange={(e) => updateField('notes', e.target.value)}
                className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600 focus:border-[#0b6d41] focus:ring-[#0b6d41]/20"
                rows={2}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Score Preview Footer - Sticky on Mobile */}
      <Card className="glass-card border-[#0b6d41]/50 bg-stone-900/95 backdrop-blur-sm sm:sticky sm:bottom-4" data-walkthrough="submit-section">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            {/* Score Breakdown */}
            <div className="flex items-center gap-6 flex-1">
              {/* Base Score */}
              <div className="text-center">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Base</p>
                <p className="text-2xl font-bold text-stone-200 font-display">
                  {score.total_score && score.bonus_percentage
                    ? (score.total_score / (1 + score.bonus_percentage / 100)).toFixed(1)
                    : score.total_score?.toFixed(1) || '-'}
                </p>
              </div>

              {/* Bonus */}
              {score.bonus_percentage !== null && score.bonus_percentage > 0 && (
                <>
                  <div className="text-[#ffde59] text-xl font-bold">+</div>
                  <div className="text-center">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Bonus</p>
                    <p className="text-2xl font-bold text-[#ffde59] font-display">
                      {score.bonus_percentage}%
                    </p>
                  </div>
                  <div className="text-stone-500 text-xl">=</div>
                </>
              )}

              {/* Total Score */}
              <div className="text-center">
                <p className="text-xs text-stone-500 uppercase tracking-wider">Total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#0b6d41] font-display">
                    {score.total_score?.toFixed(1) || '-'}
                  </span>
                  <span className="text-stone-500 text-sm">/100</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 sm:flex-none border-stone-600 hover:bg-stone-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={!isComplete || isSubmitted || submitting}
                className={cn(
                  "flex-1 sm:flex-none font-semibold",
                  isSubmitted
                    ? "bg-stone-700 text-stone-400"
                    : "bg-[#0b6d41] hover:bg-[#095a36] text-white"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : isSubmitted ? (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitted ? 'Submitted' : 'Submit'}
              </Button>
            </div>
          </div>

          {/* Incomplete Warning */}
          {!isComplete && !isSubmitted && (
            <div className="mt-3 flex items-center gap-2 text-amber-400">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-xs">
                Score all criteria to submit
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  )
}
