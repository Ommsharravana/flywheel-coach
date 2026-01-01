'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Zap, ExternalLink, Eye, EyeOff } from 'lucide-react';

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
  const [isSaving, setIsSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

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

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          credentials: apiKey.trim(),
          credentialType: 'api_key',
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('API key saved! AI features are now enabled.');
        setApiKey('');
        await checkExisting();
      } else {
        setError(data.error || 'Failed to save API key');
      }
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Remove your API key? AI features will be disabled until you add a new one.')) {
      return;
    }

    try {
      const res = await fetch('/api/credentials?provider=gemini', {
        method: 'DELETE',
      });

      if (res.ok) {
        setExistingCredential(null);
        setSuccess('API key removed.');
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
          Add your Gemini API key to enable AI features
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
                <div className="font-medium text-stone-100">Gemini API Connected</div>
                <div className="text-sm text-stone-400">
                  AI features are enabled
                </div>
              </div>
              <Badge className="bg-teal-500/20 text-teal-400 border-teal-500/30">
                {existingCredential.isValid ? 'Active' : 'Invalid Key'}
              </Badge>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">AI Features Enabled</h4>
                  <p className="text-sm text-stone-400">
                    AI Coach and other features are powered by your Gemini API key.
                  </p>
                </div>
              </div>
            </div>

            {!existingCredential.isValid && (
              <div className="space-y-3">
                <p className="text-sm text-amber-400">Your API key is invalid. Please enter a new one:</p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder="AIza..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="pr-10 bg-stone-800/50 border-stone-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleSaveApiKey}
                    disabled={isSaving}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-stone-400 border-stone-600 hover:bg-stone-800"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove API Key
            </Button>
          </div>
        ) : (
          /* Not connected state */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-400" />
              <div className="flex-1">
                <div className="font-medium text-stone-100">Add Gemini API Key</div>
                <div className="text-sm text-stone-400">
                  Enter your API key to enable AI Coach and other AI features
                </div>
              </div>
            </div>

            <div className="p-4 bg-stone-800/50 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-stone-200 mb-1">How to get your API key</h4>
                  <ol className="text-sm text-stone-400 list-decimal list-inside space-y-1">
                    <li>Go to Google AI Studio</li>
                    <li>Sign in with your Google account</li>
                    <li>Click &quot;Get API key&quot; in the left sidebar</li>
                    <li>Create a new API key and copy it</li>
                  </ol>
                </div>
              </div>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-teal-400 hover:text-teal-300"
              >
                <ExternalLink className="w-4 h-4" />
                Open Google AI Studio
              </a>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Paste your API key here (AIza...)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="pr-10 bg-stone-800/50 border-stone-600"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-300"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <Button
                onClick={handleSaveApiKey}
                disabled={isSaving || !apiKey.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Save API Key'
                )}
              </Button>
            </div>

            <p className="text-xs text-stone-500 text-center">
              Your API key is encrypted and stored securely. You can use the free tier (1,500 requests/day) or a paid plan.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
