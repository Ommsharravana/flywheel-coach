'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string | null;
  downlink: number | null;
  rtt: number | null;
  effectiveType: string | null;
  wasOffline: boolean;
}

// Network Information API types (not yet in TypeScript lib)
interface NetworkInformation extends EventTarget {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Get the connection API from navigator
 */
function getConnection(): NetworkInformation | null {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as NavigatorWithConnection;
  return nav.connection || nav.mozConnection || nav.webkitConnection || null;
}

/**
 * Get initial network status synchronously
 */
function getInitialStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') {
    return {
      isOnline: true,
      isSlowConnection: false,
      connectionType: null,
      downlink: null,
      rtt: null,
      effectiveType: null,
      wasOffline: false,
    };
  }

  const connection = getConnection();
  const isOnline = navigator.onLine;

  let isSlowConnection = false;
  let connectionType: string | null = null;
  let downlink: number | null = null;
  let rtt: number | null = null;
  let effectiveType: string | null = null;

  if (connection) {
    connectionType = connection.type || null;
    downlink = connection.downlink ?? null;
    rtt = connection.rtt ?? null;
    effectiveType = connection.effectiveType || null;

    isSlowConnection =
      effectiveType === '2g' ||
      effectiveType === 'slow-2g' ||
      (rtt !== null && rtt > 500) ||
      (downlink !== null && downlink < 0.5);
  }

  return {
    isOnline,
    isSlowConnection,
    connectionType,
    downlink,
    rtt,
    effectiveType,
    wasOffline: false,
  };
}

/**
 * Custom hook to monitor network connectivity status
 * Designed for areas with poor/intermittent connectivity (hilly, remote areas)
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getInitialStatus);
  const wasOfflineRef = useRef(false);

  const updateNetworkInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const connection = getConnection();
    const isOnline = navigator.onLine;

    // Track if we were ever offline
    if (!isOnline) {
      wasOfflineRef.current = true;
    }

    let isSlowConnection = false;
    let connectionType: string | null = null;
    let downlink: number | null = null;
    let rtt: number | null = null;
    let effectiveType: string | null = null;

    if (connection) {
      connectionType = connection.type || null;
      downlink = connection.downlink ?? null;
      rtt = connection.rtt ?? null;
      effectiveType = connection.effectiveType || null;

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
      wasOffline: wasOfflineRef.current,
    });
  }, []);

  const handleOnline = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      wasOffline: wasOfflineRef.current,
    }));
  }, []);

  const handleOffline = useCallback(() => {
    wasOfflineRef.current = true;
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (Network Information API)
    const connection = getConnection();
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
