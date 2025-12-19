'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { JUDGING_CRITERIA, BONUS_CRITERIA } from '@/lib/appathon/content';
import { Trophy, Star, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JudgingCriteriaProps {
  compact?: boolean;
}

export function JudgingCriteria({ compact = false }: JudgingCriteriaProps) {
  if (compact) {
    return (
      <Card className="glass-card border-amber-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm text-stone-100">
            <Trophy className="w-4 h-4 text-amber-400" />
            Judging Criteria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {JUDGING_CRITERIA.map((criterion) => (
            <div
              key={criterion.name}
              className="flex justify-between text-xs items-center"
            >
              <span className="text-stone-400">{criterion.name}</span>
              <span className="text-amber-400 font-medium">
                {criterion.weight}%
              </span>
            </div>
          ))}
          <div className="pt-2 border-t border-stone-700 text-xs text-stone-500">
            + Bonus: Team diversity, testimonials
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-amber-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Trophy className="w-5 h-5 text-amber-400" />
          Judging Criteria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TooltipProvider>
          {JUDGING_CRITERIA.map((criterion) => (
            <div key={criterion.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-stone-200">{criterion.name}</span>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-stone-500" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{criterion.tips}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-amber-400 font-medium">
                  {criterion.weight}%
                </span>
              </div>
              <Progress value={criterion.weight} className="h-2" />
              <p className="text-xs text-stone-500">{criterion.description}</p>
            </div>
          ))}
        </TooltipProvider>

        <div className="pt-4 border-t border-stone-700">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-stone-200">
              Bonus Points
            </span>
          </div>
          <div className="space-y-2">
            {BONUS_CRITERIA.map((bonus) => (
              <div
                key={bonus.name}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{bonus.icon}</span>
                  <span className="text-stone-400">{bonus.name}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-emerald-400 border-emerald-500/50"
                >
                  +{bonus.points}%
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
