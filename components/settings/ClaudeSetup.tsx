'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, CheckCircle2, AlertCircle, Loader2, Trash2, Zap, ExternalLink } from 'lucide-react';

interface ProviderInfo {
  id: string;
  provider: string;
  credentialType: string;
  isValid: boolean;
  lastValidated: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export function ClaudeSetup() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCredential, setExistingCredential] = useState<ProviderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check URL params for success/error on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('claude') === 'connected') {
      setSuccess('Claude connected! AI features are now enabled.');
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Check for existing credentials on mount
  const checkExisting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/credentials');
      if (res.ok) {
        const data = await res.json();
        const claudeCred = data.providers?.find((p: ProviderInfo) => p.provider === 'claude');
        setExistingCredential(claudeCred || null);
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

    try {
      const res = await fetch('/api/auth/claude');
      const data = await res.json();

      if (res.ok && data.authUrl) {
        // Redirect to Claude OAuth
        window.location.href = data.authUrl;
      } else {
        setError(data.error || 'Failed to initiate connection');
        setIsConnecting(false);
      }
    } catch {
      setError('Failed to connect. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Claude? You will need to reconnect to use Claude AI features.')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=claude', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
        setSuccess('Claude disconnected.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch {
      setError('Failed to disconnect');
    }
  };

  const formatExpiryDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <Bot className="w-5 h-5 text-orange-400" />
          Claude AI
        </CardTitle>
        <CardDescription>
          Connect your Claude subscription for AI features
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
            <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-orange-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Claude Connected</div>
                <div className="text-sm text-stone-400">
                  Using your Claude subscription
                </div>
              </div>
              <Badge className={`${existingCredential.isValid ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                {existingCredential.isValid ? 'Active' : 'Expired'}
              </Badge>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Powered by Your Subscription</h4>
                  <p className="text-sm text-stone-400">
                    AI features use your Claude subscription. No additional costs.
                  </p>
                  {existingCredential.expiresAt && (
                    <p className="text-xs text-stone-500 mt-1">
                      Token expires: {formatExpiryDate(existingCredential.expiresAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {!existingCredential.isValid && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Reconnecting...
                  </>
                ) : (
                  'Reconnect Claude'
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
              Disconnect
            </Button>
          </div>
        ) : (
          /* Not connected state */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-stone-800/50 border border-stone-700 rounded-lg">
              <Bot className="w-6 h-6 text-stone-500" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Connect Claude</div>
                <div className="text-sm text-stone-400">
                  Use your Claude subscription for AI features
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Bot className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">What you need</h4>
                  <ul className="text-sm text-stone-400 list-disc list-inside space-y-1">
                    <li>A Claude Pro or Max subscription</li>
                    <li>Access to claude.ai</li>
                  </ul>
                </div>
              </div>
              <a
                href="https://claude.ai/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300"
              >
                <ExternalLink className="w-4 h-4" />
                Check your subscription
              </a>
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 mr-2" />
                  Connect Claude
                </>
              )}
            </Button>

            <p className="text-xs text-stone-500 text-center">
              You&apos;ll be redirected to Anthropic to authorize access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
