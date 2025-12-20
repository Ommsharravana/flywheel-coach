'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Key, Save, Loader2, Eye, EyeOff, ExternalLink, Check, X } from 'lucide-react';

interface GeminiApiKeyFormProps {
  userId: string;
  hasApiKey: boolean;
}

export function GeminiApiKeyForm({ userId, hasApiKey }: GeminiApiKeyFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const supabase = createClient();

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    setIsPending(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          gemini_api_key: apiKey.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Gemini API key saved successfully!');
      setApiKey('');
      router.refresh();
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = async () => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          gemini_api_key: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Gemini API key removed');
      router.refresh();
    } catch (error) {
      console.error('Error removing API key:', error);
      toast.error('Failed to remove API key');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="glass-card border-purple-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-stone-100">
          <Key className="w-5 h-5 text-purple-400" />
          Gemini API Key
        </CardTitle>
        <CardDescription>
          Add your Google Gemini API key for AI-personalized Lovable prompts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-stone-800/50">
          {hasApiKey ? (
            <>
              <Check className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">API key configured</span>
            </>
          ) : (
            <>
              <X className="w-5 h-5 text-stone-500" />
              <span className="text-stone-400">No API key configured</span>
            </>
          )}
        </div>

        {/* Input */}
        <div className="space-y-2">
          <Label htmlFor="gemini-key" className="text-stone-300">
            {hasApiKey ? 'Update API Key' : 'Enter API Key'}
          </Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="gemini-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="bg-stone-800/50 border-stone-700 focus:border-purple-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button
              onClick={handleSave}
              disabled={isPending || !apiKey.trim()}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Remove button */}
        {hasApiKey && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={isPending}
            className="text-red-400 border-red-500/50 hover:bg-red-500/10"
          >
            Remove API Key
          </Button>
        )}

        {/* Help text */}
        <div className="text-sm text-stone-400 space-y-2">
          <p>
            Your Gemini API key enables AI-personalized prompt generation in Step 5.
            Without it, you'll get template-based prompts.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            Get your free Gemini API key
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
