'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Rocket,
  TrendingUp,
  Users,
  Search,
  Building,
  Loader2,
  GraduationCap,
  ExternalLink,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Trash2,
  Briefcase,
  Target,
  Filter,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============= TYPES =============

interface UnifiedNIFItem {
  source: 'application' | 'problem_bank';
  id: string;
  source_id: string;
  project_name: string;
  applicant_name: string | null;
  applicant_email: string | null;
  user_id: string | null;
  institution_short: string | null;
  stage: string;
  original_status: string;
  mentor_id: string | null;
  mentor_name: string | null;
  problem_statement: string | null;
  motivation: string | null;
  project_url: string | null;
  total_users: number | null;
  impact_score: number | null;
  jobs_created: number;
  revenue_generated: number;
  composite_score: number | null;
  created_at: string;
  activated_at: string | null;
  graduated_at: string | null;
  updated_at: string;
}

interface UnifiedNIFStats {
  total: number;
  by_stage: Record<string, number>;
  by_source: Record<string, number>;
  startups: number;
  with_mentor: number;
  without_mentor: number;
  total_jobs: number;
  total_revenue: number;
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

const UNIFIED_STAGES = [
  { value: 'all', label: 'All Stages', color: 'text-stone-400' },
  { value: 'pending_review', label: 'Pending Review', color: 'text-yellow-400' },
  { value: 'mentor_selection', label: 'Mentor Selection', color: 'text-orange-400' },
  { value: 'active', label: 'Active', color: 'text-emerald-400' },
  { value: 'graduated', label: 'Graduated', color: 'text-purple-400' },
  { value: 'rejected', label: 'Rejected', color: 'text-red-400' },
  { value: 'dropped', label: 'Dropped', color: 'text-stone-500' },
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'application', label: 'Applications' },
  { value: 'problem_bank', label: 'Problem Bank' },
];

