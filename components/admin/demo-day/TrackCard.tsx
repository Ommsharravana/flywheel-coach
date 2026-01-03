'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pause,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import type { TrackOverview } from '@/lib/admin/demo-day/types';
import { cn } from '@/lib/utils';

interface TrackCardProps {
  track: TrackOverview;
  onSelect: (trackId: string) => void;
  isSelected?: boolean;
}

export function TrackCard({ track, onSelect, isSelected }: TrackCardProps) {
  const progressPercent = track.total_submissions > 0
    ? Math.round((track.completed_count / track.total_submissions) * 100)
    : 0;

  const getStatusColor = () => {
    switch (track.status) {
      case 'in-progress':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delayed':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'paused':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default:
        return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
    }
  };

  const getStatusIcon = () => {
    switch (track.status) {
      case 'in-progress':
        return <Play className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'delayed':
        return <AlertCircle className="w-3 h-3" />;
      case 'paused':
        return <Pause className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <Card
      className={cn(
        'glass-card cursor-pointer transition-all hover:border-amber-500/50',
        isSelected && 'border-amber-500 ring-1 ring-amber-500/50'
      )}
      onClick={() => onSelect(track.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
              {track.name}
              <Badge variant="outline" className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1 capitalize">{track.status.replace('-', ' ')}</span>
              </Badge>
            </CardTitle>
            {track.room_location && (
              <div className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                <MapPin className="w-3 h-3" />
                {track.room_location}
              </div>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-stone-500" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stone-400">Progress</span>
            <span className="text-stone-100 font-medium">
              {track.completed_count}/{track.total_submissions}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Current Presenter */}
        {track.current_presenter && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="text-xs text-green-400 font-medium mb-1">NOW PRESENTING</div>
            <div className="text-stone-100 font-medium">
              {track.current_presenter.app_name}
            </div>
            <div className="text-xs text-stone-400">
              #{track.current_presenter.submission_number} - Slot {track.current_presenter.demo_slot}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-amber-400">{track.pending_count}</div>
            <div className="text-xs text-stone-500">Pending</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-green-400">{track.presenting_count}</div>
            <div className="text-xs text-stone-500">Live</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-blue-400">{track.completed_count}</div>
            <div className="text-xs text-stone-500">Done</div>
          </div>
          <div className="p-2 rounded bg-stone-800/50">
            <div className="text-lg font-bold text-stone-400">{track.skipped_count}</div>
            <div className="text-xs text-stone-500">Skip</div>
          </div>
        </div>

        {/* Judges */}
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-stone-500" />
          <div className="flex items-center gap-1 flex-wrap">
            {track.judges.length > 0 ? (
              track.judges.map((judge) => (
                <Badge
                  key={judge.id}
                  variant="outline"
                  className={cn(
                    'text-xs',
                    judge.is_lead && 'bg-amber-500/20 border-amber-500/30'
                  )}
                >
                  {judge.user?.name || judge.user?.email || 'Judge'}
                  {judge.is_lead && ' (Lead)'}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-stone-500">No judges assigned</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
