'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, ChevronRight, ExternalLink, Hammer, Save, Trophy, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useAppathonMode } from '@/lib/context/EventContext';
import { BuildRoadmap } from '@/components/appathon/BuildRoadmap';

interface BuildTrackerProps {
  cycle: Cycle;
}

export function BuildTracker({ cycle }: BuildTrackerProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();
  const { isAppathonMode } = useAppathonMode();

  const [lovableUrl, setLovableUrl] = useState(cycle.build?.lovableUrl || '');
  const [projectUrl, setProjectUrl] = useState(cycle.build?.projectUrl || '');
  const [screenshotUrl, setScreenshotUrl] = useState(cycle.build?.screenshotUrl || '');

  const hasLovableUrl = lovableUrl.trim().length > 0;

  const saveBuild = async (complete = false) => {
    setIsPending(true);
    try {
      const buildData = {
        cycle_id: cycle.id,
        lovable_project_url: lovableUrl || null, // DB column is lovable_project_url
        deployed_url: projectUrl || null, // DB column is deployed_url
        screenshot_urls: screenshotUrl ? [screenshotUrl] : null, // DB column is screenshot_urls (array)
        completed_at: complete ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('builds')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase.from('builds').update(buildData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('builds').insert({
          ...buildData,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 7,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('Build tracked!');
        router.push(`/cycle/${cycle.id}/step/7`);
      } else {
        toast.success('Saved!');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving build:', error);
      toast.error('Failed to save.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={isAppathonMode ? 'grid lg:grid-cols-3 gap-6' : ''}>
      {/* Appathon sidebar - Build Roadmap */}
      {isAppathonMode && (
        <div className="lg:col-span-1 order-2 lg:order-1">
          <Card className="glass-card border-amber-500/30 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-amber-400">
                <Trophy className="w-4 h-4" />
                Appathon 2.0 Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-stone-400">
              Follow the 10-day roadmap to maximize your score. Focus on working prototype (25%) and user validation (15%).
            </CardContent>
          </Card>
          <BuildRoadmap />
        </div>
      )}

      {/* Main content */}
      <div className={isAppathonMode ? 'lg:col-span-2 order-1 lg:order-2 space-y-6' : 'space-y-6'}>
      {/* Prompt reminder */}
      {cycle.prompt && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-400 mb-2">Your prompt for Lovable:</p>
            <p className="text-stone-300 text-sm line-clamp-3 font-mono bg-stone-800/50 p-3 rounded-lg">
              {cycle.prompt.editedPrompt || cycle.prompt.generatedPrompt}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            Build Your Solution
          </CardTitle>
          <CardDescription>
            Use Lovable to build your solution with the generated prompt.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Open Lovable */}
          <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                1
              </div>
              <span className="font-medium text-stone-200">Open Lovable and paste your prompt</span>
            </div>
            <Button
              onClick={() => window.open('https://lovable.dev', '_blank')}
              className="bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              Open Lovable
            </Button>
          </div>

          {/* Step 2: Track Lovable project */}
          <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                2
              </div>
              <span className="font-medium text-stone-200">Paste your Lovable project URL</span>
            </div>
            <Input
              value={lovableUrl}
              onChange={(e) => setLovableUrl(e.target.value)}
              placeholder="https://lovable.dev/projects/..."
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>

          {/* Step 3: Add preview URL */}
          <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                3
              </div>
              <span className="font-medium text-stone-200">Add your preview/deployed URL (optional)</span>
            </div>
            <Input
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://your-project.lovable.app"
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>

          {/* Step 4: Screenshot */}
          <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
                4
              </div>
              <span className="font-medium text-stone-200">Add a screenshot URL (optional)</span>
            </div>
            <Input
              value={screenshotUrl}
              onChange={(e) => setScreenshotUrl(e.target.value)}
              placeholder="https://... or paste image URL"
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
            {screenshotUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-stone-700">
                <img
                  src={screenshotUrl}
                  alt="Project screenshot"
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Progress indicator */}
      {hasLovableUrl && (
        <Card className="glass-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Check className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">Project linked!</p>
                <p className="text-sm text-stone-400">
                  Your Lovable project is tracked. Continue to deployment when ready.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/5`)}>
          Back to Prompt
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveBuild(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveBuild(true)}
            disabled={!hasLovableUrl || isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? 'Saving...' : 'Continue to Deployment'}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}