const MENTOR_STATUS_OPTIONS = [
  { value: 'all', label: 'All Mentor Status' },
  { value: 'assigned', label: 'Has Mentor' },
  { value: 'unassigned', label: 'Needs Mentor' },
];

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_review: { label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  mentor_selection: { label: 'Mentor Selection', color: 'text-orange-400', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  active: { label: 'Active', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  graduated: { label: 'Graduated', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  rejected: { label: 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  dropped: { label: 'Dropped', color: 'text-stone-500', bgColor: 'bg-stone-500/10 border-stone-500/30' },
};

// ============= MAIN COMPONENT =============

export default function NIFIncubationHubPage() {
  const supabase = createClient();

  // Data state
  const [items, setItems] = useState<UnifiedNIFItem[]>([]);
  const [stats, setStats] = useState<UnifiedNIFStats | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [mentorFilter, setMentorFilter] = useState('all');

  // UI state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [mentorPopoverOpen, setMentorPopoverOpen] = useState<string | null>(null);

  // ============= DATA FETCHING =============

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ include_stats: 'true' });
      if (stageFilter !== 'all') params.append('stage', stageFilter);
      if (sourceFilter !== 'all') params.append('source', sourceFilter);
      if (mentorFilter !== 'all') params.append('mentor_status', mentorFilter);
      if (search) params.append('search', search);

      const response = await fetch(`/api/nif-hub?${params}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch items');
      }

      const data = await response.json();
      setItems(data.items || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load NIF items');
    } finally {
      setLoading(false);
    }
  }, [stageFilter, sourceFilter, mentorFilter, search]);

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
    fetchItems();
    fetchMentors();
  }, [fetchItems, fetchMentors]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchItems]);

  // ============= HANDLERS =============

  const handleStageChange = async (item: UnifiedNIFItem, newStage: string) => {
    setUpdatingItems((prev) => new Set(prev).add(item.id));

    try {
      const response = await fetch('/api/nif-hub', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          source: item.source,
          action: 'update_stage',
          stage: newStage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stage');
      }

      toast.success('Stage updated');
      fetchItems();
    } catch (err) {
      console.error('Error updating stage:', err);
      toast.error('Failed to update stage');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleAssignMentor = async (item: UnifiedNIFItem, mentorId: string) => {
    setUpdatingItems((prev) => new Set(prev).add(item.id));
    setMentorPopoverOpen(null);

    try {
      const response = await fetch('/api/nif-hub', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: item.id,
          source: item.source,
          action: 'assign_mentor',
          mentor_id: mentorId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign mentor');
      }

      toast.success('Mentor assigned');
      fetchItems();
    } catch (err) {
      console.error('Error assigning mentor:', err);
      toast.error('Failed to assign mentor');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleRemoveItem = async (item: UnifiedNIFItem) => {
    setUpdatingItems((prev) => new Set(prev).add(item.id));

    try {
      const response = await fetch(
        `/api/nif-hub?item_id=${item.id}&source=${item.source}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove item');
      }

      toast.success('Item removed');
      fetchItems();
    } catch (err) {
      console.error('Error removing item:', err);
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const toggleRowExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSearch('');
    setStageFilter('all');
    setSourceFilter('all');
    setMentorFilter('all');
  };

  const hasActiveFilters = search || stageFilter !== 'all' || sourceFilter !== 'all' || mentorFilter !== 'all';

  // ============= RENDER =============

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin"
            className="text-stone-400 hover:text-stone-100 text-sm flex items-center gap-1 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
          <h1 className="text-2xl font-display font-bold text-stone-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border border-orange-500/30">
              <Rocket className="h-6 w-6 text-orange-400" />
            </div>
            NIF Incubation Hub
          </h1>
          <p className="text-stone-400 mt-1">
            Unified view of all incubation candidates from Applications and Problem Bank
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={TrendingUp}
          value={stats?.total || 0}
          label="Total"
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={Rocket}
          value={stats?.startups || 0}
          label="Startups"
          color="orange"
          loading={loading}
        />
        <StatCard
          icon={Clock}
          value={stats?.by_stage?.pending_review || 0}
          label="Pending"
          color="yellow"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle}
          value={stats?.by_stage?.active || 0}
          label="Active"
          color="emerald"
          loading={loading}
        />
        <StatCard
          icon={Briefcase}
          value={stats?.total_jobs || 0}
          label="Jobs"
          color="green"
          loading={loading}
        />
        <StatCard
          icon={GraduationCap}
          value={stats?.by_stage?.graduated || 0}
          label="Graduated"
          color="purple"
          loading={loading}
        />
      </div>

      {/* Filters */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
              <Input
                placeholder="Search projects, applicants, problems..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-stone-800 border-stone-700 focus:border-orange-500/50"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="w-[160px] bg-stone-800 border-stone-700">
                  <Filter className="h-4 w-4 mr-2 text-stone-500" />
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {UNIFIED_STAGES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className={opt.color}>{opt.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-[150px] bg-stone-800 border-stone-700">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={mentorFilter} onValueChange={setMentorFilter}>
                <SelectTrigger className="w-[170px] bg-stone-800 border-stone-700">
                  <SelectValue placeholder="Mentor" />
                </SelectTrigger>
                <SelectContent>
                  {MENTOR_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-stone-400 hover:text-stone-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-stone-900/50 border-stone-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-4">{error}</p>
            <Button onClick={fetchItems} variant="outline" className="border-stone-700">
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="py-12 text-center">
            <Rocket className="h-12 w-12 text-stone-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-100">No items found</h3>
            <p className="text-stone-400 mt-2">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Add applications or pipeline candidates to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NIFItemRow
              key={item.id}
              item={item}
              isExpanded={expandedRows.has(item.id)}
              isUpdating={updatingItems.has(item.id)}
              mentors={mentors}
              mentorPopoverOpen={mentorPopoverOpen === item.id}
              onToggleExpand={() => toggleRowExpanded(item.id)}
              onStageChange={(stage) => handleStageChange(item, stage)}
              onAssignMentor={(mentorId) => handleAssignMentor(item, mentorId)}
              onRemove={() => handleRemoveItem(item)}
              onMentorPopoverChange={(open) => setMentorPopoverOpen(open ? item.id : null)}
            />
          ))}
        </div>
      )}

      {/* Results count */}
      {!loading && items.length > 0 && (
        <p className="text-sm text-stone-500 text-center">
          Showing {items.length} item{items.length !== 1 ? 's' : ''}
          {hasActiveFilters && ' (filtered)'}
        </p>
      )}
    </div>
  );
}

