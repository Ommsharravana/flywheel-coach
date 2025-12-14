'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StepData {
  step: number;
  label: string;
  count: number;
  total: number;
}

interface StepFunnelChartProps {
  data: StepData[];
  title?: string;
}

const stepLabels: Record<number, string> = {
  1: 'Problem',
  2: 'Context',
  3: 'Value',
  4: 'Workflow',
  5: 'Prompt',
  6: 'Building',
  7: 'Deploy',
  8: 'Impact',
};

export function StepFunnelChart({ data, title = 'Step Funnel' }: StepFunnelChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg text-stone-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => {
            const percentage = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
            const barWidth = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;

            return (
              <div key={item.step} className="flex items-center gap-3">
                <div className="w-16 flex items-center gap-2">
                  <span className="w-6 text-xs font-medium text-amber-400">S{item.step}</span>
                  <span className="text-xs text-stone-500 truncate">
                    {stepLabels[item.step] || item.label}
                  </span>
                </div>
                <div className="flex-1 h-7 bg-stone-800 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-lg transition-all duration-500"
                    style={{ width: `${Math.max(barWidth, 2)}%` }}
                  />
                  {item.count > 0 && (
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-medium text-white drop-shadow-md">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="w-10 text-xs text-stone-500 text-right">{percentage}%</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-stone-700">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Users at each step</span>
            <span>Total: {data.reduce((acc, d) => acc + d.count, 0)} active cycles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
