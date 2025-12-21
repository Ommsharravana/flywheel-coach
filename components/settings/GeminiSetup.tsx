'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Zap, ExternalLink, Key, Gift } from 'lucide-react';

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
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCredential, setExistingCredential] = useState<ProviderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    const trimmedKey = apiKey.trim();

    if (!trimmedKey) {
      setError('Please enter your API key');
      return;
    }

    // Basic validation - Gemini API keys start with "AIza"
    if (!trimmedKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini API keys start with "AIza"');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          credentialType: 'api_key',
          credentials: trimmedKey,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Your API key connected! You now have unlimited AI usage.');
        setApiKey('');
        setShowAdvanced(false);
        await checkExisting();
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove your API key? You\'ll return to using the free tier.')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=gemini', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
        setSuccess('Switched back to free tier.');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to remove');
      }
    } catch {
      setError('Failed to remove');
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
          AI features are enabled and ready to use
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

        {/* User has their own key connected */}
        {existingCredential ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Your API Key Connected</div>
                <div className="text-sm text-stone-400">
                  Unlimited AI usage with your own key
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                {existingCredential.isValid ? 'Active' : 'Check Key'}
              </Badge>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">No Limits</h4>
                  <p className="text-sm text-stone-400">
                    Using your own Gemini API key. Encrypted and secure.
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              className="text-stone-400 border-stone-600 hover:bg-stone-800"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove Key (Use Free Tier)
            </Button>
          </div>
        ) : (
          /* Default: Using free tier */
          <div className="space-y-4">
            {/* Free tier status */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-lg">
              <Gift className="w-6 h-6 text-green-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">AI Features Enabled</div>
                <div className="text-sm text-stone-400">
                  Using free tier - no setup needed
                </div>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Ready
              </Badge>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Just Start Building</h4>
                  <p className="text-sm text-stone-400">
                    AI Coach works out of the box. Create your first cycle and let AI guide you through the 8-step flywheel.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced: Add your own key (collapsed by default) */}
            <div className="pt-2 border-t border-stone-800">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-stone-500 hover:text-stone-400 flex items-center gap-1"
              >
                <Key className="w-3 h-3" />
                {showAdvanced ? 'Hide advanced options' : 'Advanced: Use your own API key'}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-stone-900/50 rounded-lg">
                  <p className="text-sm text-stone-400">
                    For unlimited usage, add your own free Gemini API key:
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                      className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Get Free API Key
                    </Button>
                  </div>

                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                    <Input
                      type="password"
                      placeholder="Paste your API key (AIza...)"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setError(null);
                      }}
                      className="pl-10 bg-stone-900 border-stone-700 text-stone-300 placeholder:text-stone-600"
                    />
                  </div>

                  <Button
                    onClick={handleConnect}
                    disabled={isSubmitting || !apiKey.trim()}
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect My Key'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