// ============= SUB-COMPONENTS =============

function StatCard({
  icon: Icon,
  value,
  label,
  color,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  label: string;
  color: 'blue' | 'orange' | 'yellow' | 'emerald' | 'green' | 'purple';
  loading: boolean;
}) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    orange: 'bg-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    emerald: 'bg-emerald-500/20 text-emerald-400',
    green: 'bg-green-500/20 text-green-400',
    purple: 'bg-purple-500/20 text-purple-400',
  };

  const textColors = {
    blue: 'text-blue-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    emerald: 'text-emerald-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  };

  return (
    <Card className="bg-stone-900/50 border-stone-800 hover:border-stone-700 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', colorClasses[color])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            {loading ? (
              <Skeleton className="h-6 w-8" />
            ) : (
              <div className={cn('text-xl font-bold', textColors[color])}>{value}</div>
            )}
            <p className="text-xs text-stone-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NIFItemRow({
  item,
  isExpanded,
  isUpdating,
  mentors,
  mentorPopoverOpen,
  onToggleExpand,
  onStageChange,
  onAssignMentor,
  onRemove,
  onMentorPopoverChange,
}: {
  item: UnifiedNIFItem;
  isExpanded: boolean;
  isUpdating: boolean;
  mentors: Mentor[];
  mentorPopoverOpen: boolean;
  onToggleExpand: () => void;
  onStageChange: (stage: string) => void;
  onAssignMentor: (mentorId: string) => void;
  onRemove: () => void;
  onMentorPopoverChange: (open: boolean) => void;
}) {
  const stageConfig = STAGE_CONFIG[item.stage] || STAGE_CONFIG.pending_review;

  return (
    <Card className={cn(
      'bg-stone-900/50 border-stone-800 transition-all',
      isExpanded && 'border-stone-700 bg-stone-900/80'
    )}>
      <CardContent className="p-0">
        {/* Main Row */}
        <div className="flex items-center gap-3 p-4">
          {/* Expand Toggle */}
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-stone-800 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-stone-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-stone-400" />
            )}
          </button>

          {/* Project Name */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-stone-100 truncate">
                {item.project_name || 'Untitled Project'}
              </h3>
              {/* Source Badge */}
              <Badge
                variant="outline"
                className={cn(
                  'text-xs shrink-0',
                  item.source === 'application'
                    ? 'text-blue-400 border-blue-500/30'
                    : 'text-amber-400 border-amber-500/30'
                )}
              >
                {item.source === 'application' ? 'App' : 'Bank'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-stone-400">
              <span>{item.applicant_name || '—'}</span>
              {item.institution_short && (
                <>
                  <span className="text-stone-600">•</span>
                  <span className="flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    {item.institution_short}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Stage Dropdown */}
          <Select
            value={item.stage}
            onValueChange={onStageChange}
            disabled={isUpdating}
          >
            <SelectTrigger
              className={cn(
                'w-[140px] border',
                stageConfig.bgColor
              )}
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {UNIFIED_STAGES.filter((s) => s.value !== 'all').map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>
                  <span className={stage.color}>{stage.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Mentor Cell */}
          <Popover open={mentorPopoverOpen} onOpenChange={onMentorPopoverChange}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-[140px] justify-start font-normal',
                  !item.mentor_name && 'text-stone-500'
                )}
                disabled={isUpdating}
              >
                <UserPlus className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">
                  {item.mentor_name || 'Assign'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-stone-900 border-stone-700" align="end">
              <div className="p-3 border-b border-stone-700">
                <h4 className="font-medium text-stone-100">Assign Mentor</h4>
                <p className="text-xs text-stone-400 mt-1">
                  Select a mentor for this project
                </p>
              </div>
              <ScrollArea className="h-[300px]">
                <div className="p-2 space-y-1">
                  {mentors.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-4">
                      No mentors available
                    </p>
                  ) : (
                    mentors.map((mentor) => {
                      const isAtCapacity = mentor.current_mentees >= mentor.max_mentees;
                      const isSelected = item.mentor_id === mentor.id;

                      return (
                        <button
                          key={mentor.id}
                          onClick={() => onAssignMentor(mentor.id)}
                          disabled={isAtCapacity}
                          className={cn(
                            'w-full text-left p-3 rounded-lg transition-colors',
                            isSelected
                              ? 'bg-orange-500/20 border border-orange-500/50'
                              : 'hover:bg-stone-800',
                            isAtCapacity && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-stone-100">
                              {mentor.name}
                            </span>
                            <span className="text-xs text-stone-500">
                              {mentor.current_mentees}/{mentor.max_mentees}
                            </span>
                          </div>
                          {mentor.title && (
                            <p className="text-xs text-stone-400 mt-1">
                              {mentor.title}
                            </p>
                          )}
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <Badge
                              variant="outline"
                              className="text-xs text-stone-500 border-stone-600"
                            >
                              {mentor.mentor_type}
                            </Badge>
                            {mentor.domains.slice(0, 2).map((d) => (
                              <Badge
                                key={d}
                                variant="outline"
                                className="text-xs text-stone-500 border-stone-600"
                              >
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Remove Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-stone-500 hover:text-red-400 hover:bg-red-500/10"
                disabled={isUpdating}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-stone-900 border-stone-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-stone-100">
                  Remove this item?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-stone-400">
                  This will mark &quot;{item.project_name}&quot; as dropped/withdrawn.
                  This action can be undone by changing the stage.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-stone-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={onRemove}
                  className="bg-red-500 hover:bg-red-600"
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-stone-800 mt-0">
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              {/* Left Column */}
              <div className="space-y-4">
                {item.problem_statement && (
                  <div>
                    <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                      Problem Statement
                    </h4>
                    <p className="text-sm text-stone-300 leading-relaxed">
                      {item.problem_statement}
                    </p>
                  </div>
                )}

                {item.motivation && (
                  <div>
                    <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                      {item.source === 'application' ? 'Motivation' : 'Notes'}
                    </h4>
                    <p className="text-sm text-stone-400 italic">
                      &quot;{item.motivation}&quot;
                    </p>
                  </div>
                )}

                {item.project_url && (
                  <div>
                    <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-1">
                      Project URL
                    </h4>
                    <a
                      href={item.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {item.project_url}
                    </a>
                  </div>
                )}
              </div>

              {/* Right Column - Metrics */}
              <div className="space-y-4">
                <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {item.total_users !== null && (
                    <MetricBox
                      label="Total Users"
                      value={item.total_users.toString()}
                      icon={Users}
                    />
                  )}
                  {item.impact_score !== null && (
                    <MetricBox
                      label="Impact Score"
                      value={item.impact_score.toString()}
                      icon={Target}
                    />
                  )}
                  {item.jobs_created > 0 && (
                    <MetricBox
                      label="Jobs Created"
                      value={item.jobs_created.toString()}
                      icon={Briefcase}
                    />
                  )}
                  {item.revenue_generated > 0 && (
                    <MetricBox
                      label="Revenue"
                      value={`₹${(item.revenue_generated / 100000).toFixed(1)}L`}
                      icon={TrendingUp}
                    />
                  )}
                  {item.composite_score !== null && (
                    <MetricBox
                      label="Score"
                      value={item.composite_score.toFixed(1)}
                      icon={CheckCircle}
                    />
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Timeline
                  </h4>
                  <div className="text-xs text-stone-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.activated_at && (
                      <div className="flex justify-between">
                        <span>Activated</span>
                        <span>{new Date(item.activated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {item.graduated_at && (
                      <div className="flex justify-between">
                        <span>Graduated</span>
                        <span>{new Date(item.graduated_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricBox({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-stone-500" />
        <span className="text-lg font-bold text-stone-100">{value}</span>
      </div>
      <p className="text-xs text-stone-500 mt-1">{label}</p>
    </div>
  );
}
