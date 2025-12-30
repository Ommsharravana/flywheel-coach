'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Star, Check, X, Loader2 } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  problem_statement: string;
  theme: string | null;
  status: string;
  created_at: string;
  is_curated: boolean;
  is_recommended: boolean;
  total_count: number;
}

interface ProblemCurationClientProps {
  eventId: string;
  userId: string;
}

export function ProblemCurationClient({ eventId, userId }: ProblemCurationClientProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pageLimit = 20;
  const supabase = createClient();

  const fetchProblems = useCallback(async () => {
    setLoading(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_global_problems_for_curation', {
      caller_user_id: userId,
      event_id_filter: eventId,
      search_term: searchTerm || null,
      page_offset: page * pageLimit,
      page_limit: pageLimit,
    });

    if (!error && data) {
      setProblems(data as Problem[]);
      if (data.length > 0) {
        setTotalCount(data[0].total_count);
      } else {
        setTotalCount(0);
      }
    }

    setLoading(false);
  }, [supabase, userId, eventId, searchTerm, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching is a valid useEffect pattern
    fetchProblems();
  }, [fetchProblems]);

  const handleCurate = async (problemId: string, action: 'add' | 'remove', isRecommended: boolean = true) => {
    setActionLoading(problemId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('curate_problem_for_event', {
      caller_user_id: userId,
      p_event_id: eventId,
      p_problem_id: problemId,
      p_action: action,
      p_is_recommended: isRecommended,
    });

    if (!error && data?.success) {
      // Update local state
      setProblems((prev) =>
        prev.map((p) =>
          p.id === problemId
            ? {
                ...p,
                is_curated: action === 'add',
                is_recommended: action === 'add' ? isRecommended : false,
              }
            : p
        )
      );
    }

    setActionLoading(null);
  };

  const handleToggleRecommended = async (problemId: string, newValue: boolean) => {
    setActionLoading(problemId);

    // Remove and re-add with new recommended status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc('curate_problem_for_event', {
      caller_user_id: userId,
      p_event_id: eventId,
      p_problem_id: problemId,
      p_action: 'add',
      p_is_recommended: newValue,
    });

    // Update local state
    setProblems((prev) =>
      prev.map((p) =>
        p.id === problemId
          ? { ...p, is_recommended: newValue }
          : p
      )
    );

    setActionLoading(null);
  };

  const totalPages = Math.ceil(totalCount / pageLimit);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-500" />
        <Input
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          className="pl-10 bg-stone-800/50 border-stone-700 text-stone-100"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-12 text-stone-500">
          <p>No approved problems found</p>
        </div>
      ) : (
        <div className="rounded-md border border-stone-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-800/50 border-stone-700">
                <TableHead className="text-stone-400 w-12">Curated</TableHead>
                <TableHead className="text-stone-400">Problem</TableHead>
                <TableHead className="text-stone-400 w-24">Theme</TableHead>
                <TableHead className="text-stone-400 w-32 text-center">Recommended</TableHead>
                <TableHead className="text-stone-400 w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {problems.map((problem) => (
                <TableRow key={problem.id} className="border-stone-700 hover:bg-stone-800/30">
                  <TableCell>
                    {problem.is_curated ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-stone-100">{problem.title}</div>
                      <div className="text-sm text-stone-500 line-clamp-2">
                        {problem.problem_statement}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {problem.theme && (
                      <Badge variant="outline" className="text-stone-400 border-stone-600">
                        {problem.theme}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {problem.is_curated && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRecommended(problem.id, !problem.is_recommended)}
                        disabled={actionLoading === problem.id}
                        className={problem.is_recommended ? 'text-amber-400' : 'text-stone-500'}
                      >
                        <Star
                          className={`h-5 w-5 ${problem.is_recommended ? 'fill-amber-400' : ''}`}
                        />
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {actionLoading === problem.id ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    ) : problem.is_curated ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCurate(problem.id, 'remove', false)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCurate(problem.id, 'add', true)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-500">
            Showing {page * pageLimit + 1} - {Math.min((page + 1) * pageLimit, totalCount)} of{' '}
            {totalCount} problems
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-stone-700"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-stone-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
