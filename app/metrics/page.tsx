import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Users,
  Target,
  Rocket,
  BarChart3,
  CheckCircle,
  Building,
  Lightbulb,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react';

interface PlatformStats {
  totalBuilders: number;
  totalCycles: number;
  completedCycles: number;
  totalProblems: number;
  totalDeployedApps: number;
  totalUsersServed: number;
  totalInstitutions: number;
  avgImpactScore: number;
}

async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();

  // Total builders (users with builder role or who have started cycles)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: buildersCount } = await (supabase as any)
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Total cycles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: cyclesCount } = await (supabase as any)
    .from('cycles')
    .select('*', { count: 'exact', head: true });

  // Completed cycles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: completedCount } = await (supabase as any)
    .from('cycles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Total problems in problem bank
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: problemsCount } = await (supabase as any)
    .from('problem_bank')
    .select('*', { count: 'exact', head: true });

  // Deployed apps (cycles with deployed_url in builds)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: deployedCount } = await (supabase as any)
    .from('builds')
    .select('*', { count: 'exact', head: true })
    .not('deployed_url', 'is', null);

  // Total users served (sum of total_users from impact_assessments)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: impactData } = await (supabase as any)
    .from('impact_assessments')
    .select('total_users, impact_score');

  interface ImpactRow {
    total_users: number | null;
    impact_score: number | null;
  }

  const totalUsersServed = (impactData as ImpactRow[] || []).reduce(
    (sum: number, ia: ImpactRow) => sum + (ia.total_users || 0),
    0
  );

  const avgImpactScore = (impactData as ImpactRow[] || []).length > 0
    ? (impactData as ImpactRow[]).reduce((sum: number, ia: ImpactRow) => sum + (ia.impact_score || 0), 0) /
      (impactData as ImpactRow[]).length
    : 0;

  // Total institutions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: institutionsCount } = await (supabase as any)
    .from('institutions')
    .select('*', { count: 'exact', head: true });

  return {
    totalBuilders: buildersCount || 0,
    totalCycles: cyclesCount || 0,
    completedCycles: completedCount || 0,
    totalProblems: problemsCount || 0,
    totalDeployedApps: deployedCount || 0,
    totalUsersServed,
    totalInstitutions: institutionsCount || 0,
    avgImpactScore: Math.round(avgImpactScore * 10) / 10,
  };
}

