'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronRight, ExternalLink, Rocket, Save, Share2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface DeploymentTrackerProps {
  cycle: Cycle;
}

export function DeploymentTracker({ cycle }: DeploymentTrackerProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();

  const [deployedUrl, setDeployedUrl] = useState(cycle.build?.projectUrl || '');
  const [shareMessage, setShareMessage] = useState('');
  const [isLive, setIsLive] = useState(!!cycle.build?.completedAt);

  const hasDeployedUrl = deployedUrl.trim().length > 0;

  const saveDeployment = async (complete = false) => {
    setIsPending(true);
    try {
      // Update the build record with deployed URL
      const { error: buildError } = await supabase
        .from('builds')
        .update({
          deployed_url: deployedUrl, // DB column is deployed_url
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('cycle_id', cycle.id);
      if (buildError) throw buildError;

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 8,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('Deployment tracked!');
        router.push(`/cycle/${cycle.id}/step/8`);
      } else {
        toast.success('Saved!');
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving deployment:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  const generateShareMessage = () => {
    const problem = cycle.problem?.refinedStatement || cycle.problem?.statement || 'a problem';
    return `I just built a solution for "${problem}" using @lovaboratory! Check it out: ${deployedUrl} #BuildInPublic #NoCode`;
  };

  return (
    <div className="space-y-6">
      {/* Build info */}
      {cycle.build?.lovableUrl && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-400 mb-2">Your Lovable project:</p>
            <a
              href={cycle.build.lovableUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 flex items-center gap-2"
            >
              {cycle.build.lovableUrl}
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Rocket className="w-5 h-5 text-amber-400" />
            Deploy Your Solution
          </CardTitle>
          <CardDescription>
            Get your solution live and accessible to users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deployment options */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏠</span>
                <span className="font-medium text-stone-200">Lovable Hosting</span>
              </div>
              <p className="text-sm text-stone-400 mb-3">
                Your project is automatically hosted on Lovable&apos;s subdomain.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(cycle.build?.lovableUrl || 'https://lovable.dev', '_blank')}
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                View on Lovable
              </Button>
            </div>

            <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌐</span>
                <span className="font-medium text-stone-200">Custom Domain</span>
              </div>
              <p className="text-sm text-stone-400 mb-3">
                Connect a custom domain for a professional look.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>

          {/* Deployed URL */}
          <div>
            <Label className="text-stone-300 mb-2 block">
              Your Live URL
            </Label>
            <Input
              value={deployedUrl}
              onChange={(e) => setDeployedUrl(e.target.value)}
              placeholder="https://your-project.lovable.app"
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>

          {/* Verify deployment */}
          {hasDeployedUrl && (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => window.open(deployedUrl, '_blank')}
                variant="outline"
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                Test Live Site
              </Button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="w-4 h-4 rounded border-stone-600 bg-stone-800 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-stone-300">Verified - it&apos;s working!</span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share your work */}
      {hasDeployedUrl && isLive && (
        <Card className="glass-card border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Work
            </CardTitle>
            <CardDescription>
              Let others know what you built! Building in public accelerates learning.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-stone-300 mb-2 block">Share message</Label>
              <Textarea
                value={shareMessage || generateShareMessage()}
                onChange={(e) => setShareMessage(e.target.value)}
                className="bg-stone-800/50 border-stone-700 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const text = encodeURIComponent(shareMessage || generateShareMessage());
                  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                }}
              >
                Share on X/Twitter
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(shareMessage || generateShareMessage());
                  toast.success('Copied to clipboard!');
                }}
              >
                Copy Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success state */}
      {hasDeployedUrl && isLive && (
        <Card className="glass-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-medium text-lg">You shipped it!</p>
                <p className="text-sm text-stone-400">
                  Your solution is live. Now let&apos;s measure the impact.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/6`)}>
          Back to Building
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveDeployment(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveDeployment(true)}
            disabled={!hasDeployedUrl || !isLive || isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? 'Saving...' : 'Continue to Impact'}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
