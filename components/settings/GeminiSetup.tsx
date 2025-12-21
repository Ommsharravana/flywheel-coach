'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, Trash2, Zap, Upload, Terminal, FileJson } from 'lucide-react';

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
  const [credentialsJson, setCredentialsJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCredentialsJson(content);
      setError(null);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleConnect = async () => {
    if (!credentialsJson.trim()) {
      setError('Please paste your credentials JSON or upload the file');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate JSON format first
      try {
        JSON.parse(credentialsJson);
      } catch {
        setError('Invalid JSON format. Please paste the exact contents of your oauth_creds.json file.');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          credentialType: 'oauth_json',
          credentials: credentialsJson,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Gemini connected successfully! Your AI Coach now uses your Gemini subscription.');
        setCredentialsJson('');
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
    if (!confirm('Are you sure you want to disconnect your Gemini subscription?')) {
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
          AI Coach - Powered by Your Gemini Subscription
        </CardTitle>
        <CardDescription>
          Use your own Google Gemini subscription through the Gemini CLI
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
                    No additional costs from us - you use your Google quota directly.
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
          /* Not Connected State - CLI Setup Instructions */
          <div className="space-y-6">
            {/* Step-by-step instructions */}
            <div className="p-4 bg-stone-800/50 rounded-lg">
              <h4 className="font-medium text-stone-200 mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-amber-400" />
                Setup Instructions
              </h4>
              <ol className="space-y-3 text-sm text-stone-400">
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">1.</span>
                  <div>
                    <span>Install Gemini CLI:</span>
                    <code className="block mt-1 p-2 bg-stone-900 rounded text-teal-400 text-xs">
                      npm install -g @google/gemini-cli
                    </code>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">2.</span>
                  <div>
                    <span>Run Gemini to authenticate (opens browser):</span>
                    <code className="block mt-1 p-2 bg-stone-900 rounded text-teal-400 text-xs">
                      gemini
                    </code>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">3.</span>
                  <div>
                    <span>Find your credentials file:</span>
                    <code className="block mt-1 p-2 bg-stone-900 rounded text-teal-400 text-xs">
                      ~/.gemini/oauth_creds.json
                    </code>
                    <span className="text-xs text-stone-500 block mt-1">
                      On Windows: %USERPROFILE%\.gemini\oauth_creds.json
                    </span>
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="text-amber-400 font-mono">4.</span>
                  <span>Paste the file contents below or upload the file:</span>
                </li>
              </ol>
            </div>

            {/* Credential Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-stone-400" />
                <label className="text-sm font-medium text-stone-300">
                  Credentials JSON
                </label>
              </div>

              <Textarea
                placeholder='Paste contents of ~/.gemini/oauth_creds.json here...'
                value={credentialsJson}
                onChange={(e) => {
                  setCredentialsJson(e.target.value);
                  setError(null);
                }}
                className="min-h-[120px] font-mono text-xs bg-stone-900 border-stone-700 text-stone-300 placeholder:text-stone-600"
              />

              {/* File Upload */}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-stone-400 border-stone-600 hover:bg-stone-800"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload JSON File
                </Button>
              </div>
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={isSubmitting || !credentialsJson.trim()}
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
              Your credentials are encrypted and stored securely
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
