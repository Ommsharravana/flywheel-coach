'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Medal, Award, Download, Loader2 } from 'lucide-react';
import type { LeaderboardEntry, TrackOverview } from '@/lib/admin/demo-day/types';
import { cn } from '@/lib/utils';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  tracks: TrackOverview[];
  isLoading: boolean;
  onExport: (trackId?: string) => void;
  isExporting: boolean;
}

export function LeaderboardView({
  entries,
  tracks,
  isLoading,
  onExport,
  isExporting,
}: LeaderboardViewProps) {
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'by-track' | 'overall'>('by-track');

  const filteredEntries = selectedTrack === 'all'
    ? entries
    : entries.filter(e => e.track_id === selectedTrack);

  // Group by track for by-track view
  const groupedByTrack = filteredEntries.reduce((acc, entry) => {
    if (!acc[entry.track_id]) {
      acc[entry.track_id] = [];
    }
    acc[entry.track_id].push(entry);
    return acc;
  }, {} as Record<string, LeaderboardEntry[]>);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-stone-500 font-mono">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/10';
    if (rank === 2) return 'bg-gray-500/10';
    if (rank === 3) return 'bg-amber-600/10';
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-card">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">Track:</span>
                <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                  <SelectTrigger className="w-48 bg-stone-800 border-stone-700">
                    <SelectValue placeholder="All Tracks" />
                  </SelectTrigger>
                  <SelectContent className="bg-stone-800 border-stone-700">
                    <SelectItem value="all">All Tracks</SelectItem>
                    {tracks.map(track => (
                      <SelectItem key={track.id} value={track.id}>
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-stone-400">View:</span>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === 'by-track' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('by-track')}
                    className={viewMode === 'by-track' ? 'bg-amber-600' : ''}
                  >
                    By Track
                  </Button>
                  <Button
                    variant={viewMode === 'overall' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('overall')}
                    className={viewMode === 'overall' ? 'bg-amber-600' : ''}
                  >
                    Overall
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(selectedTrack === 'all' ? undefined : selectedTrack)}
              disabled={isExporting}
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
        </div>
      ) : viewMode === 'by-track' ? (
        // By Track View
        <div className="space-y-6">
          {Object.entries(groupedByTrack).map(([trackId, trackEntries]) => {
            const track = tracks.find(t => t.id === trackId);
            return (
              <Card key={trackId} className="glass-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-stone-100">
                      {track?.name || 'Unknown Track'}
                    </CardTitle>
                    <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                      {trackEntries.length} submissions
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>App Name</TableHead>
                        <TableHead className="text-center">Judge Score</TableHead>
                        <TableHead className="text-center">Audience</TableHead>
                        <TableHead className="text-center">Bonus</TableHead>
                        <TableHead className="text-center">Final Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackEntries.slice(0, 10).map((entry) => (
                        <TableRow key={entry.submission_id} className={getRankBg(entry.rank)}>
                          <TableCell className="text-center">
                            {getRankIcon(entry.rank)}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-stone-100">{entry.app_name}</div>
                            <div className="text-xs text-stone-500">#{entry.submission_number}</div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium text-stone-100">
                              {entry.avg_judge_score.toFixed(1)}
                            </div>
                            <div className="text-xs text-stone-500">
                              {entry.judge_count} judges
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium text-stone-100">
                              {entry.audience_score.toFixed(1)}
                            </div>
                            <div className="text-xs text-stone-500">
                              {entry.vote_count} votes
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant="outline"
                              className={cn(
                                entry.avg_bonus > 0
                                  ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                  : 'bg-stone-500/20 text-stone-400 border-stone-500/30'
                              )}
                            >
                              +{entry.avg_bonus.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={cn(
                              'text-lg font-bold',
                              entry.rank === 1 && 'text-yellow-400',
                              entry.rank === 2 && 'text-gray-300',
                              entry.rank === 3 && 'text-amber-500',
                              entry.rank > 3 && 'text-stone-100'
                            )}>
                              {entry.final_score.toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Overall View
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg text-stone-100">Overall Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>App Name</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead className="text-center">Judge Score</TableHead>
                  <TableHead className="text-center">Audience</TableHead>
                  <TableHead className="text-center">Bonus</TableHead>
                  <TableHead className="text-center">Final Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries
                  .sort((a, b) => b.final_score - a.final_score)
                  .map((entry, idx) => (
                    <TableRow key={entry.submission_id} className={getRankBg(idx + 1)}>
                      <TableCell className="text-center">
                        {getRankIcon(idx + 1)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-stone-100">{entry.app_name}</div>
                        <div className="text-xs text-stone-500">#{entry.submission_number}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-stone-800/50">
                          {entry.track_name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium text-stone-100">
                          {entry.avg_judge_score.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium text-stone-100">
                          {entry.audience_score.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            entry.avg_bonus > 0
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-stone-500/20 text-stone-400 border-stone-500/30'
                          )}
                        >
                          +{entry.avg_bonus.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          'text-lg font-bold',
                          idx === 0 && 'text-yellow-400',
                          idx === 1 && 'text-gray-300',
                          idx === 2 && 'text-amber-500',
                          idx > 2 && 'text-stone-100'
                        )}>
                          {entry.final_score.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
