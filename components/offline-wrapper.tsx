'use client';

import React from 'react';
import { OfflineProvider } from '@/lib/context/OfflineContext';
import { OfflineIndicator } from '@/components/shared/OfflineIndicator';

interface OfflineWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper that provides offline handling functionality
 * - Monitors network status
 * - Shows offline/slow connection indicators
 * - Manages queued actions for when network returns
 */
export function OfflineWrapper({ children }: OfflineWrapperProps) {
  return (
    <OfflineProvider>
      {children}
      <OfflineIndicator />
    </OfflineProvider>
  );
}
