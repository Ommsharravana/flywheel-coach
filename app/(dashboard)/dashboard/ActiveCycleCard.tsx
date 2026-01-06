'use client';

import { CycleNameEditor } from '@/components/shared/CycleNameEditor';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface FlywheelStep {
  number: number;
  name: string;
}

interface ActiveCycleCardProps {
  cycleId: string;
  cycleName: string;
  currentStep: number;
  startedAt: string;
  flywheelSteps: FlywheelStep[];
  locale: string;
  eventName?: string;
  eventBannerColor?: string;
  translations: {
    currentCycle: string;
    untitledCycle: string;
    started: string;
    continue: string;
  };
}

// Event color classes mapping
const eventColorClasses: Record<string, { text: string; border: string; bg: string }> = {
  amber: { text: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10' },
  violet: { text: 'text-violet-400', border: 'border-violet-500/50', bg: 'bg-violet-500/10' },
  rose: { text: 'text-rose-400', border: 'border-rose-500/50', bg: 'bg-rose-500/10' },
  sky: { text: 'text-sky-400', border: 'border-sky-500/50', bg: 'bg-sky-500/10' },
};

export function ActiveCycleCard({
  cycleId,
  cycleName,
  currentStep,
  startedAt,
  flywheelSteps,
  locale,
  eventName,
  eventBannerColor,
  translations,
}: ActiveCycleCardProps) {
  const router = useRouter();

  const handleNameChange = () => {
    router.refresh();
  };

  const colors = eventColorClasses[eventBannerColor || 'amber'] || eventColorClasses.amber;

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-xl font-semibold text-stone-100">
              {translations.currentCycle}:
            </span>
            <CycleNameEditor
              cycleId={cycleId}
              initialName={cycleName || translations.untitledCycle}
              onNameChange={handleNameChange}
              textClassName="font-display text-xl font-semibold text-amber-400"
              iconSize="sm"
            />
            {eventName && (
              <Badge variant="outline" className={`${colors.text} ${colors.border} ${colors.bg}`}>
                {eventName}
              </Badge>
            )}
          </div>
          <p className="text-sm text-stone-400 mt-1" suppressHydrationWarning>
            {translations.started} {new Date(startedAt).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US')}
          </p>
        </div>
        <Button
          asChild
          className="bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
        >
          <Link href={`/cycle/${cycleId}/step/${currentStep}`}>
            {translations.continue}
          </Link>
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {flywheelSteps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div
              key={step.number}
              className={`relative flex flex-col items-center p-3 rounded-xl transition-all ${
                isCompleted
                  ? 'bg-amber-500/20'
                  : isCurrent
                  ? 'bg-gradient-to-br from-amber-500/30 to-orange-600/30 ring-2 ring-amber-500/50'
                  : 'bg-stone-800/50'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  isCompleted
                    ? 'bg-amber-500 text-stone-950'
                    : isCurrent
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950'
                    : 'bg-stone-700 text-stone-400'
                }`}
              >
                {isCompleted ? '\u2713' : step.number}
              </div>
              <span className={`mt-2 text-xs text-center ${
                isCompleted || isCurrent ? 'text-stone-200' : 'text-stone-500'
              }`}>
                {step.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
