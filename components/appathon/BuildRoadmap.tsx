'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BUILD_PHASE_ROADMAP,
  getCurrentBuildDay,
  getPhaseStatus,
  getDaysRemaining,
  isBuildPhaseActive,
  type PhaseStatus,
} from '@/lib/appathon/roadmap';
import { APPATHON_DATES } from '@/lib/appathon/content';
import { Calendar, CheckCircle, Clock, Lightbulb, AlertCircle } from 'lucide-react';

interface BuildRoadmapProps {
  compact?: boolean;
}

export function BuildRoadmap({ compact = false }: BuildRoadmapProps) {
  const currentDay = getCurrentBuildDay();
  const daysRemaining = getDaysRemaining();
  const isActive = isBuildPhaseActive();

  const getStatusIcon = (status: PhaseStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'current':
        return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'upcoming':
        return <div className="w-4 h-4 rounded-full border border-stone-600" />;
    }
  };

  if (compact) {
    const currentPhase = BUILD_PHASE_ROADMAP.find(
      (phase) => getPhaseStatus(phase) === 'current'
    );

    return (
      <Card className="glass-card border-emerald-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm text-stone-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Build Progress
            </div>
            {isActive && (
              <Badge
                variant="outline"
                className="text-amber-400 border-amber-500/50"
              >
                Day {currentDay}/10
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!isActive && currentDay === 0 ? (
            <div className="text-xs text-stone-400">
              Build phase starts{' '}
              {new Date(APPATHON_DATES.buildPhaseStart).toLocaleDateString(
                'en-IN',
                { month: 'short', day: 'numeric' }
              )}
            </div>
          ) : currentPhase ? (
            <>
              <div className="text-xs text-stone-200 font-medium">
                {currentPhase.title}
              </div>
              <div className="text-xs text-stone-400">
                {daysRemaining > 0
                  ? `${daysRemaining} days remaining`
                  : 'Submission deadline!'}
              </div>
            </>
          ) : (
            <div className="text-xs text-stone-400">Build phase complete</div>
          )}
          <div className="flex gap-1 mt-2">
            {BUILD_PHASE_ROADMAP.map((phase, idx) => {
              const status = getPhaseStatus(phase);
              return (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    status === 'completed'
                      ? 'bg-emerald-500'
                      : status === 'current'
                      ? 'bg-amber-500'
                      : 'bg-stone-700'
                  }`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-emerald-500/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-stone-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            10-Day Build Roadmap
          </div>
          {isActive ? (
            <Badge
              variant="outline"
              className="text-amber-400 border-amber-500/50"
            >
              Day {currentDay}/10
            </Badge>
          ) : currentDay === 0 ? (
            <Badge
              variant="outline"
              className="text-stone-400 border-stone-500/50"
            >
              Starts Dec 21
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-emerald-400 border-emerald-500/50"
            >
              Build Complete
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {daysRemaining > 0 && daysRemaining <= 3 && isActive && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
            <div className="text-sm">
              <span className="font-medium text-red-400">
                {daysRemaining} day{daysRemaining > 1 ? 's' : ''} left!
              </span>
              <span className="text-stone-400">
                {' '}
                Focus on polishing, not new features.
              </span>
            </div>
          </div>
        )}

        {BUILD_PHASE_ROADMAP.map((phase, idx) => {
          const status = getPhaseStatus(phase);
          return (
            <div
              key={idx}
              className={`p-4 rounded-lg border transition-all ${
                status === 'current'
                  ? 'bg-emerald-500/20 border-emerald-500/50'
                  : status === 'completed'
                  ? 'bg-stone-800/30 border-stone-700 opacity-60'
                  : 'bg-stone-800/30 border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span
                    className={`font-medium ${
                      status === 'current' ? 'text-emerald-400' : 'text-stone-200'
                    }`}
                  >
                    Days {phase.days}: {phase.title}
                  </span>
                </div>
                {status === 'current' && (
                  <Badge className="bg-emerald-500 text-white">
                    Current Phase
                  </Badge>
                )}
              </div>

              <ul className="ml-6 space-y-1 text-sm text-stone-400">
                {phase.tasks.map((task, taskIdx) => (
                  <li key={taskIdx} className="list-disc">
                    {task}
                  </li>
                ))}
              </ul>

              {status === 'current' && phase.tips.length > 0 && (
                <div className="mt-3 p-2 bg-amber-500/10 rounded border border-amber-500/30">
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-medium mb-1">
                    <Lightbulb className="w-3 h-3" />
                    Tips
                  </div>
                  <ul className="text-xs text-stone-400 space-y-0.5">
                    {phase.tips.map((tip, tipIdx) => (
                      <li key={tipIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