export default async function PublicMetricsPage() {
  const stats = await getPlatformStats();

  const completionRate = stats.totalCycles > 0
    ? Math.round((stats.completedCycles / stats.totalCycles) * 100)
    : 0;

  const keyMetrics = [
    {
      label: 'Total Builders',
      value: stats.totalBuilders.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Learners building with AI',
    },
    {
      label: 'Apps Deployed',
      value: stats.totalDeployedApps.toLocaleString(),
      icon: Rocket,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: 'Live solutions serving users',
    },
    {
      label: 'Users Served',
      value: stats.totalUsersServed.toLocaleString(),
      icon: Globe,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: 'People impacted by solutions',
    },
    {
      label: 'Problems Solved',
      value: stats.completedCycles.toLocaleString(),
      icon: CheckCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
      description: 'Complete problem-to-impact cycles',
    },
  ];

  const secondaryMetrics = [
    {
      label: 'Problem Bank',
      value: stats.totalProblems.toLocaleString(),
      icon: Lightbulb,
      description: 'Community-submitted problems',
    },
    {
      label: 'Institutions',
      value: stats.totalInstitutions.toLocaleString(),
      icon: Building,
      description: 'Participating colleges',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: Target,
      description: 'Cycles fully completed',
    },
    {
      label: 'Avg Impact Score',
      value: stats.avgImpactScore.toFixed(1),
      icon: BarChart3,
      description: 'Average solution impact',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-950">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 text-amber-400 border-amber-500/30 bg-amber-500/10">
            <TrendingUp className="h-3 w-3 mr-1" />
            Live Platform Metrics
          </Badge>

          <h1 className="text-4xl md:text-5xl font-display font-bold text-stone-100 mb-4">
            Platform <span className="text-amber-400">Impact</span>
          </h1>

          <p className="text-lg text-stone-400 max-w-2xl mx-auto mb-8">
            Real-time metrics from JKKN Solution Studio.
            See how learners are building solutions that create real impact.
          </p>
        </div>
      </section>

      {/* Primary Metrics Grid */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {keyMetrics.map((metric) => (
              <Card key={metric.label} className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                      <metric.icon className={`h-6 w-6 ${metric.color}`} />
                    </div>
                  </div>
                  <div className={`text-3xl md:text-4xl font-bold ${metric.color} mb-1`}>
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-stone-100">{metric.label}</div>
                  <div className="text-xs text-stone-500 mt-1">{metric.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Metrics */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-semibold text-stone-100 mb-6 text-center">Platform Health</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {secondaryMetrics.map((metric) => (
              <Card key={metric.label} className="bg-stone-900/30 border-stone-800">
                <CardContent className="pt-6 text-center">
                  <metric.icon className="h-6 w-6 text-stone-500 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-stone-100 mb-1">{metric.value}</div>
                  <div className="text-sm text-stone-400">{metric.label}</div>
                  <div className="text-xs text-stone-600 mt-1">{metric.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Highlight */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-amber-400" />
              </div>
              <CardTitle className="text-2xl text-stone-100">
                From Problem to Impact
              </CardTitle>
              <CardDescription className="text-stone-400 max-w-xl mx-auto">
                Every number represents a real learner who identified a problem,
                built a solution with AI, deployed it, and created measurable impact.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-8">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/showcase">
                  <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                    See Projects
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/february-challenge">
                  <Button variant="outline" className="border-stone-700 text-stone-200 hover:bg-stone-800">
                    Join Next Challenge
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="px-4 pb-16 bg-stone-900/30">
        <div className="max-w-6xl mx-auto py-12">
          <h2 className="text-2xl font-bold text-center text-stone-100 mb-4">
            The Problem-to-Impact Flywheel
          </h2>
          <p className="text-center text-stone-400 mb-8 max-w-2xl mx-auto">
            Our methodology guides learners through 8 steps from problem discovery to measurable impact
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: 1, name: 'Problem Discovery', desc: 'Identify a real problem worth solving' },
              { step: 2, name: 'Context Discovery', desc: 'Understand who, when, and how painful' },
              { step: 3, name: 'Value Discovery', desc: 'Validate real demand with users' },
              { step: 4, name: 'Workflow Classification', desc: 'Match solution to optimal pattern' },
              { step: 5, name: 'Prompt Generation', desc: 'Create AI-ready build instructions' },
              { step: 6, name: 'Building', desc: 'Build with AI tools like Lovable' },
              { step: 7, name: 'Deployment', desc: 'Launch to real users' },
              { step: 8, name: 'Impact Discovery', desc: 'Measure and prove impact' },
            ].map((item) => (
              <Card key={item.step} className="bg-stone-900/50 border-stone-800">
                <CardContent className="pt-6 text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
                    <span className="text-amber-400 font-bold">{item.step}</span>
                  </div>
                  <div className="font-medium text-stone-100 text-sm mb-1">{item.name}</div>
                  <div className="text-xs text-stone-500">{item.desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-stone-100 mb-4">
            Be Part of the Impact
          </h2>
          <p className="text-stone-400 mb-6">
            Join the community of builders creating solutions that matter.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                Start Building
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="border-stone-700 text-stone-200 hover:bg-stone-800">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-stone-800">
        <div className="max-w-6xl mx-auto text-center text-stone-500 text-sm">
          <p>Powered by JKKN Solution Studio</p>
          <p className="mt-2">
            <Link href="/terms" className="hover:text-stone-300">Terms</Link>
            {' · '}
            <Link href="/privacy" className="hover:text-stone-300">Privacy</Link>
            {' · '}
            <Link href="/showcase" className="hover:text-stone-300">Showcase</Link>
            {' · '}
            <Link href="/" className="hover:text-stone-300">Home</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
