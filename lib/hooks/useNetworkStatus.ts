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
  isInitialized: boolean; // Flag to indicate if we've done the initial check
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
 * Get initial network status - ALWAYS start optimistic (online)
 * We'll verify actual connectivity after hydration
 */
function getInitialStatus(): NetworkStatus {
  // Always start optimistic - we'll verify after hydration
  // This prevents false "offline" flash during SSR/hydration
  return {
    isOnline: true,
    isSlowConnection: false,
    connectionType: null,
    downlink: null,
    rtt: null,
    effectiveType: null,
    wasOffline: false,
    isInitialized: false,
  };
}

/**
 * Verify actual network connectivity by making a real request
 * navigator.onLine is unreliable - this confirms with an actual fetch
 */
async function verifyConnectivity(): Promise<boolean> {
  try {
    // Use a small, cacheable request to verify connectivity
    // We fetch a tiny endpoint with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Try fetching a known reliable endpoint
    // Use HEAD request to minimize data transfer
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues - we just need to know if fetch succeeded
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return true; // If we got here, we're online
  } catch {
    // Fetch failed - could be offline or the specific endpoint is blocked
    // Fall back to navigator.onLine as secondary check
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}

/**
 * Custom hook to monitor network connectivity status
 * Designed for areas with poor/intermittent connectivity (hilly, remote areas)
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(getInitialStatus);
  const wasOfflineRef = useRef(false);
  const isInitializedRef = useRef(false);

  const updateNetworkInfo = useCallback((forceOnline?: boolean) => {
    if (typeof navigator === 'undefined') return;

    const connection = getConnection();
    // Use forceOnline if provided (from verification), otherwise trust navigator.onLine
    const isOnline = forceOnline !== undefined ? forceOnline : navigator.onLine;

    // Track if we were ever offline (but only after initialization)
    if (!isOnline && isInitializedRef.current) {
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
      isInitialized: isInitializedRef.current,
    });
  }, []);

  const handleOnline = useCallback(async () => {
    // Verify actual connectivity before declaring online
    const actuallyOnline = await verifyConnectivity();
    setStatus(prev => ({
      ...prev,
      isOnline: actuallyOnline,
      wasOffline: wasOfflineRef.current,
      isInitialized: true,
    }));
  }, []);

  const handleOffline = useCallback(() => {
    // Browser offline event is reliable - trust it
    wasOfflineRef.current = true;
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      wasOffline: true,
      isInitialized: true,
    }));
  }, []);

  // Initial connectivity verification after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;

    const initializeNetworkStatus = async () => {
      // Small delay to ensure hydration is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!isMounted) return;

      // Verify actual connectivity
      const isActuallyOnline = await verifyConnectivity();

      if (!isMounted) return;

      isInitializedRef.current = true;

      const connection = getConnection();
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
        isOnline: isActuallyOnline,
        isSlowConnection,
        connectionType,
        downlink,
        rtt,
        effectiveType,
        wasOffline: false,
        isInitialized: true,
      });
    };

    initializeNetworkStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (Network Information API)
    const connection = getConnection();
    if (connection) {
      connection.addEventListener('change', () => updateNetworkInfo());
    }

    // Periodic check for slow connections (every 30 seconds)
    const intervalId = setInterval(() => updateNetworkInfo(), 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', () => updateNetworkInfo());
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
