'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Mail,
  RefreshCw,
} from 'lucide-react';
import type { JudgeActivity } from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

interface JudgeActivityMonitorProps {
  activities: JudgeActivity[];
  totalJudges: number;
  activeJudges: number;
  inactiveJudges: number;
  onPingJudge?: (judge: JudgeActivity) => void;
}

export function JudgeActivityMonitor({
  activities,
  totalJudges,
  activeJudges,
  inactiveJudges,
  onPingJudge,
}: JudgeActivityMonitorProps) {
  const getStatusIcon = (status: JudgeActivity['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'idle':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'inactive':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'never-scored':
        return <XCircle className="w-4 h-4 text-stone-400" />;
    }
  };

  const getStatusBadge = (status: JudgeActivity['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'idle':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'never-scored':
        return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
    }
  };

  const formatLastActivity = (judge: JudgeActivity) => {
    if (!judge.last_score_at) return 'Never scored';
    if (judge.minutes_since_last_activity === null) return 'Unknown';
    if (judge.minutes_since_last_activity < 1) return 'Just now';
    if (judge.minutes_since_last_activity < 60) {
      return `${judge.minutes_since_last_activity}m ago`;
    }
    const hours = Math.floor(judge.minutes_since_last_activity / 60);
    return `${hours}h ${judge.minutes_since_last_activity % 60}m ago`;
  };

  // Group by track
  const groupedByTrack = activities.reduce((acc, activity) => {
    if (!acc[activity.track_name]) {
      acc[activity.track_name] = [];
    }
    acc[activity.track_name].push(activity);
    return acc;
  }, {} as Record<string, JudgeActivity[]>);

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            Judge Activity Monitor
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
              {activeJudges} Active
            </Badge>
            {inactiveJudges > 0 && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                {inactiveJudges} Inactive
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-stone-800/50 text-center">
            <div className="text-2xl font-bold text-stone-100">{totalJudges}</div>
            <div className="text-xs text-stone-500">Total</div>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-green-400">{activeJudges}</div>
            <div className="text-xs text-stone-500">Active</div>
          </div>
          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {activities.filter(a => a.status === 'idle').length}
            </div>
            <div className="text-xs text-stone-500">Idle</div>
          </div>
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-2xl font-bold text-red-400">{inactiveJudges}</div>
            <div className="text-xs text-stone-500">Inactive</div>
          </div>
        </div>

        {/* Judges by Track */}
        <div className="space-y-4">
          {Object.entries(groupedByTrack).map(([trackName, judges]) => (
            <div key={trackName} className="space-y-2">
              <div className="text-sm font-medium text-stone-400 flex items-center gap-2">
                {trackName}
                <Badge variant="outline" className="text-xs">
                  {judges.length} judges
                </Badge>
              </div>
              <div className="grid gap-2">
                {judges.map((judge) => (
                  <div
                    key={`${judge.judge_id}-${judge.track_id}`}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-lg border',
                      judge.is_inactive
                        ? 'bg-red-500/5 border-red-500/30'
                        : 'bg-stone-800/50 border-stone-700'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(judge.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-stone-100">
                            {judge.judge_name || judge.judge_email}
                          </span>
                          {judge.is_lead && (
                            <Badge variant="outline" className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/30">
                              Lead
                            </Badge>
                          )}
                          <Badge variant="outline" className={cn('text-xs', getStatusBadge(judge.status))}>
                            {judge.status.replace('-', ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatLastActivity(judge)}
                          </span>
                          <span>
                            {judge.total_scores_submitted} scores
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {judge.is_inactive && onPingJudge && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                          onClick={() => onPingJudge(judge)}
                        >
                          <Bell className="w-3 h-3 mr-1" />
                          Ping
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-stone-500">
            No judges assigned yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}
