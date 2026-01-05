'use client';

import { useState, useEffect, useCallback } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  downlink: number | null;
  rtt: number | null;
  effectiveType: string | null;
  wasOffline: boolean;
}

/**
 * Custom hook to monitor network connectivity status
 * Designed for areas with poor/intermittent connectivity (hilly, remote areas)
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSlowConnection: false,
    connectionType: null,
    downlink: null,
    rtt: null,
    effectiveType: null,
    wasOffline: false,
  });

  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    const isOnline = navigator.onLine;
    const wasOffline = !isOnline || status.wasOffline;

    let isSlowConnection = false;
    let connectionType: string | null = null;
    let downlink: number | null = null;
    let rtt: number | null = null;
    let effectiveType: string | null = null;

    if (connection) {
      connectionType = connection.type || null;
      downlink = connection.downlink || null;
      rtt = connection.rtt || null;
      effectiveType = connection.effectiveType || null;

      // Consider connection slow if:
      // - effectiveType is '2g' or 'slow-2g'
      // - RTT > 500ms
      // - downlink < 0.5 Mbps
      isSlowConnection =
        effectiveType === '2g' ||
        effectiveType === 'slow-2g' ||
        (rtt !== null && rtt > 500) ||
        (downlink !== null && downlink < 0.5);
    }

    setStatus({
      isOnline,
      isSlowConnection,
      connectionType,
      downlink,
      rtt,
      effectiveType,
      wasOffline,
    });
  }, [status.wasOffline]);

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
    }));
    updateNetworkInfo();
  }, [updateNetworkInfo]);

  const handleOffline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial check
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (Network Information API)
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    // Periodic check for slow connections (every 30 seconds)
    const intervalId = setInterval(updateNetworkInfo, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }

      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, updateNetworkInfo]);

  return status;
}

/**
 * Utility to check if we should attempt a network request
 */
export function shouldAttemptRequest(status: NetworkStatus): boolean {
  return status.isOnline;
}

/**
 * Utility to get a user-friendly message about connection status
 */
export function getConnectionMessage(status: NetworkStatus): string {
  if (!status.isOnline) {
    return 'You are offline. Some features may not be available.';
  }

  if (status.isSlowConnection) {
    const type = status.effectiveType || 'slow';
    return `Slow connection detected (${type}). Loading may take longer.`;
  }

  return '';
}
