'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ClipboardList,
  Download,
  Filter,
  Loader2,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_role: string;
  action_type: string;
  resource_type: string;
  resource_id: string | null;
  page_path: string | null;
  filters_applied: Record<string, unknown> | null;
  event_id: string | null;
  institution_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
  event_name?: string;
  institution_name?: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  page_view: { label: 'Page View', color: 'text-blue-400 border-blue-500/30', icon: Eye },
  create: { label: 'Create', color: 'text-green-400 border-green-500/30', icon: UserPlus },
  update: { label: 'Update', color: 'text-amber-400 border-amber-500/30', icon: Edit },
  delete: { label: 'Delete', color: 'text-red-400 border-red-500/30', icon: Trash2 },
  filter_change: { label: 'Filter', color: 'text-purple-400 border-purple-500/30', icon: Filter },
  export: { label: 'Export', color: 'text-cyan-400 border-cyan-500/30', icon: Download },
  role_assign: { label: 'Assign Role', color: 'text-green-400 border-green-500/30', icon: UserPlus },
  role_revoke: { label: 'Revoke Role', color: 'text-red-400 border-red-500/30', icon: UserMinus },
};

const RESOURCE_LABELS: Record<string, string> = {
  user: 'User',
  cycle: 'Cycle',
  submission: 'Submission',
  problem: 'Problem',
  event: 'Event',
  institution: 'Institution',
  role: 'Role',
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const perPage = 50;

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const supabase = createClient();

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('admin_audit_log')
      .select(`
        *,
        users!admin_audit_log_admin_id_fkey (name, email),
        events!admin_audit_log_event_id_fkey (name),
        institutions!admin_audit_log_institution_id_fkey (name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * perPage, (page + 1) * perPage - 1);

    if (actionFilter) {
      query = query.eq('action_type', actionFilter);
    }
    if (resourceFilter) {
      query = query.eq('resource_type', resourceFilter);
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }

    const { data, error, count } = await query;

    if (!error && data) {
      setLogs(data.map((log: Record<string, unknown>) => ({
        ...log,
        admin_name: (log.users as Record<string, unknown>)?.name as string || 'Unknown',
        admin_email: (log.users as Record<string, unknown>)?.email as string || '',
        event_name: (log.events as Record<string, unknown>)?.name as string || null,
        institution_name: (log.institutions as Record<string, unknown>)?.name as string || null,
      })) as AuditLogEntry[]);
      setTotalCount(count || 0);
    }

    setLoading(false);
  }, [supabase, page, perPage, actionFilter, resourceFilter, dateFrom, dateTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching is a valid useEffect pattern
    fetchLogs();
  }, [fetchLogs]);

  function exportCSV() {
    const headers = ['Timestamp', 'Admin', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Page', 'Event', 'Institution'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.admin_name,
      log.admin_role,
      log.action_type,
      log.resource_type,
      log.resource_id || '',
      log.page_path || '',
      log.event_name || '',
      log.institution_name || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100">Audit Log</h1>
          <p className="text-stone-400">
            Track all admin actions across the platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchLogs()}
            className="border-stone-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="bg-amber-500 hover:bg-amber-600 text-stone-900"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-stone-100">{totalCount}</div>
            <p className="text-sm text-stone-500">Total Entries</p>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-400">
              {logs.filter(l => l.action_type === 'page_view').length}
            </div>
            <p className="text-sm text-stone-500">Page Views (shown)</p>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-400">
              {logs.filter(l => ['create', 'update'].includes(l.action_type)).length}
            </div>
            <p className="text-sm text-stone-500">Modifications (shown)</p>
          </CardContent>
        </Card>
        <Card className="bg-stone-900/50 border-stone-800">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-400">
              {new Set(logs.map(l => l.admin_id)).size}
            </div>
            <p className="text-sm text-stone-500">Unique Admins (shown)</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Action</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm min-w-[150px]"
              >
                <option value="">All Actions</option>
                <option value="page_view">Page View</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="filter_change">Filter Change</option>
                <option value="export">Export</option>
                <option value="role_assign">Role Assign</option>
                <option value="role_revoke">Role Revoke</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Resource</label>
              <select
                value={resourceFilter}
                onChange={(e) => { setResourceFilter(e.target.value); setPage(0); }}
                className="bg-stone-800 border border-stone-700 text-stone-200 rounded-md px-3 py-2 text-sm min-w-[150px]"
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="cycle">Cycle</option>
                <option value="submission">Submission</option>
                <option value="problem">Problem</option>
                <option value="event">Event</option>
                <option value="institution">Institution</option>
                <option value="role">Role</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">From Date</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
                className="bg-stone-800 border-stone-700"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">To Date</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
                className="bg-stone-800 border-stone-700"
              />
            </div>
            {(actionFilter || resourceFilter || dateFrom || dateTo) && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setActionFilter('');
                    setResourceFilter('');
                    setDateFrom('');
                    setDateTo('');
                    setPage(0);
                  }}
                  className="text-stone-400"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-stone-900/50 border-stone-800">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Audit Entries</CardTitle>
          <CardDescription>
            {totalCount > 0
              ? `Showing ${page * perPage + 1}-${Math.min((page + 1) * perPage, totalCount)} of ${totalCount}`
              : 'No entries found'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-stone-700">
                    <TableHead className="text-stone-400">Timestamp</TableHead>
                    <TableHead className="text-stone-400">Admin</TableHead>
                    <TableHead className="text-stone-400">Action</TableHead>
                    <TableHead className="text-stone-400">Resource</TableHead>
                    <TableHead className="text-stone-400">Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log) => {
                      const actionConfig = ACTION_CONFIG[log.action_type] || {
                        label: log.action_type,
                        color: 'text-stone-400 border-stone-600',
                        icon: FileText,
                      };
                      const ActionIcon = actionConfig.icon;

                      return (
                        <TableRow key={log.id} className="border-stone-700">
                          <TableCell className="text-stone-400 text-sm">
                            <div>{new Date(log.created_at).toLocaleDateString()}</div>
                            <div className="text-xs text-stone-600">
                              {new Date(log.created_at).toLocaleTimeString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-stone-100">{log.admin_name}</div>
                              <div className="text-xs text-stone-500">{log.admin_role}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={actionConfig.color}>
                              <ActionIcon className="h-3 w-3 mr-1" />
                              {actionConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-stone-100">
                              {RESOURCE_LABELS[log.resource_type] || log.resource_type}
                            </div>
                            {log.resource_id && (
                              <div className="text-xs text-stone-600 font-mono">
                                {log.resource_id.slice(0, 8)}...
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs text-stone-500">
                              {log.page_path && <div>Page: {log.page_path}</div>}
                              {log.event_name && <div>Event: {log.event_name}</div>}
                              {log.institution_name && <div>Institution: {log.institution_name}</div>}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-stone-500">
                        No audit entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-700">
                  <p className="text-sm text-stone-400">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex gap-2">
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
