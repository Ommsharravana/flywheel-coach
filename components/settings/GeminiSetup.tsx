'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Zap, ExternalLink, Key } from 'lucide-react';

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
        setSuccess('Gemini connected! Your AI Coach is now powered by your Gemini API.');
        setApiKey('');
        await checkExisting();
      } else {
        setError(data.error || 'Failed to connect Gemini');
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Disconnect your Gemini API key?')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=gemini', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
        setSuccess('Gemini disconnected.');
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
          AI Coach - Powered by Gemini
        </CardTitle>
        <CardDescription>
          Connect your free Gemini API key to enable AI features
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

        {/* Connected State */}
        {existingCredential ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-teal-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Gemini Connected</div>
                <div className="text-sm text-stone-400">
                  AI Coach is ready to help you
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                {existingCredential.isValid ? 'Active' : 'Check Key'}
              </Badge>
            </div>

            {/* Info about free tier */}
            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">Free Gemini API</h4>
                  <p className="text-sm text-stone-400">
                    Google offers Gemini API free forever with generous limits.
                    Your API key is encrypted and stored securely.
                  </p>
                </div>
              </div>
            </div>

            {/* Disconnect Button */}
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
        ) : (
          /* Not Connected State - Simple API Key Setup */
          <div className="space-y-5">
            {/* Step 1: Get API Key */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-teal-500/10 border border-blue-500/20 rounded-lg">
              <h4 className="font-medium text-stone-200 mb-2 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-sm font-bold">1</span>
                Get your free API key (takes 30 seconds)
              </h4>
              <p className="text-sm text-stone-400 mb-3">
                Sign in with your Google account and click &quot;Create API Key&quot;
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://aistudio.google.com/app/apikey', '_blank')}
                className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Google AI Studio
              </Button>
            </div>

            {/* Step 2: Paste API Key */}
            <div className="space-y-3">
              <h4 className="font-medium text-stone-200 flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 text-sm font-bold">2</span>
                Paste your API key here
              </h4>

              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                <Input
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError(null);
                  }}
                  className="pl-10 bg-stone-900 border-stone-700 text-stone-300 placeholder:text-stone-600"
                />
              </div>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isSubmitting || !apiKey.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Connect Gemini
                </>
              )}
            </Button>

            <p className="text-xs text-stone-500 text-center">
              Your API key is encrypted and never shared
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
