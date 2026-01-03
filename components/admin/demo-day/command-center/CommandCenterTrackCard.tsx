'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
  MapPin,
  Users,
  Timer,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import type { CommandCenterTrack } from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

interface CommandCenterTrackCardProps {
  track: CommandCenterTrack;
  onSelect?: (trackId: string) => void;
}

export function CommandCenterTrackCard({ track, onSelect }: CommandCenterTrackCardProps) {
  const progressPercent = track.total_submissions > 0
    ? Math.round((track.completed_count / track.total_submissions) * 100)
    : 0;

  const getStatusConfig = () => {
    switch (track.status) {
      case 'in-progress':
        return {
          color: 'bg-green-500/20 text-green-400 border-green-500/30',
          icon: <Play className="w-3 h-3" />,
          label: 'Live',
        };
      case 'delayed':
        return {
          color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
          icon: <AlertCircle className="w-3 h-3" />,
          label: 'Delayed',
        };
      case 'completed':
        return {
          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
          icon: <CheckCircle2 className="w-3 h-3" />,
          label: 'Complete',
        };
      case 'paused':
        return {
          color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
          icon: <Pause className="w-3 h-3" />,
          label: 'Paused',
        };
      default:
        return {
          color: 'bg-stone-500/20 text-stone-400 border-stone-500/30',
          icon: <Clock className="w-3 h-3" />,
          label: 'Not Started',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card
      className={cn(
        'glass-card cursor-pointer transition-all hover:border-amber-500/50',
        track.is_behind_schedule && 'border-amber-500/50 bg-amber-500/5'
      )}
      onClick={() => onSelect?.(track.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base text-stone-100 flex items-center gap-2">
              {track.name}
              <Badge variant="outline" className={statusConfig.color}>
                {statusConfig.icon}
                <span className="ml-1">{statusConfig.label}</span>
              </Badge>
            </CardTitle>
            {track.room_location && (
              <div className="flex items-center gap-1 text-xs text-stone-500">
                <MapPin className="w-3 h-3" />
                {track.room_location}
              </div>
            )}
          </div>
          {track.is_behind_schedule && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs">
              <AlertTriangle className="w-3 h-3" />
              +{track.minutes_behind}m
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-stone-400">Progress</span>
            <span className="text-stone-100 font-medium">
              {track.completed_count}/{track.total_submissions} ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Presenter with Timer */}
        {track.current_presenter ? (
          <div className={cn(
            'p-3 rounded-lg border',
            track.presenter_elapsed_minutes && track.presenter_elapsed_minutes > 7
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-green-500/10 border-green-500/30'
          )}>
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs text-green-400 font-medium uppercase">
                Now Presenting
              </div>
              {track.presenter_elapsed_minutes !== null && (
                <div className={cn(
                  'flex items-center gap-1 text-xs font-mono',
                  track.presenter_elapsed_minutes > 7 ? 'text-amber-400' : 'text-green-400'
                )}>
                  <Timer className="w-3 h-3" />
                  {track.presenter_elapsed_minutes}m
                </div>
              )}
            </div>
            <div className="text-stone-100 font-medium text-sm">
              {track.current_presenter.app_name}
            </div>
            <div className="text-xs text-stone-400">
              #{track.current_presenter.submission_number} - Slot {track.current_presenter.demo_slot}
            </div>
          </div>
        ) : track.pending_count > 0 ? (
          <div className="p-3 rounded-lg bg-stone-800/50 border border-stone-700 text-center">
            <div className="text-xs text-stone-400">No active presenter</div>
            <div className="text-sm text-stone-500">{track.pending_count} demos waiting</div>
          </div>
        ) : null}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-amber-400">{track.pending_count}</div>
            <div className="text-[10px] text-stone-500">Pending</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-green-400">{track.presenting_count}</div>
            <div className="text-[10px] text-stone-500">Live</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-blue-400">{track.completed_count}</div>
            <div className="text-[10px] text-stone-500">Done</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-stone-400">{track.skipped_count}</div>
            <div className="text-[10px] text-stone-500">Skip</div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {track.judges.length} judges
          </div>
          {track.estimated_end_time && track.pending_count > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Est. end: {formatTime(track.estimated_end_time)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
