'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WorkflowData {
  type: string;
  count: number;
  color: string;
}

interface WorkflowPieChartProps {
  data: WorkflowData[];
  title?: string;
}

const workflowColors: Record<string, string> = {
  audit: 'bg-blue-500',
  generation: 'bg-green-500',
  transformation: 'bg-purple-500',
  classification: 'bg-amber-500',
  extraction: 'bg-red-500',
  synthesis: 'bg-cyan-500',
  prediction: 'bg-pink-500',
  recommendation: 'bg-orange-500',
  monitoring: 'bg-indigo-500',
  orchestration: 'bg-emerald-500',
};

export function WorkflowPieChart({ data, title = 'Workflow Distribution' }: WorkflowPieChartProps) {
  const total = data.reduce((acc, d) => acc + d.count, 0);

  // Calculate cumulative degrees for pie slices using reduce (immutable)
  const slices = data.reduce<Array<WorkflowData & { percentage: number; startDeg: number; endDeg: number }>>((acc, item) => {
    const percentage = total > 0 ? (item.count / total) * 100 : 0;
    const prevEndDeg = acc.length > 0 ? acc[acc.length - 1].endDeg : 0;
    const startDeg = prevEndDeg;
    const endDeg = startDeg + (percentage * 3.6);
    return [...acc, { ...item, percentage, startDeg, endDeg }];
  }, []);

  // Build conic gradient
  const gradientStops = slices.map((slice, index) => {
    const colorClass = workflowColors[slice.type.toLowerCase()] || 'bg-stone-500';
    const color = colorClass.replace('bg-', '');
    // Map tailwind color names to actual colors
    const colorMap: Record<string, string> = {
      'blue-500': '#3b82f6',
      'green-500': '#22c55e',
      'purple-500': '#a855f7',
      'amber-500': '#f59e0b',
      'red-500': '#ef4444',
      'cyan-500': '#06b6d4',
      'pink-500': '#ec4899',
      'orange-500': '#f97316',
      'indigo-500': '#6366f1',
      'emerald-500': '#10b981',
      'stone-500': '#78716c',
    };
    const hexColor = colorMap[color] || '#78716c';
    return `${hexColor} ${slice.startDeg}deg ${slice.endDeg}deg`;
  }).join(', ');

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg text-stone-100">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-stone-500">
            <p>No workflow data yet</p>
          </div>
        ) : (
          <div className="flex items-start gap-6">
            {/* Pie Chart */}
            <div className="relative">
              <div
                className="w-36 h-36 rounded-full"
                style={{
                  background: `conic-gradient(${gradientStops})`,
                }}
              />
              <div className="absolute inset-4 bg-stone-900 rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-stone-100">{total}</div>
                  <div className="text-xs text-stone-500">Total</div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {slices.map((item) => (
                <div key={item.type} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-sm ${workflowColors[item.type.toLowerCase()] || 'bg-stone-500'}`}
                  />
                  <span className="flex-1 text-sm text-stone-300 capitalize">{item.type}</span>
                  <span className="text-sm text-stone-500">{item.count}</span>
                  <span className="text-xs text-stone-600 w-10 text-right">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
