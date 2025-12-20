'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, RefreshCw, Zap } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [existingCredential, setExistingCredential] = useState<ProviderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to disconnect your Gemini subscription? You can reconnect by signing out and signing back in with Google.')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=gemini', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect');
    }
  };

  const handleReconnect = () => {
    // Trigger Google sign-in again to refresh tokens
    window.location.href = '/login?reconnect=gemini';
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
          AI Coach - Powered by Your Gemini Subscription
        </CardTitle>
        <CardDescription>
          The AI Coach uses your own Google Gemini subscription through your Google account
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

        {/* Connected State */}
        {existingCredential ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Gemini Connected</div>
                <div className="text-sm text-stone-400">
                  AI Coach is powered by your Google Gemini subscription
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                {existingCredential.isValid ? 'Active' : 'Expired'}
              </Badge>
            </div>

            {/* Info about BYOS */}
            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Bring Your Own Subscription</h4>
                  <p className="text-sm text-stone-400">
                    Your AI Coach uses your own Google Gemini subscription.
                    This means you get the full power of Gemini with your existing quota.
                    No additional costs from JKKN - you use your Google subscription directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Last validated */}
            {existingCredential.lastValidated && (
              <p className="text-xs text-stone-500">
                Last verified: {new Date(existingCredential.lastValidated).toLocaleString()}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {!existingCredential.isValid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReconnect}
                  className="text-teal-400 border-teal-500/30 hover:bg-teal-500/10"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reconnect
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* Not Connected State */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Gemini Not Connected</div>
                <div className="text-sm text-stone-400">
                  Sign out and sign back in with Google to connect your Gemini subscription
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <h4 className="font-medium text-stone-200 mb-2">How it works:</h4>
              <ol className="space-y-1 text-sm text-stone-400 list-decimal list-inside">
                <li>Sign in with your Google account</li>
                <li>Grant access to Gemini API when prompted</li>
                <li>AI Coach automatically uses your Gemini subscription</li>
                <li>No API keys needed - it&apos;s all through your Google account</li>
              </ol>
            </div>

            <Button
              onClick={handleReconnect}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
            >
              Sign in with Google to Connect
            </Button>

            <p className="text-xs text-stone-500 text-center">
              Your credentials are encrypted and stored securely
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
