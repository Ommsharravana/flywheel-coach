import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FlywheelLogo } from '@/components/shared/FlywheelLogo'
import { EventSelector } from '@/components/events/EventSelector'
import { Database } from '@/lib/supabase/types'

type Cycle = Database['public']['Tables']['cycles']['Row']

const flywheelSteps = [
  { number: 1, name: 'Problem', description: 'Find a problem worth solving', status: 'current' },
  { number: 2, name: 'Context', description: 'Understand who, when, how painful', status: 'locked' },
  { number: 3, name: 'Value', description: 'Validate with desperate users', status: 'locked' },
  { number: 4, name: 'Workflow', description: 'Classify the AI workflow type', status: 'locked' },
  { number: 5, name: 'Prompt', description: 'Generate Lovable-ready prompt', status: 'locked' },
  { number: 6, name: 'Build', description: 'Create with Lovable AI', status: 'locked' },
  { number: 7, name: 'Deploy', description: 'Ship to real users', status: 'locked' },
  { number: 8, name: 'Impact', description: 'Measure and discover more', status: 'locked' },
]

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get effective user (respects impersonation)
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    redirect('/login')
  }

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
              Welcome back, {effectiveUser.name || 'Learner'}!
            </h1>
            <p className="mt-1 text-stone-400">
              {activeCycle
                ? `You're on Step ${activeCycle.current_step} of your cycle.`
                : 'Ready to start your next cycle?'
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
                Current Cycle: {activeCycle.name || 'Untitled'}
              </h2>
              <p className="text-sm text-stone-400">
                Started {new Date(activeCycle.started_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              asChild
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
            >
              <Link href={`/cycle/${activeCycle.id}/step/${activeCycle.current_step}`}>
                Continue
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
              Start a New Cycle
            </h2>
            <p className="mt-2 text-stone-400">
              Begin your journey from problem discovery to impact measurement.
              The AI coach will guide you through each step.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-orange-500/25"
            >
              <Link href="/cycle/new">Begin New Cycle</Link>
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
          <div className="mt-1 text-sm text-stone-400">Completed Cycles</div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="text-3xl font-bold text-amber-400">
            {activeCycle ? activeCycle.current_step : 0}
          </div>
          <div className="mt-1 text-sm text-stone-400">Current Step</div>
        </div>
        <div className="glass-card rounded-xl p-6">
          <div className="text-3xl font-bold text-amber-400">
            {completedCycles.reduce((acc, c) => acc + (c.impact_score || 0), 0)}
          </div>
          <div className="mt-1 text-sm text-stone-400">Total Impact Score</div>
        </div>
      </div>

      {/* Recent Cycles */}
      {completedCycles.length > 0 && (
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">
            Completed Cycles
          </h2>
          <div className="space-y-3">
            {completedCycles.slice(0, 5).map((cycle) => (
              <div
                key={cycle.id}
                className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 hover:bg-stone-800/70 transition-colors"
              >
                <div>
                  <h3 className="font-medium text-stone-100">
                    {cycle.name || 'Untitled Cycle'}
                  </h3>
                  <p className="text-sm text-stone-400">
                    Completed {cycle.completed_at ? new Date(cycle.completed_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-semibold">
                    {cycle.impact_score || 0} pts
                  </span>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cycle/${cycle.id}`}>View</Link>
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
