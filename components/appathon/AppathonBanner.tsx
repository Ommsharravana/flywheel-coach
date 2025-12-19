'use client';

import { Trophy, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import {
  getDaysRemaining,
  getDemoDayCountdown,
  isBuildPhaseActive,
} from '@/lib/appathon/roadmap';
import { getTotalPrizePool } from '@/lib/appathon/content';

export function AppathonBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const daysRemaining = getDaysRemaining();
  const { days: demoDays, isDemo } = getDemoDayCountdown();
  const isActive = isBuildPhaseActive();
  const prizePool = getTotalPrizePool();

  let statusText = '';
  if (isDemo) {
    statusText = "Demo Day is TODAY!";
  } else if (isActive) {
    statusText = `${daysRemaining} days left to build`;
  } else if (demoDays > 0 && demoDays <= 10) {
    statusText = `Demo Day in ${demoDays} days`;
  } else {
    statusText = 'Build Dec 21-30, Demo Jan 3';
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-sm text-stone-200">
            <strong>Appathon 2.0 Mode</strong> - {statusText}
          </span>
          <Badge
            variant="outline"
            className="text-xs text-amber-400 border-amber-500/50"
          >
            {prizePool.toLocaleString('en-IN', {
              style: 'currency',
              currency: 'INR',
              maximumFractionDigits: 0,
            })}{' '}
            in prizes
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/JKKN-Institutions/MYJKKN-Context"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:underline flex items-center gap-1"
          >
            MyJKKN Context <ExternalLink className="w-3 h-3" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setDismissed(true)}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
