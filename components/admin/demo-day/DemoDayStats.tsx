'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Presentation, Users, Vote, CheckCircle2 } from 'lucide-react';
import type { DemoDayState } from '@/lib/admin/demo-day/types';

interface DemoDayStatsProps {
  state: DemoDayState;
}

export function DemoDayStats({ state }: DemoDayStatsProps) {
  const progressPercent = state.total_submissions > 0
    ? Math.round((state.total_completed / state.total_submissions) * 100)
    : 0;

  const stats = [
    {
      label: 'Total Demos',
      value: state.total_submissions,
      icon: Presentation,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      label: 'Completed',
      value: state.total_completed,
      icon: CheckCircle2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      suffix: ` (${progressPercent}%)`,
    },
    {
      label: 'Active Judges',
      value: state.total_judges,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      label: 'Audience Votes',
      value: state.total_votes,
      icon: Vote,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="glass-card">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-stone-100">
                  {stat.value.toLocaleString()}
                  {stat.suffix && <span className="text-sm text-stone-400">{stat.suffix}</span>}
                </div>
                <div className="text-xs text-stone-500">{stat.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
