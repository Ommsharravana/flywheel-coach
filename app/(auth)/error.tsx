'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AuthError]', error.message, error.digest);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-stone-950">
      <Card className="max-w-md w-full bg-stone-900/50 border-stone-800">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-400" />
          </div>
          <CardTitle className="text-xl text-stone-100">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-stone-400">
            {error.message || 'There was a problem with authentication. Please try again.'}
          </p>

          {error.digest && (
            <p className="text-center text-xs text-stone-600">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex gap-3 justify-center">
            <Button
              onClick={reset}
              className="bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button
              onClick={() => window.location.href = '/login'}
              variant="outline"
              className="border-stone-700 text-stone-300 hover:bg-stone-800"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
