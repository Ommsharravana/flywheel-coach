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
} from 'lucide-react'
import { useSubmissionScore } from '@/lib/judge/hooks'
import { JUDGING_CRITERIA, BONUS_CRITERIA } from '@/lib/appathon/content'

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

      {/* Submission Info */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Target className="w-5 h-5 text-amber-400" />
            {submission.app_name}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <span>{submission.submission_number}</span>
            <span>-</span>
            <Badge variant="outline" className="text-stone-400 border-stone-600">
              {submission.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {submission.problem_statement && (
            <div>
              <Label className="text-stone-500 text-xs uppercase tracking-wider">
                Problem Statement
              </Label>
              <p className="mt-1 text-stone-300 text-sm leading-relaxed">
                {submission.problem_statement}
              </p>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {submission.app_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-amber-400 border-amber-500/50 hover:bg-amber-500/10"
              >
                <a
                  href={submission.app_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  View App
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            )}
            {submission.video_url && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-amber-400 border-amber-500/50 hover:bg-amber-500/10"
              >
                <a
                  href={submission.video_url}
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

      {/* Scoring Criteria */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Star className="w-5 h-5 text-amber-400" />
            Scoring Criteria
          </CardTitle>
          <p className="text-sm text-stone-500">
            Rate each criterion from 1 (lowest) to 10 (highest)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {judgeableCriteria.map((criterion) => {
            const Icon = CRITERIA_ICONS[criterion.name] || Target
            const fieldName = CRITERIA_FIELDS[criterion.name]
            const value = score[fieldName as keyof typeof score] as number | null

            return (
              <div key={criterion.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-stone-200">
                      {criterion.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs text-stone-500 border-stone-600"
                    >
                      {criterion.weight}%
                    </Badge>
                  </div>
                  <span className="text-2xl font-bold text-amber-400 w-12 text-right font-display">
                    {value ?? '-'}
                  </span>
                </div>
                <p className="text-xs text-stone-500">{criterion.description}</p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-stone-500 w-4">1</span>
                  <Slider
                    value={value !== null ? [value] : [5]}
                    min={1}
                    max={10}
                    step={1}
                    disabled={isSubmitted}
                    onValueChange={([newValue]) => {
                      updateField(fieldName as 'problem_impact' | 'solution_innovation' | 'working_prototype' | 'user_validation' | 'presentation_quality' | 'bioconvergence_alignment', newValue)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-stone-500 w-4">10</span>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Bonus Criteria */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-100">
            <Star className="w-5 h-5 text-emerald-400" />
            Bonus Criteria
          </CardTitle>
          <p className="text-sm text-stone-500">
            Check applicable bonuses (adds percentage to final score)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {BONUS_CRITERIA.map((bonus) => {
            const fieldName = BONUS_FIELDS[bonus.name]
            const checked = score[fieldName as keyof typeof score] as boolean

            return (
              <div
                key={bonus.name}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-stone-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={fieldName}
                    checked={checked}
                    disabled={isSubmitted}
                    onCheckedChange={(value) => {
                      updateField(fieldName as 'bonus_cross_disciplinary' | 'bonus_cross_institutional' | 'bonus_first_year' | 'bonus_user_testimonials', Boolean(value))
                    }}
                    className="border-stone-600 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <div>
                    <Label
                      htmlFor={fieldName}
                      className="text-stone-200 cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-lg">{bonus.icon}</span>
                      {bonus.name}
                    </Label>
                    <p className="text-xs text-stone-500">{bonus.description}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-emerald-400 border-emerald-500/50"
                >
                  +{bonus.points}%
                </Badge>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card className="glass-card border-stone-700">
        <CardHeader>
          <CardTitle className="text-stone-100">Judge Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="strengths" className="text-stone-300">
              Strengths
            </Label>
            <Textarea
              id="strengths"
              placeholder="What did the team do well?"
              value={score.strengths || ''}
              disabled={isSubmitted}
              onChange={(e) => updateField('strengths', e.target.value)}
              className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="improvements" className="text-stone-300">
              Areas for Improvement
            </Label>
            <Textarea
              id="improvements"
              placeholder="What could be better?"
              value={score.improvements || ''}
              disabled={isSubmitted}
              onChange={(e) => updateField('improvements', e.target.value)}
              className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600"
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="notes" className="text-stone-300">
              Additional Notes (Private)
            </Label>
            <Textarea
              id="notes"
              placeholder="Any other observations..."
              value={score.notes || ''}
              disabled={isSubmitted}
              onChange={(e) => updateField('notes', e.target.value)}
              className="mt-1 bg-stone-800/50 border-stone-700 text-stone-200 placeholder:text-stone-600"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Calculated Score Preview */}
      <Card className="glass-card border-amber-500/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="text-stone-500 text-sm">Calculated Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-amber-400 font-display">
                  {score.total_score?.toFixed(1) || '-'}
                </span>
                <span className="text-stone-500">/ 100</span>
              </div>
              {score.bonus_percentage && score.bonus_percentage > 0 && (
                <p className="text-xs text-emerald-400 mt-1">
                  Includes +{score.bonus_percentage}% bonus
                </p>
              )}
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={onBack}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={handleSubmitClick}
                disabled={!isComplete || isSubmitted || submitting}
                className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitted ? 'Submitted' : 'Submit Score'}
              </Button>
            </div>
          </div>
          {!isComplete && !isSubmitted && (
            <p className="text-xs text-amber-400 mt-3">
              Complete all scoring criteria before submitting
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
