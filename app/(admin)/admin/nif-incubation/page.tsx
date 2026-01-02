'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Rocket,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Building,
  Star,
  AlertTriangle,
  Loader2,
  GraduationCap,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  LayoutGrid,
  List,
} from 'lucide-react';
import Link from 'next/link';
import {
  NIF_STAGES,
  type NIFStage,
  PROBLEM_THEMES,
} from '@/lib/types/problem-bank';
import { FlywheelSummary } from '@/components/admin/FlywheelSummary';
import { toast } from 'sonner';

// ============= TYPES =============

interface PipelineCandidate {
  id: string;
  problem_id: string;
  stage: NIFStage;
  identified_at: string;
  startup_name: string | null;
  startup_status: string | null;
  jobs_created: number;
  revenue_generated: number;
  decision_notes: string | null;
  problem: {
    id: string;
    title: string;
    problem_statement: string;
    theme: string | null;
    validation_status: string;
    severity_rating: number | null;
  };
  institution_short?: string;
  composite_score?: number | null;
}

interface PipelineStats {
  total_candidates: number;
  by_stage: Record<string, number>;
  total_startups: number;
  total_jobs_created: number;
  total_revenue: number;
  avg_time_to_graduation_days: number | null;
}

interface Application {
  id: string;
  cycle_id: string;
  cycle_name: string;
  startup_name: string | null;
  motivation: string;
  status: string;
  applied_at: string;
  applicant_name: string;
  applicant_email: string;
  institution_short: string | null;
  problem_statement: string | null;
  project_url: string | null;
  total_users: number | null;
  impact_score: number | null;
  suggested_mentors: string[] | null;
  selected_mentor_id: string | null;
  mentor_name: string | null;
}

interface Mentor {
  id: string;
  name: string;
  title: string | null;
  mentor_type: string;
  domains: string[];
  current_mentees: number;
  max_mentees: number;
}

// ============= CONSTANTS =============

const ACTIVE_STAGES: NIFStage[] = ['identified', 'screened', 'shortlisted', 'incubating', 'graduated'];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'mentor_selection', label: 'Mentor Selection' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 border-yellow-500/50' },
  under_review: { label: 'Under Review', color: 'text-blue-400 border-blue-500/50' },
  mentor_selection: { label: 'Mentor Selection', color: 'text-orange-400 border-orange-500/50' },
  active: { label: 'Active', color: 'text-emerald-400 border-emerald-500/50' },
  completed: { label: 'Completed', color: 'text-purple-400 border-purple-500/50' },
  rejected: { label: 'Rejected', color: 'text-red-400 border-red-500/50' },
  withdrawn: { label: 'Withdrawn', color: 'text-stone-400 border-stone-500/50' },
};

// ============= MAIN COMPONENT =============

