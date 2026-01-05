'use client';

import React, { createContext, useContext, useEffect, useCallback, useState, useMemo } from 'react';
import { useNetworkStatus, NetworkStatus } from '@/lib/hooks/useNetworkStatus';
import {
  getQueue,
  removeFromQueue,
  incrementRetry,
  hasQueuedActions,
  getQueueCount,
  QueuedAction,
} from '@/lib/offline/queue';
import { toast } from 'sonner';

interface OfflineContextType {
  network: NetworkStatus;
  pendingActions: number;
  isProcessingQueue: boolean;
  processQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

// Action handlers registry - components can register handlers for their action types
type ActionHandler = (action: QueuedAction) => Promise<boolean>;
const actionHandlers: Map<string, ActionHandler> = new Map();

/**
 * Register a handler for a specific action type
 * Returns a cleanup function to unregister
 */
export function registerActionHandler(type: string, handler: ActionHandler): () => void {
  actionHandlers.set(type, handler);
  return () => actionHandlers.delete(type);
}

interface OfflineProviderProps {
  children: React.ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const network = useNetworkStatus();
  const [pendingActions, setPendingActions] = useState(0);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Update pending count periodically
  useEffect(() => {
    const updateCount = () => {
      setPendingActions(getQueueCount());
    };

    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  // Process queued actions when coming back online
  const processQueue = useCallback(async () => {
    if (!network.isOnline || isProcessingQueue) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    setIsProcessingQueue(true);

    let successCount = 0;
    let failCount = 0;

    for (const action of queue) {
      const handler = actionHandlers.get(action.type);

      if (!handler) {
        console.warn(`No handler registered for action type: ${action.type}`);
        continue;
      }

      try {
        const success = await handler(action);

        if (success) {
          removeFromQueue(action.id);
          successCount++;
        } else {
          const updated = incrementRetry(action.id);
          if (!updated) {
            failCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing queued action ${action.type}:`, error);
        const updated = incrementRetry(action.id);
        if (!updated) {
          failCount++;
        }
      }
    }

    setIsProcessingQueue(false);
    setPendingActions(getQueueCount());

    // Notify user of results
    if (successCount > 0) {
      toast.success(`Synced ${successCount} pending action${successCount > 1 ? 's' : ''}`);
    }
    if (failCount > 0) {
      toast.error(`Failed to sync ${failCount} action${failCount > 1 ? 's' : ''}`);
    }
  }, [network.isOnline, isProcessingQueue]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (network.isOnline && network.wasOffline && hasQueuedActions()) {
      // Delay slightly to ensure network is stable
      const timeout = setTimeout(() => {
        processQueue();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [network.isOnline, network.wasOffline, processQueue]);

  // Show toast when going offline/online
  useEffect(() => {
    if (!network.isOnline) {
      toast.error('You are offline', {
        description: 'Some features may not work. Actions will be saved and synced when you reconnect.',
        duration: 5000,
      });
    } else if (network.wasOffline) {
      toast.success('Back online!', {
        description: pendingActions > 0 ? `Syncing ${pendingActions} pending action${pendingActions > 1 ? 's' : ''}...` : 'Connection restored.',
        duration: 3000,
      });
    }
  }, [network.isOnline, network.wasOffline, pendingActions]);

  // Show warning for slow connections
  useEffect(() => {
    if (network.isOnline && network.isSlowConnection) {
      toast.warning('Slow connection detected', {
        description: 'Loading may take longer than usual.',
        duration: 4000,
      });
    }
  }, [network.isOnline, network.isSlowConnection]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo(
    () => ({
      network,
      pendingActions,
      isProcessingQueue,
      processQueue,
    }),
    [network, pendingActions, isProcessingQueue, processQueue]
  );

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextType {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

/**
 * Simple hook to just check if online (for components that don't need full context)
 */
export function useIsOnline(): boolean {
  const context = useContext(OfflineContext);
  return context?.network.isOnline ?? true;
}
