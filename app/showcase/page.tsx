'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
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
  Copy,
  Check,
  Crown,
  Star,
  Github,
  Play,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

interface TeamMember {
  name: string;
  email?: string;
  institution?: string;
  department?: string;
  year?: string;
}

interface AppathonProject {
  id: string;
  team_name: string;
  app_name: string;
  problem_statement: string;
  solution_summary: string | null;
  live_url: string | null;
  lovable_url: string | null;
  github_url: string | null;
  demo_video_url: string | null;
  category: string;
  status: string;
  score: number | null;
  team_members: TeamMember[];
  applicant_name: string;
  institution_name: string | null;
  institution_short_name: string | null;
  impact_metrics: {
    users_reached?: number;
    time_saved_minutes?: number;
    satisfaction_score?: number;
  } | null;
  submitted_at: string | null;
  screenshots: string[];
}

interface Stats {
  totalProjects: number;
  totalTeams: number;
  totalBuilders: number;
  totalUsersReached: number;
  winners: number;
  shortlisted: number;
}

export default function ShowcasePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<AppathonProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<AppathonProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'winners' | 'shortlisted'>('all');
  const [stats, setStats] = useState<Stats>({
    totalProjects: 0,
    totalTeams: 0,
    totalBuilders: 0,
    totalUsersReached: 0,
    winners: 0,
    shortlisted: 0,
  });

  useEffect(() => {
    loadShowcase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = projects;

    // Apply status filter
    if (activeFilter === 'winners') {
      filtered = filtered.filter(p => p.status === 'winner');
    } else if (activeFilter === 'shortlisted') {
      filtered = filtered.filter(p => p.status === 'shortlisted');
    }

    // Apply search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.app_name?.toLowerCase().includes(query) ||
          p.team_name?.toLowerCase().includes(query) ||
          p.problem_statement?.toLowerCase().includes(query) ||
          p.applicant_name?.toLowerCase().includes(query) ||
          p.institution_short_name?.toLowerCase().includes(query) ||
          p.team_members?.some(m => m.name?.toLowerCase().includes(query))
      );
    }

    setFilteredProjects(filtered);
  }, [searchQuery, projects, activeFilter]);

  const loadShowcase = async () => {
    try {
      // Load Appathon submissions (winners and shortlisted first, then submitted)
      const { data: submissions, error } = await supabase
        .from('appathon_submissions')
        .select(`
          id,
          team_name,
          app_name,
          problem_statement,
          solution_summary,
          live_url,
          lovable_url,
          github_url,
          demo_video_url,
          category,
          status,
          score,
          team_members,
          applicant_name,
          impact_metrics,
          submitted_at,
          screenshots,
          institution_id
        `)
        .in('status', ['winner', 'shortlisted', 'submitted'])
        .order('score', { ascending: false, nullsFirst: false })
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      // Get institution info
      interface SubmissionRow {
        id: string;
        team_name: string;
        app_name: string;
        problem_statement: string;
        solution_summary: string | null;
        live_url: string | null;
        lovable_url: string | null;
        github_url: string | null;
        demo_video_url: string | null;
        category: string;
        status: string;
        score: number | null;
        team_members: unknown;
        applicant_name: string;
        impact_metrics: unknown;
        submitted_at: string | null;
        screenshots: unknown;
        institution_id: string;
      }
      interface InstitutionRow { id: string; name: string; short_name: string | null }

      const typedSubmissions = submissions as SubmissionRow[] | null;
      const institutionIds = [...new Set(typedSubmissions?.map((s) => s.institution_id).filter(Boolean) || [])];
      const { data: institutions } = await supabase
        .from('institutions')
        .select('id, name, short_name')
        .in('id', institutionIds);

      const institutionMap = new Map<string, InstitutionRow>(
        (institutions as InstitutionRow[] | null)?.map((i) => [i.id, i]) || []
      );

      // Enrich with institution names
      const enrichedProjects: AppathonProject[] = (typedSubmissions || []).map((s) => {
        const inst = institutionMap.get(s.institution_id);
        return {
          id: s.id,
          team_name: s.team_name,
          app_name: s.app_name,
          problem_statement: s.problem_statement,
          solution_summary: s.solution_summary,
          live_url: s.live_url,
          lovable_url: s.lovable_url,
          github_url: s.github_url,
          demo_video_url: s.demo_video_url,
          category: s.category,
          status: s.status,
          score: s.score,
          applicant_name: s.applicant_name,
          submitted_at: s.submitted_at,
          team_members: Array.isArray(s.team_members) ? s.team_members as TeamMember[] : [],
          screenshots: Array.isArray(s.screenshots) ? s.screenshots as string[] : [],
          impact_metrics: s.impact_metrics as AppathonProject['impact_metrics'],
          institution_name: inst?.name || null,
          institution_short_name: inst?.short_name || null,
        };
      });

      // Calculate stats
      const totalBuilders = enrichedProjects.reduce((acc, p) => {
        return acc + 1 + (p.team_members?.length || 0);
      }, 0);

      const totalUsersReached = enrichedProjects.reduce((acc, p) => {
        return acc + (p.impact_metrics?.users_reached || 0);
      }, 0);

      setProjects(enrichedProjects);
      setFilteredProjects(enrichedProjects);
      setStats({
        totalProjects: enrichedProjects.length,
        totalTeams: enrichedProjects.filter(p => p.team_members?.length > 0).length,
        totalBuilders,
        totalUsersReached,
        winners: enrichedProjects.filter(p => p.status === 'winner').length,
        shortlisted: enrichedProjects.filter(p => p.status === 'shortlisted').length,
      });
    } catch (error) {
      console.error('Error loading showcase:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      healthcare: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      education: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      operations: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      productivity: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      other: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[category] || colors.other;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'winner') {
      return (
        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-900 border-0 font-semibold gap-1">
          <Crown className="w-3 h-3" />
          Winner
        </Badge>
      );
    }
    if (status === 'shortlisted') {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500 to-teal-400 text-stone-900 border-0 font-semibold gap-1">
          <Star className="w-3 h-3" />
          Shortlisted
        </Badge>
      );
    }
    return null;
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#0b6d41]" />
          <p className="text-stone-400 animate-pulse">Loading showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-800/50 bg-stone-950/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <FlywheelLogo size="sm" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[#0b6d41] font-bold tracking-tight">JKKN</span>
              <span className="text-stone-400">|</span>
              <span className="text-stone-100 font-medium">Solution Studio</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="text-stone-400 hover:text-stone-100 hover:bg-stone-800"
            >
              {copiedLink === 'page' ? (
                <Check className="w-4 h-4 mr-2 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button asChild className="bg-[#0b6d41] hover:bg-[#095532] text-white font-medium">
              <Link href="/signup">
                <Rocket className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Start Building</span>
                <span className="sm:hidden">Join</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0b6d41]/10 border border-[#0b6d41]/20 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-stone-300">Appathon 2.0 Showcase</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            <span className="text-stone-100">Built by </span>
            <span className="bg-gradient-to-r from-[#0b6d41] via-emerald-400 to-[#0b6d41] bg-clip-text text-transparent">
              JKKN Learners
            </span>
          </h1>

          <p className="text-lg md:text-xl text-stone-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Real solutions to real problems. Every project here started with a problem worth solving
            and ended with validated impact.
          </p>

          <div className="flex items-center justify-center gap-2 text-stone-500">
            <Building2 className="w-4 h-4" />
            <span className="text-sm">Part of JKKN100 — Incubating 100 Startups</span>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-900/50 border border-stone-800 p-4 text-center group hover:border-[#0b6d41]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-stone-100">{stats.totalProjects}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Projects</p>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-900/50 border border-stone-800 p-4 text-center group hover:border-[#0b6d41]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Users className="w-6 h-6 text-[#0b6d41] mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-stone-100">{stats.totalBuilders}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Builders</p>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-900/50 border border-stone-800 p-4 text-center group hover:border-[#0b6d41]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Crown className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-stone-100">{stats.winners}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Winners</p>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-900/50 border border-stone-800 p-4 text-center group hover:border-[#0b6d41]/50 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b6d41]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Rocket className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl md:text-3xl font-bold text-stone-100">{stats.totalUsersReached}</p>
            <p className="text-xs text-stone-500 uppercase tracking-wider">Users Reached</p>
          </div>
        </motion.div>

        {/* Filter & Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Filter Tabs */}
          <div className="flex gap-2 bg-stone-900/50 p-1 rounded-lg border border-stone-800">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-[#0b6d41] text-white'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              All ({stats.totalProjects})
            </button>
            <button
              onClick={() => setActiveFilter('winners')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'winners'
                  ? 'bg-amber-500 text-stone-900'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Winners ({stats.winners})
            </button>
            <button
              onClick={() => setActiveFilter('shortlisted')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                activeFilter === 'shortlisted'
                  ? 'bg-emerald-500 text-stone-900'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              Shortlisted ({stats.shortlisted})
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
            <Input
              placeholder="Search projects, teams, or builders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-stone-900/50 border-stone-800 text-stone-100 placeholder:text-stone-500 focus:border-[#0b6d41]/50 focus:ring-[#0b6d41]/20"
            />
          </div>
        </motion.div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="bg-stone-900/30 border-stone-800">
              <CardContent className="py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-stone-600" />
                </div>
                <h3 className="text-xl font-medium text-stone-300 mb-2">
                  {searchQuery ? 'No matching projects' : 'No projects yet'}
                </h3>
                <p className="text-stone-500 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? 'Try a different search term or clear filters.'
                    : 'Be the first to ship a solution and appear here!'}
                </p>
                {!searchQuery && (
                  <Button asChild className="bg-[#0b6d41] hover:bg-[#095532] text-white">
                    <Link href="/signup">Start Your Journey</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4 }}
              >
                <Card className="group h-full bg-gradient-to-br from-stone-900 to-stone-900/50 border-stone-800 hover:border-[#0b6d41]/40 transition-all duration-300 overflow-hidden">
                  {/* Status Banner for Winners */}
                  {project.status === 'winner' && (
                    <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-900 text-xs font-bold text-center py-1.5 uppercase tracking-wider">
                      🏆 Appathon Winner
                    </div>
                  )}

                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-stone-100 truncate group-hover:text-[#0b6d41] transition-colors">
                            {project.app_name}
                          </h3>
                          {project.status === 'shortlisted' && getStatusBadge(project.status)}
                        </div>
                        <p className="text-sm text-stone-500 truncate">
                          by <span className="text-stone-400">{project.team_name}</span>
                          {project.institution_short_name && (
                            <span className="text-stone-600"> • {project.institution_short_name}</span>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className={`shrink-0 text-xs ${getCategoryColor(project.category)}`}>
                        {project.category}
                      </Badge>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-4 flex-1">
                      <p className="text-xs uppercase tracking-wider text-stone-600 mb-1.5">Problem</p>
                      <p className="text-sm text-stone-300 line-clamp-3 leading-relaxed">
                        {project.problem_statement}
                      </p>
                    </div>

                    {/* Team Members */}
                    {project.team_members && project.team_members.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs uppercase tracking-wider text-stone-600 mb-2">Team</p>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs bg-stone-800 text-stone-300 px-2 py-1 rounded-md">
                            {project.applicant_name} (Lead)
                          </span>
                          {project.team_members.slice(0, 3).map((member, i) => (
                            <span key={i} className="text-xs bg-stone-800/50 text-stone-400 px-2 py-1 rounded-md">
                              {member.name}
                            </span>
                          ))}
                          {project.team_members.length > 3 && (
                            <span className="text-xs bg-stone-800/30 text-stone-500 px-2 py-1 rounded-md">
                              +{project.team_members.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Impact Metrics */}
                    {project.impact_metrics && (project.impact_metrics.users_reached || project.impact_metrics.satisfaction_score) && (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {project.impact_metrics.users_reached && (
                          <div className="bg-stone-800/30 rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-[#0b6d41]">
                              {project.impact_metrics.users_reached}
                            </p>
                            <p className="text-xs text-stone-500">Users</p>
                          </div>
                        )}
                        {project.impact_metrics.satisfaction_score && (
                          <div className="bg-stone-800/30 rounded-lg p-2.5 text-center">
                            <p className="text-lg font-bold text-amber-400">
                              {project.impact_metrics.satisfaction_score}/5
                            </p>
                            <p className="text-xs text-stone-500">Rating</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Score Badge */}
                    {project.score !== null && project.score > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 bg-stone-800/50 px-2.5 py-1 rounded-full">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-medium text-stone-200">{project.score.toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-stone-600">Judge Score</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto pt-2">
                      {project.live_url ? (
                        <Button
                          size="sm"
                          className="flex-1 bg-[#0b6d41] hover:bg-[#095532] text-white font-medium"
                          onClick={() => window.open(project.live_url || '', '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1.5" />
                          View Live
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 border-stone-700 text-stone-400" disabled>
                          No Live URL
                        </Button>
                      )}

                      {project.demo_video_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-stone-700 hover:bg-stone-800 hover:text-stone-100"
                          onClick={() => window.open(project.demo_video_url || '', '_blank')}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}

                      {project.github_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-stone-700 hover:bg-stone-800 hover:text-stone-100"
                          onClick={() => window.open(project.github_url || '', '_blank')}
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-20"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0b6d41]/20 via-stone-900 to-amber-500/10 border border-[#0b6d41]/30 p-8 md:p-12">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0b6d41]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-stone-100 mb-4">
                Ready to Build Your Solution?
              </h2>
              <p className="text-lg text-stone-400 mb-8 leading-relaxed">
                Join JKKN builders. Discover problems, build AI-powered solutions,
                and create real impact — no coding required.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="bg-[#0b6d41] hover:bg-[#095532] text-white font-medium text-base px-8"
                >
                  <Link href="/signup">
                    <Rocket className="w-5 h-5 mr-2" />
                    Start Building
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-stone-700 text-stone-200 hover:bg-stone-800 font-medium text-base px-8"
                >
                  <Link href="/vibe-studio">
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Vibe Studio
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-800/50 py-8 px-4 bg-stone-950">
        <div className="container mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FlywheelLogo size="sm" />
            <div className="text-sm">
              <span className="text-[#0b6d41] font-semibold">JKKN Institutions</span>
              <span className="text-stone-600 mx-2">•</span>
              <span className="text-stone-500">Solution Studio</span>
            </div>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/" className="text-stone-500 hover:text-stone-300 transition-colors">
              Home
            </Link>
            <Link href="/vibe-studio" className="text-stone-500 hover:text-stone-300 transition-colors">
              Vibe Studio
            </Link>
            <Link href="/login" className="text-stone-500 hover:text-stone-300 transition-colors">
              Login
            </Link>
            <Link href="/signup" className="text-stone-500 hover:text-stone-300 transition-colors">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
