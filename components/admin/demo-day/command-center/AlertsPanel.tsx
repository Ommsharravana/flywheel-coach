'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Bell,
  Clock,
  User,
  BarChart3,
  ChevronRight,
  XCircle,
  Pause,
} from 'lucide-react';
import type { CommandCenterAlert } from '@/lib/admin/demo-day/command-center-types';
import { cn } from '@/lib/utils';

interface AlertsPanelProps {
  alerts: CommandCenterAlert[];
  onDismiss?: (alertId: string) => void;
  onAction?: (alert: CommandCenterAlert) => void;
}

export function AlertsPanel({ alerts, onDismiss, onAction }: AlertsPanelProps) {
  const getAlertIcon = (type: CommandCenterAlert['type']) => {
    switch (type) {
      case 'judge-inactive':
        return <User className="w-4 h-4" />;
      case 'score-anomaly':
        return <BarChart3 className="w-4 h-4" />;
      case 'track-delayed':
        return <Clock className="w-4 h-4" />;
      case 'track-stalled':
        return <Pause className="w-4 h-4" />;
      case 'scoring-incomplete':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getAlertColor = (severity: CommandCenterAlert['severity']) => {
    return severity === 'critical'
      ? 'border-red-500/50 bg-red-500/10'
      : 'border-amber-500/50 bg-amber-500/10';
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;

  if (alerts.length === 0) {
    return (
      <Card className="glass-card border-green-500/30">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3 text-green-400">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">All Systems Normal</div>
              <div className="text-sm text-stone-400">No alerts or issues detected</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      'glass-card',
      criticalCount > 0 ? 'border-red-500/50' : 'border-amber-500/50'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-stone-100 flex items-center gap-2">
            <Bell className={cn(
              'w-5 h-5',
              criticalCount > 0 ? 'text-red-400 animate-pulse' : 'text-amber-400'
            )} />
            Active Alerts
          </CardTitle>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 animate-pulse">
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                {warningCount} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  getAlertColor(alert.severity)
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                      alert.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    )}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-stone-100 text-sm">
                          {alert.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            alert.severity === 'critical'
                              ? 'border-red-500/30 text-red-400'
                              : 'border-amber-500/30 text-amber-400'
                          )}
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        {alert.description}
                      </p>
                      <div className="text-xs text-stone-500 mt-2">
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {onAction && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'h-7 px-2',
                          alert.severity === 'critical'
                            ? 'text-red-400 hover:bg-red-500/20'
                            : 'text-amber-400 hover:bg-amber-500/20'
                        )}
                        onClick={() => onAction(alert)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                    {onDismiss && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-stone-400 hover:text-stone-100 hover:bg-stone-700"
                        onClick={() => onDismiss(alert.id)}
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
