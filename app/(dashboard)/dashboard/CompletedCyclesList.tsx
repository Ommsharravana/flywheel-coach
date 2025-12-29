'use client';

import { CycleNameEditor } from '@/components/shared/CycleNameEditor';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface CompletedCycle {
  id: string;
  name: string | null;
  completed_at: string | null;
  impact_score: number | null;
}

interface CompletedCyclesListProps {
  cycles: CompletedCycle[];
  locale: string;
  translations: {
    completedCycles: string;
    untitledCycle: string;
    completed: string;
    notAvailable: string;
    pts: string;
    view: string;
  };
}

export function CompletedCyclesList({
  cycles,
  locale,
  translations,
}: CompletedCyclesListProps) {
  const router = useRouter();

  const handleNameChange = () => {
    router.refresh();
  };

  if (cycles.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <h2 className="font-display text-xl font-semibold text-stone-100 mb-4">
        {translations.completedCycles}
      </h2>
      <div className="space-y-3">
        {cycles.slice(0, 5).map((cycle) => (
          <div
            key={cycle.id}
            className="flex items-center justify-between p-4 rounded-xl bg-stone-800/50 hover:bg-stone-800/70 transition-colors"
          >
            <div>
              <CycleNameEditor
                cycleId={cycle.id}
                initialName={cycle.name || translations.untitledCycle}
                onNameChange={handleNameChange}
                textClassName="font-medium text-stone-100"
                iconSize="sm"
              />
              <p className="text-sm text-stone-400">
                {translations.completed} {cycle.completed_at ? new Date(cycle.completed_at).toLocaleDateString(locale === 'ta' ? 'ta-IN' : 'en-US') : translations.notAvailable}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-amber-400 font-semibold">
                {cycle.impact_score || 0} {translations.pts}
              </span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/cycle/${cycle.id}`}>{translations.view}</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
