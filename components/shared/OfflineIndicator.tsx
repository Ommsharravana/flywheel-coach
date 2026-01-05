'use client';

import React from 'react';
import { WifiOff, Wifi, CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useOffline } from '@/lib/context/OfflineContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface OfflineIndicatorProps {
  className?: string;
  showPendingCount?: boolean;
  compact?: boolean;
}

/**
 * Visual indicator for offline/slow connection status
 * Shows in corner of screen when offline or on slow connection
 */
export function OfflineIndicator({
  className,
  showPendingCount = true,
  compact = false,
}: OfflineIndicatorProps) {
  const { network, pendingActions, isProcessingQueue, processQueue } = useOffline();

  // Don't show if online and no issues
  if (network.isOnline && !network.isSlowConnection && pendingActions === 0) {
    return null;
  }

  const isOffline = !network.isOnline;
  const isSlowConnection = network.isOnline && network.isSlowConnection;
  const hasPending = pendingActions > 0;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium',
          isOffline
            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
            : isSlowConnection
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
          className
        )}
      >
        {isOffline ? (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        ) : isSlowConnection ? (
          <>
            <AlertTriangle className="h-3 w-3" />
            <span>Slow</span>
          </>
        ) : hasPending ? (
          <>
            <CloudOff className="h-3 w-3" />
            <span>{pendingActions}</span>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 p-4 rounded-lg shadow-lg max-w-sm',
        'border backdrop-blur-sm',
        isOffline
          ? 'bg-red-950/90 border-red-500/50 text-red-100'
          : isSlowConnection
          ? 'bg-yellow-950/90 border-yellow-500/50 text-yellow-100'
          : 'bg-blue-950/90 border-blue-500/50 text-blue-100',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-full',
            isOffline
              ? 'bg-red-500/20'
              : isSlowConnection
              ? 'bg-yellow-500/20'
              : 'bg-blue-500/20'
          )}
        >
          {isOffline ? (
            <WifiOff className="h-5 w-5" />
          ) : isSlowConnection ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CloudOff className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1">
          <h4 className="font-semibold text-sm">
            {isOffline
              ? 'No Internet Connection'
              : isSlowConnection
              ? 'Slow Connection'
              : 'Pending Actions'}
          </h4>

          <p className="text-xs opacity-80 mt-1">
            {isOffline ? (
              'You are working offline. Your actions will be saved and synced when you reconnect.'
            ) : isSlowConnection ? (
              <>
                Connection is slow ({network.effectiveType || 'limited'}).
                {network.rtt && ` RTT: ${network.rtt}ms`}
              </>
            ) : (
              `${pendingActions} action${pendingActions > 1 ? 's' : ''} waiting to sync.`
            )}
          </p>

          {showPendingCount && hasPending && !isOffline && (
            <Button
              variant="ghost"
              size="sm"
              onClick={processQueue}
              disabled={isProcessingQueue}
              className="mt-2 h-7 text-xs"
            >
              {isProcessingQueue ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Sync Now
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Connection details for debugging */}
      {network.isSlowConnection && network.downlink !== null && (
        <div className="mt-2 pt-2 border-t border-current/20 text-xs opacity-60">
          Speed: ~{network.downlink.toFixed(1)} Mbps
        </div>
      )}
    </div>
  );
}

/**
 * Simple inline badge for showing offline status in headers/navbars
 */
export function OfflineBadge({ className }: { className?: string }) {
  const { network } = useOffline();

  if (network.isOnline && !network.isSlowConnection) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        !network.isOnline
          ? 'bg-red-500/20 text-red-400'
          : 'bg-yellow-500/20 text-yellow-400',
        className
      )}
    >
      {!network.isOnline ? (
        <>
          <WifiOff className="h-3 w-3" />
          Offline
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3 animate-pulse" />
          Slow
        </>
      )}
    </span>
  );
}
