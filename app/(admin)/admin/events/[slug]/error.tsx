'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function EventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('[EventError] Caught error:', error);
    console.error('[EventError] Error message:', error.message);
    console.error('[EventError] Error digest:', error.digest);
    console.error('[EventError] Error stack:', error.stack);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-950 p-6">
      <div className="max-w-md w-full bg-stone-900 border border-stone-800 rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-red-400">Something went wrong!</h2>
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
            onClick={() => window.location.href = '/admin/events'}
            variant="ghost"
          >
            Back to Events
          </Button>
        </div>
        {process.env.NODE_ENV === 'development' && error.stack && (
          <details className="mt-4">
            <summary className="text-xs text-stone-500 cursor-pointer">Stack trace</summary>
            <pre className="mt-2 text-xs text-stone-600 overflow-auto max-h-40 p-2 bg-stone-950 rounded">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
