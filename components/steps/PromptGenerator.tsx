'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Layers,
  Save,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { generatePromptSequence, getSequenceSummary, PromptStep } from '@/lib/prompts/sequences';
import { PROMPT_TEMPLATES } from '@/lib/prompts/templates';

interface PromptGeneratorProps {
  cycle: Cycle;
}

export function PromptGenerator({ cycle }: PromptGeneratorProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();

  // Generate the full 9-prompt sequence
  const workflowType = cycle.workflowClassification?.selectedType || 'MONITORING';
  const promptSequence = generatePromptSequence({
    workflowType,
    problemStatement: cycle.problem?.refinedStatement || cycle.problem?.statement || 'Problem not specified',
    frequency: cycle.problem?.frequency || 'daily',
    painLevel: cycle.problem?.painLevel || 5,
    currentSolution: cycle.context?.currentSolution || 'Manual process',
    primaryUsers: cycle.context?.who || 'users',
    when: cycle.context?.when || 'regularly',
  });

  // State for current prompt and editing
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [editedPrompts, setEditedPrompts] = useState<Record<number, string>>({});
  const [copiedPrompts, setCopiedPrompts] = useState<Set<number>>(new Set());

  const currentPrompt = promptSequence[currentPromptIndex];
  const editedContent = editedPrompts[currentPromptIndex] ?? currentPrompt.prompt;

  // Get sequence summary for sidebar
  const sequenceSummary = getSequenceSummary(workflowType);

  const copyCurrentPrompt = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopiedPrompts((prev) => new Set(prev).add(currentPromptIndex));
      toast.success(`Prompt ${currentPromptIndex + 1} copied!`);
    } catch {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  };

  const copyAllPrompts = async () => {
    try {
      const allPrompts = promptSequence
        .map((p, i) => {
          const content = editedPrompts[i] ?? p.prompt;
          return `=== PROMPT ${i + 1}: ${p.title} ===\n\n${content}`;
        })
        .join('\n\n' + '='.repeat(50) + '\n\n');

      await navigator.clipboard.writeText(allPrompts);
      toast.success('All 9 prompts copied to clipboard!');
    } catch {
      toast.error('Failed to copy. Please try copying individually.');
    }
  };

  const savePrompts = async (complete = false) => {
    setIsPending(true);
    try {
      // Prepare all prompts data
      const promptsData = promptSequence.map((p, i) => ({
        number: p.number,
        phase: p.phase,
        title: p.title,
        description: p.description,
        originalPrompt: p.prompt,
        editedPrompt: editedPrompts[i] || null,
        copied: copiedPrompts.has(i),
      }));

      const dataToSave = {
        cycle_id: cycle.id,
        generated_prompt: JSON.stringify(promptsData),
        edited_prompt: JSON.stringify(editedPrompts),
        copied_at: copiedPrompts.size > 0 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('prompts')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase.from('prompts').update(dataToSave).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prompts').insert({
          ...dataToSave,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 6,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('All prompts saved!');
        router.push(`/cycle/${cycle.id}/step/6`);
      } else {
        toast.success('Progress saved!');
        router.refresh();
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      toast.error('Failed to save.');
    } finally {
      setIsPending(false);
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'foundation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'features':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'polish':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      default:
        return 'bg-stone-500/20 text-stone-400 border-stone-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
            <Layers className="w-5 h-5" />9 Prompts to Build Your App
          </CardTitle>
          <CardDescription>
            Complete prompt sequence for building a{' '}
            <span className="text-amber-400 font-medium">
              {PROMPT_TEMPLATES[workflowType.toUpperCase()]?.name || workflowType}
            </span>{' '}
            workflow in Lovable
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-stone-800/50 rounded-lg">
              <div className="text-stone-400 mb-1">Problem</div>
              <div className="text-stone-200 line-clamp-2">
                {cycle.problem?.refinedStatement || cycle.problem?.statement || 'Not defined'}
              </div>
            </div>
            <div className="p-3 bg-stone-800/50 rounded-lg">
              <div className="text-stone-400 mb-1">Workflow Type</div>
              <div className="text-stone-200 capitalize">
                {cycle.workflowClassification?.selectedType?.replace('-', ' ') || 'Not selected'}
              </div>
            </div>
            <div className="p-3 bg-stone-800/50 rounded-lg">
              <div className="text-stone-400 mb-1">Progress</div>
              <div className="text-stone-200">
                {copiedPrompts.size}/9 prompts copied
                <div className="flex gap-1 mt-1">
                  {promptSequence.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        copiedPrompts.has(i) ? 'bg-emerald-400' : 'bg-stone-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Prompt List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-stone-300">Prompt Sequence</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-[400px]">
              {sequenceSummary.map((section) => (
                <div key={section.phase} className="mb-4">
                  <div className="text-xs text-stone-500 uppercase tracking-wider px-2 mb-2">
                    {section.phase}
                  </div>
                  {section.prompts.map((promptTitle, idx) => {
                    const promptNum = parseInt(promptTitle.split('.')[0]) - 1;
                    const isActive = currentPromptIndex === promptNum;
                    const isCopied = copiedPrompts.has(promptNum);

                    return (
                      <button
                        key={promptTitle}
                        onClick={() => setCurrentPromptIndex(promptNum)}
                        className={`w-full text-left p-2 rounded-lg mb-1 text-sm transition-colors flex items-center gap-2 ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                            : 'hover:bg-stone-700/50 text-stone-300'
                        }`}
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-stone-600 flex-shrink-0" />
                        )}
                        <span className="truncate">{promptTitle}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Main Content - Current Prompt */}
        <Card className="glass-card lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline" className={getPhaseColor(currentPrompt.phase)}>
                  {currentPrompt.phase.charAt(0).toUpperCase() + currentPrompt.phase.slice(1)} Phase
                </Badge>
                <CardTitle className="text-xl text-stone-100 mt-2">
                  Prompt {currentPromptIndex + 1}: {currentPrompt.title}
                </CardTitle>
                <CardDescription>{currentPrompt.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPromptIndex((i) => Math.max(0, i - 1))}
                  disabled={currentPromptIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-stone-400">
                  {currentPromptIndex + 1} / 9
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPromptIndex((i) => Math.min(8, i + 1))}
                  disabled={currentPromptIndex === 8}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={editedContent}
              onChange={(e) =>
                setEditedPrompts((prev) => ({
                  ...prev,
                  [currentPromptIndex]: e.target.value,
                }))
              }
              className="min-h-[300px] bg-stone-800/50 border-stone-700 focus:border-amber-500 font-mono text-sm"
            />

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={copyCurrentPrompt}
                className={`${
                  copiedPrompts.has(currentPromptIndex)
                    ? 'bg-emerald-500'
                    : 'bg-amber-500 hover:bg-amber-600'
                } text-stone-900`}
              >
                {copiedPrompts.has(currentPromptIndex) ? (
                  <>
                    <Check className="mr-2 w-4 h-4" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 w-4 h-4" /> Copy This Prompt
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={copyAllPrompts}>
                <Layers className="mr-2 w-4 h-4" />
                Copy All 9 Prompts
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('https://lovable.dev', '_blank')}
              >
                <ExternalLink className="mr-2 w-4 h-4" />
                Open Lovable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setEditedPrompts((prev) => {
                    const newEdits = { ...prev };
                    delete newEdits[currentPromptIndex];
                    return newEdits;
                  })
                }
                className="text-stone-400"
              >
                <Sparkles className="mr-1 w-3 h-3" />
                Reset to Original
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions Card */}
      <Card className="glass-card border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-blue-400">How to Use These Prompts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-stone-300 space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              1
            </Badge>
            <div>
              <strong>Start with Prompt 1</strong> - Copy and paste into Lovable to set up the
              foundation
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              2
            </Badge>
            <div>
              <strong>Wait for completion</strong> - Let Lovable finish building before sending the
              next prompt
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              3
            </Badge>
            <div>
              <strong>Continue in sequence</strong> - Each prompt builds on the previous one. Don't
              skip prompts.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              4
            </Badge>
            <div>
              <strong>Edit if needed</strong> - Customize prompts to add specific requirements
              before copying
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/4`)}>
          Back to Workflow
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => savePrompts(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            Save Progress
          </Button>
          <Button
            onClick={() => savePrompts(true)}
            disabled={isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? 'Saving...' : 'Continue to Building'}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
