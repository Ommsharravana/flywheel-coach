'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[AdminError] Caught error:', error);
    console.error('[AdminError] Error message:', error.message);
    console.error('[AdminError] Error digest:', error.digest);
    console.error('[AdminError] Error stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-6">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-red-400">Admin Error</h2>
        <div className="space-y-2 text-sm">
          <p className="text-stone-300">
            <span className="font-medium text-stone-100">Error:</span>{' '}
            {error.message || 'Unknown error'}
          </p>
          {error.digest && (
            <p className="text-stone-400">
              <span className="font-medium">Digest:</span> {error.digest}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button
            onClick={reset}
            variant="outline"
            className="border-stone-700"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="ghost"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
