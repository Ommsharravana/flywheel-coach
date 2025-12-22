'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Zap } from 'lucide-react';

interface ProviderInfo {
  id: string;
  provider: string;
  credentialType: string;
  isValid: boolean;
  lastValidated: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function GeminiSetup() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCredential, setExistingCredential] = useState<ProviderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check for OAuth callback results
  useEffect(() => {
    const geminiSuccess = searchParams.get('gemini_success');
    const geminiError = searchParams.get('gemini_error');

    if (geminiSuccess === 'true') {
      setSuccess('Google account connected! AI features are now enabled.');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (geminiError) {
      const errorMessages: Record<string, string> = {
        'access_denied': 'Access was denied. Please try again and grant the required permissions.',
        'missing_params': 'Something went wrong. Please try again.',
        'invalid_state': 'Session expired. Please try again.',
        'expired': 'The connection request expired. Please try again.',
        'auth_mismatch': 'Authentication mismatch. Please sign in and try again.',
        'not_configured': 'Google Sign-in is not configured. Contact administrator.',
        'token_exchange_failed': 'Failed to complete sign-in. Please try again.',
        'validation_failed': 'Could not validate Google account. Please try again.',
        'storage_failed': 'Failed to save credentials. Please try again.',
        'internal': 'An unexpected error occurred. Please try again.',
      };
      setError(errorMessages[geminiError] || 'Failed to connect. Please try again.');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    }
  }, [searchParams]);

  // Check for existing credentials on mount
  const checkExisting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        const geminiCred = data.providers?.find((p: ProviderInfo) => p.provider === 'gemini');
        setExistingCredential(geminiCred || null);
      }
    } catch (err) {
      console.error('Error checking credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkExisting();
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the OAuth URL from the API
      const res = await fetch('/api/auth/gemini');
      const data = await res.json();

      if (res.ok && data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to start Google Sign-in');
        setIsConnecting(false);
      }
    } catch {
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect your Google account? AI features will be disabled until you reconnect.')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=gemini', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
        setSuccess('Google account disconnected.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect');
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Sparkles className="w-5 h-5 text-teal-400" />
          AI Coach
        </CardTitle>
        <CardDescription>
          Connect your Google account to enable AI features
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        {existingCredential ? (
          /* Connected state */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Google Account Connected</div>
                <div className="text-sm text-stone-400">
                  AI features are enabled using your subscription
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                {existingCredential.isValid ? 'Active' : 'Reconnect Needed'}
              </Badge>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Unlimited AI Usage</h4>
                  <p className="text-sm text-stone-400">
                    Using your Google/Gemini subscription. All AI features powered by your account.
                  </p>
                </div>
              </div>
            </div>

            {!existingCredential.isValid && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Reconnect Google Account
                  </>
                )}
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-stone-400 border-stone-600 hover:bg-stone-800"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Disconnect Account
            </Button>
          </div>
        ) : (
          /* Not connected state */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Connect Google to Enable AI</div>
                <div className="text-sm text-stone-400">
                  Sign in with Google to use the AI Coach and other AI features
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Bring Your Own Subscription</h4>
                  <p className="text-sm text-stone-400">
                    Your Google account gives you access to Gemini AI. All usage is powered by your subscription - completely free for you.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>

            <p className="text-xs text-stone-500 text-center">
              We only request permission to use Gemini AI on your behalf. We never access your email, Drive, or other data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
