'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, TrendingUp, Loader2 } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  name: string;
  short_name: string;
  total_cycles: number;
  completed_cycles: number;
  problems_identified: number;
  problems_saved: number;
  problems_solved: number;
  problems_validated: number;
}

interface LeaderboardData {
  event?: {
    id: string;
    name: string;
    slug: string;
  };
  leaderboard: LeaderboardEntry[];
  totals: {
    total_cycles: number;
    completed_cycles: number;
    problems_identified: number;
    problems_saved: number;
    institutions: number;
  };
}

interface InstitutionLeaderboardProps {
  eventSlug?: string; // Optional: defaults to appathon-2
}

export function InstitutionLeaderboard({ eventSlug = 'appathon-2' }: InstitutionLeaderboardProps) {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(`/api/problems/leaderboard/public?event=${eventSlug}`);
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [eventSlug]);

  if (loading) {
    return (
      <Card className="bg-stone-900/50 border-stone-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || data.leaderboard.length === 0) {
    return null; // Don't show if no data
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="w-5 text-center text-stone-500 font-medium">{index + 1}</span>;
  };

  const getRankBg = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/30';
    if (index === 1) return 'bg-gradient-to-r from-gray-400/20 to-gray-500/10 border-gray-400/30';
    if (index === 2) return 'bg-gradient-to-r from-amber-600/20 to-orange-600/10 border-amber-600/30';
    return 'bg-stone-800/50 border-stone-700/50';
  };

  return (
    <Card className="bg-gradient-to-br from-stone-900/80 to-stone-900/50 border-stone-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-stone-100">
          <TrendingUp className="h-5 w-5 text-amber-400" />
          Institution Leaderboard
        </CardTitle>
        <p className="text-sm text-stone-500">
          Which institution will lead Appathon 2.0?
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.leaderboard.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${getRankBg(index)}`}
            >
              <div className="flex items-center gap-3">
                {getRankIcon(index)}
                <div>
                  <span className="font-medium text-stone-100">{entry.short_name}</span>
                  {entry.short_name !== entry.name && (
                    <p className="text-xs text-stone-500 truncate max-w-[150px]">{entry.name}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-right">
                  <span className="font-bold text-amber-400">{entry.problems_identified}</span>
                  <span className="text-stone-500 ml-1">problems</span>
                </div>
                <div className="text-right hidden sm:block">
                  <span className="font-medium text-stone-300">{entry.total_cycles}</span>
                  <span className="text-stone-500 ml-1">cycles</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-stone-700/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-stone-100">{data.totals.institutions}</div>
              <div className="text-xs text-stone-500">Institutions</div>
            </div>
            <div>
              <div className="text-xl font-bold text-amber-400">{data.totals.problems_identified}</div>
              <div className="text-xs text-stone-500">Problems Found</div>
            </div>
            <div>
              <div className="text-xl font-bold text-stone-100">{data.totals.total_cycles}</div>
              <div className="text-xs text-stone-500">Total Cycles</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
