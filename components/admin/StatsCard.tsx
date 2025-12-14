'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users, Repeat, Target, TrendingUp, Activity, type LucideIcon } from 'lucide-react';

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  users: Users,
  repeat: Repeat,
  target: Target,
  trending: TrendingUp,
  activity: Activity,
};

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  iconName,
  trend,
  className,
}: StatsCardProps) {
  const Icon = iconName ? iconMap[iconName] : null;

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-stone-400">
          {title}
        </CardTitle>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Icon className="h-4 w-4 text-amber-400" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-stone-100">{value}</div>
        {description && (
          <p className="text-xs text-stone-500 mt-1">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-xs text-stone-500">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
