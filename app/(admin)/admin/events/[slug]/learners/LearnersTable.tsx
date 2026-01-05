'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronDown,
  ChevronRight,
  Search,
  Mail,
  Building2,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Team {
  id: string;
  team_name: string;
  app_name: string;
  status: string;
  submission_number: string | null;
}

interface LearnerData {
  learner_id: string;
  learner_name: string;
  learner_email: string;
  learner_role: string | null;
  institution_name: string | null;
  team_count: number;
  teams: Team[];
}

interface LearnersTableProps {
  data: LearnerData[];
  eventSlug: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
  submitted: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  under_review: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  shortlisted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  winner: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Review',
  shortlisted: 'Shortlisted',
  winner: 'Winner',
  rejected: 'Rejected',
};

export function LearnersTable({ data, eventSlug }: LearnersTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter data based on search
  const filteredData = data.filter(l => {
    const query = searchQuery.toLowerCase();
    return (
      l.learner_name?.toLowerCase().includes(query) ||
      l.learner_email?.toLowerCase().includes(query) ||
      l.learner_role?.toLowerCase().includes(query) ||
      l.institution_name?.toLowerCase().includes(query) ||
      l.teams.some(t =>
        t.team_name?.toLowerCase().includes(query) ||
        t.app_name?.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
        <Input
          placeholder="Search by name, email, role, institution, or team..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-stone-800 border-stone-700"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-stone-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-stone-800 hover:bg-transparent">
              <TableHead className="w-10 text-stone-400"></TableHead>
              <TableHead className="text-stone-400">Learner</TableHead>
              <TableHead className="text-stone-400">Role</TableHead>
              <TableHead className="text-stone-400">Institution</TableHead>
              <TableHead className="text-stone-400 text-center">Teams</TableHead>
              <TableHead className="text-stone-400">Team Status Summary</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((l) => {
              const isExpanded = expandedRows.has(l.learner_id);

              // Calculate status counts
              const statusCounts = l.teams.reduce((acc, team) => {
                acc[team.status] = (acc[team.status] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return (
                <>
                  {/* Main Row */}
                  <TableRow
                    key={l.learner_id}
                    className={cn(
                      'border-stone-800 cursor-pointer transition-colors',
                      isExpanded ? 'bg-stone-800/50' : 'hover:bg-stone-800/30'
                    )}
                    onClick={() => toggleRow(l.learner_id)}
                  >
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-stone-400"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="py-3">
                      <div>
                        <div className="font-medium text-stone-100">
                          {l.learner_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-500">
                          <Mail className="h-3 w-3" />
                          {l.learner_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {l.learner_role ? (
                        <div className="flex items-center gap-1 text-sm text-stone-300">
                          <Briefcase className="h-3 w-3 text-stone-500" />
                          <span className="capitalize">{l.learner_role}</span>
                        </div>
                      ) : (
                        <span className="text-stone-500 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      {l.institution_name ? (
                        <div className="flex items-center gap-1 text-sm text-stone-300">
                          <Building2 className="h-3 w-3 text-stone-500" />
                          {l.institution_name}
                        </div>
                      ) : (
                        <span className="text-stone-500 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <div className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 bg-blue-500/20 text-blue-400 font-semibold text-sm rounded-full border border-blue-500/30">
                        {l.team_count}
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(statusCounts).map(([status, count]) => (
                          <Badge
                            key={status}
                            variant="outline"
                            className={cn('text-xs', statusColors[status])}
                          >
                            {count} {statusLabels[status] || status}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Team Details */}
                  {isExpanded && (
                    <TableRow className="border-stone-800 bg-stone-900/50">
                      <TableCell colSpan={6} className="py-0">
                        <div className="py-4 px-6 space-y-3">
                          <div className="text-xs font-semibold uppercase text-stone-500 tracking-wider">
                            Teams Participated
                          </div>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {l.teams.map((team) => (
                              <Link
                                key={team.id}
                                href={`/admin/events/${eventSlug}/submissions/${team.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="group flex items-center justify-between p-3 bg-stone-800/50 hover:bg-stone-800 border border-stone-700/50 hover:border-stone-600 rounded-lg transition-all"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-stone-200 truncate group-hover:text-stone-100">
                                      {team.team_name}
                                    </span>
                                    {team.submission_number && (
                                      <span className="text-xs text-stone-500 font-mono">
                                        #{team.submission_number}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-stone-400 truncate">
                                    {team.app_name || 'No app name'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <Badge
                                    variant="outline"
                                    className={cn('text-xs shrink-0', statusColors[team.status])}
                                  >
                                    {statusLabels[team.status] || team.status}
                                  </Badge>
                                  <ExternalLink className="h-3 w-3 text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}

            {filteredData.length === 0 && (
              <TableRow className="border-stone-800">
                <TableCell colSpan={6} className="py-8 text-center text-stone-500">
                  {searchQuery
                    ? 'No learners match your search'
                    : 'No learners found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-xs text-stone-500 text-right">
        Showing {filteredData.length} of {data.length} learners
      </div>
    </div>
  );
}
