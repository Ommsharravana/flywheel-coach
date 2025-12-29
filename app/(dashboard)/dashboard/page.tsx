import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FlywheelLogo } from '@/components/shared/FlywheelLogo'
import { InstitutionPromptBanner } from '@/components/shared/InstitutionPromptBanner'
import { EventSelector } from '@/components/events/EventSelector'
import { Database } from '@/lib/supabase/types'
import { createTranslator } from '@/lib/i18n'
import type { Locale } from '@/lib/i18n/types'
import { ActiveCycleCard } from './ActiveCycleCard'
import { CompletedCyclesList } from './CompletedCyclesList'

type Cycle = Database['public']['Tables']['cycles']['Row']

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    redirect('/login')
  }

  // Get user's role and institution using RPC (bypasses RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roleData } = await (supabase as any)
    .rpc('get_user_role', { user_id: effectiveUser.id })

  const profile = (roleData as { role: string; institution_id: string | null }[] | null)?.[0] || null

  // Get language preference separately (this query should work with RLS)
  const { data: langData } = await supabase
    .from('users')
    .select('language')
    .eq('id', effectiveUser.id)
    .maybeSingle() as { data: { language: string | null } | null }

  const locale = ((langData?.language || 'en') as Locale)
  const t = createTranslator(locale)

  // Show institution prompt if no institution and not superadmin
  const needsInstitution = !profile?.institution_id && profile?.role !== 'superadmin'

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
      {/* Institution Prompt - Show if user needs to select institution */}
      {needsInstitution && (
        <InstitutionPromptBanner userName={effectiveUser.name} />
      )}

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
        <ActiveCycleCard
          cycleId={activeCycle.id}
          cycleName={activeCycle.name || ''}
          currentStep={activeCycle.current_step}
          startedAt={activeCycle.started_at}
          flywheelSteps={flywheelSteps}
          locale={locale}
          translations={{
            currentCycle: t('dashboard.currentCycle'),
            untitledCycle: t('dashboard.untitledCycle'),
            started: t('dashboard.started'),
            continue: t('common.continue'),
          }}
        />
      ) : (
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
          <div className="mx-auto max-w-md">
            <h2 className="font-display text-xl font-semibold text-stone-100">
              {t('dashboard.startNewCycle')}
            </h2>
            <p className="mt-2 text-stone-400">
              {t('dashboard.beginJourney')}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25"
              >
                <Link href="/cycle/new">{t('dashboard.beginNewCycle')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-stone-600 text-stone-200 hover:bg-stone-800 hover:text-stone-100"
              >
                <Link href="/appathon/problems">Browse Problem Bank</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-stone-500">
              💡 Or fork a validated problem from the Problem Bank
            </p>
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
      <CompletedCyclesList
        cycles={completedCycles}
        locale={locale}
        translations={{
          completedCycles: t('dashboard.completedCycles'),
          untitledCycle: t('dashboard.untitledCycle'),
          completed: t('dashboard.completed'),
          notAvailable: t('common.notAvailable'),
          pts: t('common.pts'),
          view: t('common.view'),
        }}
      />
    </div>
  )
}
