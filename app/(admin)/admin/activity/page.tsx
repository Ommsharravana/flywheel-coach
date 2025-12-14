import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  UserMinus,
  Pencil,
  UserCog,
  LogOut,
  Eye,
  Activity,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  admin?: { id: string; name: string | null; email: string } | null;
}

const actionIcons: Record<string, typeof Activity> = {
  user_created: UserPlus,
  user_updated: Pencil,
  user_deleted: UserMinus,
  impersonation_started: UserCog,
  impersonation_ended: LogOut,
  users_exported: Activity,
  cycle_note_added: Pencil,
  cycle_note_deleted: UserMinus,
  cycle_review_created: Eye,
  cycle_review_updated: Eye,
};

const actionColors: Record<string, string> = {
  user_created: 'bg-green-500/20 text-green-400',
  user_updated: 'bg-blue-500/20 text-blue-400',
  user_deleted: 'bg-red-500/20 text-red-400',
  impersonation_started: 'bg-purple-500/20 text-purple-400',
  impersonation_ended: 'bg-stone-500/20 text-stone-400',
  users_exported: 'bg-cyan-500/20 text-cyan-400',
  cycle_note_added: 'bg-amber-500/20 text-amber-400',
  cycle_note_deleted: 'bg-red-500/20 text-red-400',
  cycle_review_created: 'bg-green-500/20 text-green-400',
  cycle_review_updated: 'bg-blue-500/20 text-blue-400',
};

const actionLabels: Record<string, string> = {
  user_created: 'Created User',
  user_updated: 'Updated User',
  user_deleted: 'Deleted User',
  impersonation_started: 'Started Impersonation',
  impersonation_ended: 'Ended Impersonation',
  users_exported: 'Exported Users',
  cycle_note_added: 'Added Cycle Note',
  cycle_note_deleted: 'Deleted Cycle Note',
  cycle_review_created: 'Created Cycle Review',
  cycle_review_updated: 'Updated Cycle Review',
};

export default async function AdminActivityPage() {
  const supabase = await createClient();

  // Fetch activity logs with admin info (using type assertion for new table)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('admin_activity_logs')
    .select(`
      *,
      admin:users!admin_activity_logs_admin_id_fkey (id, name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  // Cast to proper type
  const logs = (data || []) as unknown as ActivityLog[];

  // Get unique action types for stats
  const actionCounts: Record<string, number> = {};
  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-stone-100">
          Activity Log
        </h1>
        <p className="text-stone-400">Track all admin actions and changes</p>
      </div>

      {/* Action Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-stone-800">
                <Activity className="h-5 w-5 text-stone-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">
                  {logs.length}
                </div>
                <p className="text-sm text-stone-500">Total Actions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <UserPlus className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">
                  {actionCounts['user_created'] || 0}
                </div>
                <p className="text-sm text-stone-500">Users Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Pencil className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {actionCounts['user_updated'] || 0}
                </div>
                <p className="text-sm text-stone-500">Users Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <UserCog className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {actionCounts['impersonation_started'] || 0}
                </div>
                <p className="text-sm text-stone-500">Impersonations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg text-stone-100">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="space-y-4">
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Activity;
                const admin = log.admin as { name: string | null; email: string } | null;
                const details = log.details as Record<string, unknown> | null;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-stone-800/50 border border-stone-700"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        actionColors[log.action] || 'bg-stone-700 text-stone-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={actionColors[log.action] || ''}
                        >
                          {actionLabels[log.action] || log.action}
                        </Badge>
                        <span className="text-xs text-stone-500">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-stone-300">
                        <span className="text-stone-100 font-medium">
                          {admin?.name || admin?.email || 'Unknown Admin'}
                        </span>{' '}
                        performed{' '}
                        <span className="text-amber-400">{log.action.replace(/_/g, ' ')}</span>
                        {log.entity_type && (
                          <>
                            {' '}
                            on{' '}
                            <Link
                              href={`/admin/${log.entity_type}s/${log.entity_id}`}
                              className="text-amber-400 hover:text-amber-300"
                            >
                              {log.entity_type}
                            </Link>
                          </>
                        )}
                      </p>
                      {details && Object.keys(details).length > 0 && (
                        <div className="mt-2 p-2 rounded bg-stone-900/50 text-xs font-mono text-stone-500">
                          {JSON.stringify(details, null, 2)}
                        </div>
                      )}
                      <p className="text-xs text-stone-600 mt-1">
                        {format(new Date(log.created_at), 'MMM d, yyyy h:mm:ss a')}
                        {log.ip_address && ` • ${log.ip_address}`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-8 text-stone-500">No activity logged yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
