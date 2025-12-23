import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FlywheelLogo } from '@/components/shared/FlywheelLogo'
import { EventSelector } from '@/components/events/EventSelector'
import { Database } from '@/lib/supabase/types'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    redirect('/login')
  }

  // Get user's language preference
  const { data: userData } = await supabase
    .from('users')
    .select('language')
    .eq('id', effectiveUser.id)
    .single() as { data: { language: string | null } | null }

  const locale = (userData?.language as Locale) || 'en'
  const t = createTranslator(locale)

  // Define flywheel steps with translated descriptions
  const flywheelSteps = [
    { number: 1, name: t('steps.problem.name'), description: t('steps.problem.description'), status: 'current' },
    { number: 2, name: t('steps.context.name'), description: t('steps.context.description'), status: 'locked' },
    { number: 3, name: t('steps.value.name'), description: t('steps.value.description'), status: 'locked' },
    { number: 4, name: t('steps.workflow.name'), description: t('steps.workflow.description'), status: 'locked' },
    { number: 5, name: t('steps.prompt.name'), description: t('steps.prompt.description'), status: 'locked' },
    { number: 6, name: t('steps.build.name'), description: t('steps.build.description'), status: 'locked' },
    { number: 7, name: t('steps.deploy.name'), description: t('steps.deploy.description'), status: 'locked' },
    { number: 8, name: t('steps.impact.name'), description: t('steps.impact.description'), status: 'locked' },
  ]

  // Get user's cycles using effective user ID
  const { data } = await supabase
    .from('cycles')
    .select('*')
    .eq('user_id', effectiveUser.id)
    .order('created_at', { ascending: false })

  const cycles = data as Cycle[] | null
  const activeCycle = cycles?.find(c => c.status === 'active')
  const completedCycles = cycles?.filter(c => c.status === 'completed') || []

  return (
    <div className="space-y-8">
      {/* Events Section - First thing users see */}
      <EventSelector />

      {/* Welcome Section */}
      <div className="glass-card rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          <FlywheelLogo size="lg" animate />
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-100">
              {t('dashboard.welcomeWithName', { name: effectiveUser.name || t('common.learner') })}
            </h1>
            <p className="mt-1 text-stone-400">
              {activeCycle
                ? t('dashboard.currentStepInfo', { step: activeCycle.current_step })
                : t('dashboard.readyToStart')
              }
            </p>
          </div>
        </div>
      </div>

      {/* Active Cycle or Start New */}
      {activeCycle ? (
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-semibold text-stone-100">
                {t('dashboard.currentCycle')}: {activeCycle.name || t('dashboard.untitledCycle')}
              </h2>
              <p className="text-sm text-stone-400">
                {t('dashboard.started')} {new Date(activeCycle.started_at).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US')}
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
            >
              <Link href={`/cycle/${activeCycle.id}/step/${activeCycle.current_step}`}>
                {t('common.continue')}
              </Link>
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {flywheelSteps.map((step) => {
              const isCompleted = step.number < activeCycle.current_step
              const isCurrent = step.number === activeCycle.current_step

              return (
                <div
                  key={step.number}
                  className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
                    isCompleted
                      ? 'bg-amber-500/20'
                      : isCurrent
                      ? 'bg-gradient-to-br from-amber-500/30 to-orange-600/30 ring-2 ring-amber-500/50'
                      : 'bg-stone-800/50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isCompleted
                        ? 'bg-amber-500 text-stone-950'
                        : isCurrent
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950'
                        : 'bg-stone-700 text-stone-400'
                    }`}
                  >
                    {isCompleted ? '✓' : step.number}
                  </div>
                  <span className={`mt-2 text-xs text-center ${
                    isCompleted || isCurrent ? 'text-stone-200' : 'text-stone-500'
                  }`}>
                    {step.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
          <div className="mx-auto max-w-md">
            <h2 className="font-display text-xl font-semibold text-stone-100">
              {t('dashboard.startNewCycle')}
            </h2>
            <p className="mt-2 text-stone-400">
              {t('dashboard.beginJourney')}
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25"
            >
              <Link href="/cycle/new">{t('dashboard.beginNewCycle')}</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-6">
          <div className="text-3xl font-bold text-amber-400">
            {completedCycles.length}
          </div>
          <div className="mt-1 text-sm text-stone-400">{t('dashboard.completedCycles')}</div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="text-3xl font-bold text-amber-400">
            {activeCycle ? activeCycle.current_step : 0}
          </div>
          <div className="mt-1 text-sm text-stone-400">{t('dashboard.currentStep')}</div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="text-3xl font-bold text-amber-400">
            {completedCycles.reduce((acc, c) => acc + (c.impact_score || 0), 0)}
          </div>
          <div className="mt-1 text-sm text-stone-400">{t('dashboard.totalImpactScore')}</div>
        </div>
      </div>

      {/* Recent Cycles */}
      {completedCycles.length > 0 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">
            {t('dashboard.completedCycles')}
          </h2>
          <div className="space-y-3">
            {completedCycles.slice(0, 5).map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 hover:bg-stone-800/70 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-stone-100">
                    {cycle.name || t('dashboard.untitledCycle')}
                  </h3>
                  <p className="text-sm text-stone-400">
                    {t('dashboard.completed')} {cycle.completed_at ? new Date(cycle.completed_at).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US') : t('common.notAvailable')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">
                    {cycle.impact_score || 0} {t('common.pts')}
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cycle/${cycle.id}`}>{t('common.view')}</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
