'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FlywheelLogo } from '@/components/shared/FlywheelLogo';
import {
  ArrowRight,
  ExternalLink,
  Loader2,
  Rocket,
  Search,
  Trophy,
  Users,
  Building2,
  GraduationCap,
  Copy,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface ShowcaseProject {
  id: string;
  name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  user: {
    id: string;
    name: string | null;
    institution: string | null;
    institution_name: string | null;
  } | null;
  problem: {
    statement: string;
    refined_statement: string | null;
  } | null;
  build: {
    project_url: string | null;
    lovable_url: string | null;
  } | null;
  impact: {
    total_users: number;
    nps_score: number;
    impact_score: number;
  } | null;
  workflow: {
    workflow_type: string;
  } | null;
}

export default function ShowcasePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ShowcaseProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<ShowcaseProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalUsersReached: 0,
    activeBuilders: 0,
  });

  useEffect(() => {
    loadShowcase();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.problem?.statement?.toLowerCase().includes(query) ||
            p.problem?.refined_statement?.toLowerCase().includes(query) ||
            p.user?.name?.toLowerCase().includes(query) ||
            p.user?.institution_name?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, projects]);

  const loadShowcase = async () => {
    try {
      // Load all completed cycles (public data)
      const { data: cyclesData, error } = await supabase
        .from('cycles')
        .select('id, name, status, current_step, created_at, completed_at, user_id')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set(cyclesData?.map((c: { user_id: string }) => c.user_id) || [])];

      // Load user data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, institution, institution_id')
        .in('id', userIds);

      // Load institution names
      type UserRow = { id: string; name: string; institution: string | null; institution_id: string | null };
      type InstitutionRow = { id: string; name: string; short_name: string | null };
      type EnrichedUser = UserRow & { institution_name: string | null };
      const institutionIds = [...new Set(usersData?.map((u: UserRow) => u.institution_id).filter(Boolean) || [])];
      const { data: institutionsData } = await supabase
        .from('institutions')
        .select('id, name, short_name')
        .in('id', institutionIds);

      const institutionMap = new Map<string, InstitutionRow>(institutionsData?.map((i: InstitutionRow) => [i.id, i]) || []);
      const userMap = new Map<string, EnrichedUser>(
        usersData?.map((u: UserRow): [string, EnrichedUser] => [
          u.id,
          {
            ...u,
            institution_name: u.institution_id ? institutionMap.get(u.institution_id)?.short_name || u.institution : u.institution,
          },
        ]) || []
      );

      // Enrich cycles with related data
      const enrichedProjects: ShowcaseProject[] = [];
      let totalUsers = 0;

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
          .select('lovable_project_url, deployed_url')
          .eq('cycle_id', cycle.id)
          .single();

        // Get impact
        const { data: impact } = await supabase
          .from('impact_assessments')
          .select('total_users, nps_score, impact_score')
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
        }

        const user = userMap.get(cycle.user_id);

        enrichedProjects.push({
          id: cycle.id,
          name: cycle.name || 'Untitled Project',
          status: cycle.status,
          created_at: cycle.created_at,
          completed_at: cycle.completed_at,
          user: user
            ? {
                id: user.id,
                name: user.name,
                institution: user.institution,
                institution_name: user.institution_name,
              }
            : null,
          problem: problem
            ? {
                statement: problem.selected_question,
                refined_statement: problem.refined_statement,
              }
            : null,
          build: build
            ? {
                project_url: build.deployed_url,
                lovable_url: build.lovable_project_url,
              }
            : null,
          impact: impact,
          workflow: workflow,
        });
      }

      setProjects(enrichedProjects);
      setFilteredProjects(enrichedProjects);
      setStats({
        totalProjects: enrichedProjects.length,
        totalUsersReached: totalUsers,
        activeBuilders: userIds.length,
      });
    } catch (error) {
      console.error('Error loading showcase:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWorkflowEmoji = (type: string | undefined) => {
    const emojis: Record<string, string> = {
      GENERATION: '📝',
      EXTRACTION: '📊',
      ORCHESTRATION: '✅',
      MONITORING: '🔔',
      CLASSIFICATION: '🔍',
      SYNTHESIS: '📈',
      TRANSFORMATION: '📁',
      AUDIT: '📦',
      PREDICTION: '🔮',
      RECOMMENDATION: '💡',
    };
    return emojis[type || ''] || '⚡';
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopiedLink('page');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800 bg-stone-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <FlywheelLogo size="sm" />
            <div className="hidden sm:block">
              <span className="text-stone-100 font-semibold">JKKN Solution Studio</span>
              <span className="text-stone-500 ml-2">|</span>
              <span className="text-amber-400 ml-2">Showcase</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-stone-400 hover:text-stone-100"
            >
              {copiedLink === 'page' ? (
                <Check className="w-4 h-4 mr-2 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Share
            </Button>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-stone-900">
              <Link href="/signup">
                <Rocket className="w-4 h-4 mr-2" />
                Start Building
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-stone-100 mb-4">
              <span className="text-gradient">JKKN Builders</span> Showcase
            </h1>
            <p className="text-lg text-stone-400 max-w-2xl mx-auto mb-6">
              Explore solutions built by JKKN learners tackling real-world problems.
              Every project represents a journey from problem discovery to validated impact.
            </p>
            <div className="flex items-center justify-center gap-2 text-stone-500">
              <GraduationCap className="w-4 h-4" />
              <span>Part of JKKN100 — Incubating 100 Startups</span>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="glass-card text-center py-6">
              <CardContent className="p-0">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-stone-100">{stats.totalProjects}</p>
                <p className="text-sm text-stone-400">Projects Shipped</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="glass-card text-center py-6">
              <CardContent className="p-0">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-stone-100">{stats.totalUsersReached}</p>
                <p className="text-sm text-stone-400">Users Reached</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card text-center py-6">
              <CardContent className="p-0">
                <Building2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-bold text-stone-100">{stats.activeBuilders}</p>
                <p className="text-sm text-stone-400">Active Builders</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
          <Input
            placeholder="Search projects, problems, or builders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-stone-900 border-stone-700 text-stone-100 placeholder:text-stone-500"
          />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <Rocket className="w-16 h-16 text-stone-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-stone-300 mb-2">
                {searchQuery ? 'No matching projects' : 'No projects yet'}
              </h3>
              <p className="text-stone-500 mb-6">
                {searchQuery
                  ? 'Try a different search term.'
                  : 'Be the first to ship a solution and appear here!'}
              </p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-stone-900">
                <Link href="/signup">Start Your Journey</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-card h-full hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-2xl flex-shrink-0">
                          {getWorkflowEmoji(project.workflow?.workflow_type)}
                        </span>
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-stone-100 truncate">
                            {project.name}
                          </h3>
                          {project.user && (
                            <p className="text-xs text-stone-500 truncate">
                              by {project.user.name || 'Anonymous'} • {project.user.institution_name || 'JKKN'}
                            </p>
                          )}
                        </div>
                      </div>
                      {project.impact && (
                        <Badge
                          variant="outline"
                          className="text-emerald-400 border-emerald-500 flex-shrink-0"
                        >
                          {project.impact.total_users} users
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Problem */}
                    <div className="text-sm">
                      <p className="text-stone-400 mb-1">Problem</p>
                      <p className="text-stone-200 line-clamp-3">
                        {project.problem?.refined_statement ||
                          project.problem?.statement ||
                          'Problem details not available'}
                      </p>
                    </div>

                    {/* Impact Stats */}
                    {project.impact && (
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-stone-800/50 rounded-lg">
                          <p className="text-lg font-bold text-blue-400">
                            {project.impact.total_users || 0}
                          </p>
                          <p className="text-xs text-stone-500">Users</p>
                        </div>
                        <div className="p-2 bg-stone-800/50 rounded-lg">
                          <p className="text-lg font-bold text-purple-400">
                            {project.impact.nps_score || '-'}
                          </p>
                          <p className="text-xs text-stone-500">NPS</p>
                        </div>
                      </div>
                    )}

                    {/* Workflow Badge */}
                    {project.workflow?.workflow_type && (
                      <Badge variant="secondary" className="text-xs">
                        {project.workflow.workflow_type}
                      </Badge>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {project.build?.project_url ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="flex-1 bg-amber-500 hover:bg-amber-600 text-stone-900"
                          onClick={() => window.open(project.build?.project_url || '', '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Live
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          No Live URL
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Card className="glass-card p-8 bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/30">
            <h2 className="text-2xl font-bold text-stone-100 mb-3">
              Ready to Build Your Solution?
            </h2>
            <p className="text-stone-400 mb-6 max-w-xl mx-auto">
              Join the JKKN builders community. Discover problems, build solutions with AI,
              and make real impact — all without writing code.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-900 hover:from-amber-400 hover:to-orange-500"
            >
              <Link href="/signup">
                <Rocket className="w-5 h-5 mr-2" />
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </Card>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-8 px-4">
        <div className="container mx-auto max-w-6xl flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <FlywheelLogo size="sm" />
            <span className="text-sm text-stone-500">
              Powered by JKKN Institutions • Solution Studio
            </span>
          </div>
          <div className="flex gap-6 text-sm text-stone-500">
            <Link href="/" className="hover:text-stone-300">
              Home
            </Link>
            <Link href="/login" className="hover:text-stone-300">
              Login
            </Link>
            <Link href="/signup" className="hover:text-stone-300">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