export default function NIFIncubationPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'applications' ? 'applications' : 'pipeline');

  // Pipeline state
  const [candidates, setCandidates] = useState<PipelineCandidate[]>([]);
  const [pipelineStats, setPipelineStats] = useState<PipelineStats | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [updating, setUpdating] = useState(false);

  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mentor assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [selectedMentorIds, setSelectedMentorIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // ============= DATA FETCHING =============

  const fetchPipeline = useCallback(async () => {
    setPipelineLoading(true);
    setPipelineError(null);

    try {
      const response = await fetch('/api/pipeline?include_stats=true');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pipeline');
      }

      const data = await response.json();
      setCandidates(data.candidates || []);
      setPipelineStats(data.stats || null);
    } catch (err) {
      setPipelineError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setApplicationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('nif_applications_view')
        .select('*')
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      toast.error('Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  }, [supabase]);

  const fetchMentors = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('status', 'active')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMentors(data || []);
    } catch (err) {
      console.error('Error fetching mentors:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPipeline();
    fetchApplications();
    fetchMentors();
  }, [fetchPipeline, fetchApplications, fetchMentors]);

  // ============= HANDLERS =============

  const handleStageChange = async (candidateId: string, newStage: NIFStage) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/pipeline/${candidateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      await fetchPipeline();
    } catch (err) {
      console.error('Error updating stage:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenAssignDialog = (app: Application) => {
    setSelectedApp(app);
    setSelectedMentorIds(app.suggested_mentors || []);
    setAssignDialogOpen(true);
  };

  const handleSuggestMentors = async () => {
    if (!selectedApp || selectedMentorIds.length === 0) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('suggest_mentors_for_application', {
        p_application_id: selectedApp.id,
        p_mentor_ids: selectedMentorIds,
      });

      if (error) throw error;

      toast.success('Mentors suggested successfully!');
      setAssignDialogOpen(false);
      fetchApplications();
    } catch (err) {
      console.error('Error suggesting mentors:', err);
      toast.error('Failed to suggest mentors');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('nif_applications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', selectedApp.id);

      if (error) throw error;

      toast.success('Application rejected');
      setAssignDialogOpen(false);
      setRejectionReason('');
      fetchApplications();
    } catch (err) {
      console.error('Error rejecting application:', err);
      toast.error('Failed to reject application');
    } finally {
      setSubmitting(false);
    }
  };

  // ============= FILTERED DATA =============

  const filteredCandidates = candidates.filter((c) =>
    c.problem.title.toLowerCase().includes(pipelineSearch.toLowerCase()) ||
    c.startup_name?.toLowerCase().includes(pipelineSearch.toLowerCase())
  );

  const byStage = ACTIVE_STAGES.reduce((acc, stage) => {
    acc[stage] = filteredCandidates.filter((c) => c.stage === stage);
    return acc;
  }, {} as Record<NIFStage, PipelineCandidate[]>);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.applicant_name?.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.startup_name?.toLowerCase().includes(appSearch.toLowerCase()) ||
      app.cycle_name?.toLowerCase().includes(appSearch.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Application stats
  const appStats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    active: applications.filter((a) => a.status === 'active').length,
    mentorSelection: applications.filter((a) => a.status === 'mentor_selection').length,
  };

  // ============= RENDER =============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin"
            className="text-stone-400 hover:text-stone-100 text-sm flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-2">
            <Rocket className="h-6 w-6 text-orange-400" />
            NIF Incubation Hub
          </h1>
          <p className="text-stone-400 mt-1">
            Manage innovation pipeline and incubation applications in one place
          </p>
        </div>
      </div>

      {/* Combined Stats Overview */}
      <div className="grid gap-4 md:grid-cols-6">
        {/* Pipeline Stats */}
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">{pipelineStats?.total_candidates || 0}</div>
                <p className="text-sm text-stone-500">Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Rocket className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{pipelineStats?.total_startups || 0}</div>
                <p className="text-sm text-stone-500">Startups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{appStats.pending}</div>
                <p className="text-sm text-stone-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{appStats.active}</div>
                <p className="text-sm text-stone-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <Users className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{pipelineStats?.total_jobs_created || 0}</div>
                <p className="text-sm text-stone-500">Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <GraduationCap className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">{pipelineStats?.by_stage?.graduated || 0}</div>
                <p className="text-sm text-stone-500">Graduated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-stone-800 border border-stone-700">
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-orange-500 data-[state=active]:text-stone-900">
            <LayoutGrid className="h-4 w-4 mr-2" />
            Pipeline Board
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-orange-500 data-[state=active]:text-stone-900">
            <List className="h-4 w-4 mr-2" />
            Applications ({appStats.total})
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Tab */}
        <TabsContent value="pipeline" className="space-y-6">
          {/* Search */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <Input
                  placeholder="Search candidates or startups..."
                  value={pipelineSearch}
                  onChange={(e) => setPipelineSearch(e.target.value)}
                  className="pl-9 bg-stone-800 border-stone-700"
                />
              </div>
            </CardContent>
          </Card>

          {/* Kanban Board */}
          {pipelineLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : pipelineError ? (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6 text-center py-8">
                <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400">{pipelineError}</p>
                <Button
                  variant="outline"
                  onClick={fetchPipeline}
                  className="mt-4 border-stone-700"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : candidates.length === 0 ? (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="pt-6 text-center py-12">
                <Rocket className="h-12 w-12 text-stone-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-100">No candidates in pipeline</h3>
                <p className="text-stone-400 mt-2">
                  Add high-potential problems to the NIF pipeline from the Problem Bank
                </p>
                <Link href="/admin/problem-bank">
                  <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
                    Go to Problem Bank
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-4">
              {ACTIVE_STAGES.map((stage) => {
                const stageInfo = NIF_STAGES[stage];
                const stageCandidates = byStage[stage] || [];

                return (
                  <div key={stage} className="min-w-[280px]">
                    {/* Column Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <h3 className={`font-medium ${stageInfo.color}`}>
                          {stageInfo.label}
                        </h3>
                        <Badge variant="outline" className="text-stone-400 border-stone-600">
                          {stageCandidates.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-500 mt-1">{stageInfo.description}</p>
                    </div>

                    {/* Column Content */}
                    <div className="space-y-3">
                      {stageCandidates.map((candidate) => {
                        const themeInfo = candidate.problem.theme
                          ? PROBLEM_THEMES[candidate.problem.theme as keyof typeof PROBLEM_THEMES]
                          : null;

                        return (
                          <Dialog key={candidate.id}>
                            <DialogTrigger asChild>
                              <Card
                                className="bg-stone-800/50 border-stone-700 hover:border-stone-600 cursor-pointer transition-all"
                              >
                                <CardContent className="p-4">
                                  {/* Theme & Score */}
                                  <div className="flex items-center justify-between mb-2">
                                    {themeInfo && (
                                      <Badge variant="outline" className={`text-xs ${themeInfo.color} border-current/30`}>
                                        {themeInfo.emoji}
                                      </Badge>
                                    )}
                                    {candidate.composite_score && (
                                      <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-400" />
                                        <span className="text-xs text-yellow-400">
                                          {candidate.composite_score.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Title */}
                                  <h4 className="text-sm font-medium text-stone-100 line-clamp-2 mb-2">
                                    {candidate.startup_name || candidate.problem.title}
                                  </h4>

                                  {/* Institution */}
                                  {candidate.institution_short && (
                                    <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                                      <Building className="h-3 w-3" />
                                      {candidate.institution_short}
                                    </div>
                                  )}

                                  {/* Metrics */}
                                  {(candidate.jobs_created > 0 || candidate.revenue_generated > 0) && (
                                    <div className="flex items-center gap-3 text-xs text-stone-400 pt-2 border-t border-stone-700">
                                      {candidate.jobs_created > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Users className="h-3 w-3" />
                                          {candidate.jobs_created} jobs
                                        </span>
                                      )}
                                      {candidate.revenue_generated > 0 && (
                                        <span className="flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          ₹{(candidate.revenue_generated / 1000).toFixed(0)}K
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </DialogTrigger>

                            <DialogContent className="bg-stone-900 border-stone-700 max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="text-stone-100">
                                  {candidate.startup_name || candidate.problem.title}
                                </DialogTitle>
                                <DialogDescription className="text-stone-400">
                                  {candidate.problem.problem_statement?.substring(0, 200)}...
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 mt-4">
                                {/* Stage Selector */}
                                <div>
                                  <label className="text-sm font-medium text-stone-300 mb-2 block">
                                    Pipeline Stage
                                  </label>
                                  <Select
                                    value={candidate.stage}
                                    onValueChange={(value) => handleStageChange(candidate.id, value as NIFStage)}
                                    disabled={updating}
                                  >
                                    <SelectTrigger className="bg-stone-800 border-stone-700">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(NIF_STAGES).map(([key, { label }]) => (
                                        <SelectItem key={key} value={key}>
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 rounded-lg bg-stone-800">
                                    <div className="text-2xl font-bold text-green-400">
                                      {candidate.jobs_created}
                                    </div>
                                    <div className="text-xs text-stone-500">Jobs Created</div>
                                  </div>
                                  <div className="p-3 rounded-lg bg-stone-800">
                                    <div className="text-2xl font-bold text-yellow-400">
                                      ₹{(candidate.revenue_generated / 100000).toFixed(1)}L
                                    </div>
                                    <div className="text-xs text-stone-500">Revenue</div>
                                  </div>
                                </div>

                                {/* Notes */}
                                {candidate.decision_notes && (
                                  <div className="p-3 rounded-lg bg-stone-800">
                                    <div className="text-xs text-stone-500 mb-1">Notes</div>
                                    <p className="text-sm text-stone-300">{candidate.decision_notes}</p>
                                  </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-4">
                                  <Link
                                    href={`/admin/problem-bank/${candidate.problem_id}`}
                                    className="flex-1"
                                  >
                                    <Button variant="outline" className="w-full border-stone-700">
                                      View Problem
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        );
                      })}

                      {stageCandidates.length === 0 && (
                        <div className="p-4 border-2 border-dashed border-stone-700 rounded-lg text-center">
                          <p className="text-sm text-stone-500">No candidates</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-6">
          {/* Filters */}
          <Card className="bg-stone-900/50 border-stone-800">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <Input
                    placeholder="Search applications..."
                    value={appSearch}
                    onChange={(e) => setAppSearch(e.target.value)}
                    className="pl-9 bg-stone-800 border-stone-700"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[200px] bg-stone-800 border-stone-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications List */}
          {applicationsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <Card className="bg-stone-900/50 border-stone-800">
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 text-stone-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-stone-100">No applications found</h3>
                <p className="text-stone-400 mt-2">
                  {applications.length === 0
                    ? 'No incubation applications have been submitted yet.'
                    : 'No applications match your search criteria.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                return (
                  <Card key={app.id} className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-orange-500/20 text-orange-400">
                            {app.applicant_name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-medium text-stone-100">
                                {app.startup_name || app.cycle_name}
                              </h3>
                              <p className="text-sm text-stone-400">
                                by {app.applicant_name}
                                {app.institution_short && (
                                  <span className="ml-2">
                                    <Building className="h-3 w-3 inline mr-1" />
                                    {app.institution_short}
                                  </span>
                                )}
                              </p>
                            </div>
                            <Badge variant="outline" className={statusConfig.color}>
                              {statusConfig.label}
                            </Badge>
                          </div>

                          {/* Problem */}
                          {app.problem_statement && (
                            <p className="text-sm text-stone-400 mt-2 line-clamp-2">
                              {app.problem_statement}
                            </p>
                          )}

                          {/* Motivation */}
                          <p className="text-sm text-stone-300 mt-2 line-clamp-2 italic">
                            &quot;{app.motivation}&quot;
                          </p>

                          {/* Metrics & Actions */}
                          <div className="flex items-center gap-4 mt-4">
                            {app.total_users && (
                              <span className="text-xs text-stone-500">
                                <Users className="h-3 w-3 inline mr-1" />
                                {app.total_users} users
                              </span>
                            )}
                            {app.project_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(app.project_url!, '_blank')}
                                className="text-xs"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Project
                              </Button>
                            )}
                            <span className="text-xs text-stone-500 ml-auto">
                              Applied {new Date(app.applied_at).toLocaleDateString()}
                            </span>

                            {/* Action Buttons */}
                            {app.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenAssignDialog(app)}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Assign Mentors
                              </Button>
                            )}

                            {app.status === 'mentor_selection' && (
                              <Badge variant="outline" className="text-orange-400 border-orange-500/50">
                                <Clock className="h-3 w-3 mr-1" />
                                Waiting for applicant to select
                              </Badge>
                            )}

                            {app.status === 'active' && app.mentor_name && (
                              <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">
                                <Users className="h-3 w-3 mr-1" />
                                Mentor: {app.mentor_name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mentor Assignment Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="bg-stone-900 border-stone-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-stone-100">
              Assign Mentors
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              Select up to 3 mentors to suggest for {selectedApp?.applicant_name}&apos;s application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto">
            {mentors.length === 0 ? (
              <p className="text-center text-stone-400 py-8">
                No mentors available. Please add mentors first.
              </p>
            ) : (
              mentors.map((mentor) => {
                const isSelected = selectedMentorIds.includes(mentor.id);
                const isAtCapacity = mentor.current_mentees >= mentor.max_mentees;

                return (
                  <div
                    key={mentor.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-stone-700 bg-stone-800/50'
                    } ${isAtCapacity ? 'opacity-50' : 'cursor-pointer'}`}
                    onClick={() => {
                      if (isAtCapacity) return;
                      if (isSelected) {
                        setSelectedMentorIds(selectedMentorIds.filter((id) => id !== mentor.id));
                      } else if (selectedMentorIds.length < 3) {
                        setSelectedMentorIds([...selectedMentorIds, mentor.id]);
                      }
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={isAtCapacity || (!isSelected && selectedMentorIds.length >= 3)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-100">{mentor.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {mentor.mentor_type}
                        </Badge>
                        {isAtCapacity && (
                          <Badge variant="outline" className="text-xs text-red-400 border-red-500/50">
                            At capacity
                          </Badge>
                        )}
                      </div>
                      {mentor.title && (
                        <p className="text-sm text-stone-400">{mentor.title}</p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {mentor.domains.slice(0, 3).map((d) => (
                          <Badge key={d} variant="outline" className="text-xs text-stone-500">
                            {d}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-stone-500">
                      {mentor.current_mentees}/{mentor.max_mentees}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Rejection option */}
          <div className="border-t border-stone-700 pt-4 mt-4">
            <details className="group">
              <summary className="text-sm text-stone-400 cursor-pointer hover:text-stone-300">
                Or reject this application
              </summary>
              <div className="mt-3 space-y-3">
                <Textarea
                  placeholder="Reason for rejection (optional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="bg-stone-800 border-stone-700"
                />
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Application
                </Button>
              </div>
            </details>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-stone-700">
            <Button
              variant="outline"
              onClick={() => setAssignDialogOpen(false)}
              className="flex-1 border-stone-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSuggestMentors}
              disabled={selectedMentorIds.length === 0 || submitting}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Suggest {selectedMentorIds.length} Mentor{selectedMentorIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Learning Flywheel Summary */}
      <FlywheelSummary />
    </div>
  );
}
