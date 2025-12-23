'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/shared/Header';
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Plus,
  Rocket,
  Target,
  Trophy,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface CompletedCycle {
  id: string;
  name: string;
  status: string;
  current_step: number;
  created_at: string;
  completed_at: string | null;
  problem: {
    statement: string;
    refined_statement: string | null;
  } | null;
  build: {
    project_url: string | null;
    lovable_url: string | null;
    screenshot_url: string | null;
  } | null;
  impact: {
    total_users: number;
    time_before: number;
    time_after: number;
    nps_score: number;
    impact_score: number;
  } | null;
  workflow: {
    workflow_type: string;
  } | null;
}

export default function PortfolioPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState<CompletedCycle[]>([]);
  const [stats, setStats] = useState({
    totalCycles: 0,
    completedCycles: 0,
    totalUsersReached: 0,
    totalTimeSaved: 0,
  });

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check for impersonation - use impersonated user's ID if active
      let effectiveUserId = user.id;
      try {
        const impersonationRes = await fetch('/api/admin/impersonate');
        const impersonationData = await impersonationRes.json();
        if (impersonationData.isImpersonating && impersonationData.targetUser?.id) {
          effectiveUserId = impersonationData.targetUser.id;
        }
      } catch {
        // Ignore impersonation check errors
      }

      // Load all cycles with related data
      const { data: cyclesData, error } = await supabase
        .from('cycles')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load related data for each cycle
      const enrichedCycles: CompletedCycle[] = [];
      let totalUsers = 0;
      let totalTimeSaved = 0;

      for (const cycle of cyclesData || []) {
        // Get problem
        const { data: problem } = await supabase
          .from('problems')
          .select('selected_question, refined_statement')
          .eq('cycle_id', cycle.id)
          .single();

        // Get build
        const { data: build } = await supabase
          .from('builds')
          .select('project_url, lovable_url, screenshot_url')
          .eq('cycle_id', cycle.id)
          .single();

        // Get impact
        const { data: impact } = await supabase
          .from('impact_assessments')
          .select('total_users, time_before, time_after, nps_score, impact_score')
          .eq('cycle_id', cycle.id)
          .single();

        // Get workflow
        const { data: workflow } = await supabase
          .from('workflow_classifications')
          .select('workflow_type')
          .eq('cycle_id', cycle.id)
          .single();

        if (impact) {
          totalUsers += impact.total_users || 0;
          // time_before and time_after are TEXT fields like "210 minutes"
          // Parse the numeric part for calculation
          const parseTime = (t: string | number | null): number => {
            if (typeof t === 'number') return t;
            if (typeof t === 'string') {
              const match = t.match(/(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            }
            return 0;
          };
          const timeBefore = parseTime(impact.time_before);
          const timeAfter = parseTime(impact.time_after);
          totalTimeSaved += (timeBefore - timeAfter) * (impact.total_users || 0);
        }

        enrichedCycles.push({
          id: cycle.id,
          name: cycle.name,
          status: cycle.status,
          current_step: cycle.current_step,
          created_at: cycle.created_at,
          completed_at: cycle.completed_at,
          problem: problem ? {
            statement: problem.selected_question,
            refined_statement: problem.refined_statement,
          } : null,
          build: build,
          impact: impact,
          workflow: workflow,
        });
      }

      setCycles(enrichedCycles);
      setStats({
        totalCycles: enrichedCycles.length,
        completedCycles: enrichedCycles.filter(c => c.status === 'completed').length,
        totalUsersReached: totalUsers,
        totalTimeSaved: Math.round(totalTimeSaved / 60), // Convert to hours
      });
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowEmoji = (type: string | undefined) => {
    const emojis: Record<string, string> = {
      'GENERATION': '📝',
      'EXTRACTION': '📊',
      'ORCHESTRATION': '✅',
      'MONITORING': '🔔',
      'CLASSIFICATION': '🔍',
      'SYNTHESIS': '📈',
      'TRANSFORMATION': '📁',
      'AUDIT': '📦',
    };
    return emojis[type || ''] || '⚡';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh] pt-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-100 flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-400" />
              My Portfolio
            </h1>
            <p className="text-stone-400 mt-1">
              Track your journey from problems to impact
            </p>
          </div>
          <Button
            onClick={() => router.push('/cycle/new')}
            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Cycle
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-100">{stats.totalCycles}</p>
                  <p className="text-sm text-stone-400">Total Cycles</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-100">{stats.completedCycles}</p>
                  <p className="text-sm text-stone-400">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-100">{stats.totalUsersReached}</p>
                  <p className="text-sm text-stone-400">Users Reached</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-100">{stats.totalTimeSaved}h</p>
                  <p className="text-sm text-stone-400">Hours Saved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cycles Grid */}
        {cycles.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Rocket className="w-16 h-16 text-stone-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-300 mb-2">
                No cycles yet
              </h3>
              <p className="text-stone-500 mb-6">
                Start your first cycle to discover problems worth solving.
              </p>
              <Button
                onClick={() => router.push('/cycle/new')}
                className="bg-amber-500 hover:bg-amber-600 text-stone-900"
              >
                <Plus className="w-4 h-4 mr-2" />
                Start Your First Cycle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cycles.map((cycle, index) => (
              <motion.div
                key={cycle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`glass-card h-full hover:border-amber-500/50 transition-colors ${
                  cycle.status === 'completed' ? 'border-emerald-500/30' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {getWorkflowEmoji(cycle.workflow?.workflow_type)}
                        </span>
                        <div>
                          <CardTitle className="text-lg text-stone-100 line-clamp-1">
                            {cycle.name}
                          </CardTitle>
                          <p className="text-xs text-stone-500">
                            {new Date(cycle.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          cycle.status === 'completed'
                            ? 'text-emerald-400 border-emerald-500'
                            : 'text-amber-400 border-amber-500'
                        }
                      >
                        {cycle.status === 'completed' ? 'Shipped' : `Step ${cycle.current_step}/8`}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Problem */}
                    <div className="text-sm">
                      <p className="text-stone-400 mb-1">Problem</p>
                      <p className="text-stone-200 line-clamp-2">
                        {cycle.problem?.refined_statement || cycle.problem?.statement || 'Not defined'}
                      </p>
                    </div>

                    {/* Impact Stats */}
                    {cycle.impact && (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-stone-800/50 rounded-lg">
                          <p className="text-lg font-bold text-blue-400">
                            {cycle.impact.total_users || 0}
                          </p>
                          <p className="text-xs text-stone-500">Users</p>
                        </div>
                        <div className="p-2 bg-stone-800/50 rounded-lg">
                          <p className="text-lg font-bold text-purple-400">
                            {cycle.impact.nps_score || 0}
                          </p>
                          <p className="text-xs text-stone-500">NPS</p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/cycle/${cycle.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      {cycle.build?.project_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(cycle.build?.project_url || '', '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
