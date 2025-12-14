'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GrowthData {
  period: string;
  label: string;
  count: number;
}

interface UserGrowthChartProps {
  data: GrowthData[];
  title?: string;
}

export function UserGrowthChart({ data, title = 'User Growth' }: UserGrowthChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((acc, d) => acc + d.count, 0);

  // Calculate trend
  const recentHalf = data.slice(Math.floor(data.length / 2));
  const olderHalf = data.slice(0, Math.floor(data.length / 2));
  const recentAvg = recentHalf.length > 0 ? recentHalf.reduce((a, b) => a + b.count, 0) / recentHalf.length : 0;
  const olderAvg = olderHalf.length > 0 ? olderHalf.reduce((a, b) => a + b.count, 0) / olderHalf.length : 0;
  const trend = olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-stone-100">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {trend !== 0 && (
            <span
              className={`text-sm font-medium ${
                trend > 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
            </span>
          )}
          <span className="text-xs text-stone-500">vs previous period</span>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-stone-500">
            <p>No growth data yet</p>
          </div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="flex items-end gap-1 h-32">
              {data.map((item, index) => {
                const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={item.period}
                    className="flex-1 flex flex-col items-center group"
                  >
                    <div className="w-full relative">
                      <div
                        className="w-full bg-gradient-to-t from-amber-500 to-orange-400 rounded-t-sm transition-all duration-300 group-hover:from-amber-400 group-hover:to-orange-300"
                        style={{ height: `${Math.max(height, 2)}%`, minHeight: '4px' }}
                      />
                      {/* Tooltip */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-stone-700 text-stone-100 text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                          {item.count} users
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X-axis labels */}
            <div className="flex gap-1 mt-2">
              {data.map((item) => (
                <div key={item.period} className="flex-1 text-center">
                  <span className="text-xs text-stone-500 truncate block">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-stone-700">
              <div className="flex justify-between text-xs text-stone-500">
                <span>New users per period</span>
                <span>Total: {total} users</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
