'use client';

import { useState, useTransition } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Copy, ExternalLink, Save, Sparkles, Wand2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { generateLovablePrompt, PROMPT_TEMPLATES } from '@/lib/prompts/templates';

interface PromptGeneratorProps {
  cycle: Cycle;
}

export function PromptGenerator({ cycle }: PromptGeneratorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // Generate workflow-specific prompt from cycle data using PRD templates
  const generatePrompt = () => {
    const workflowType = cycle.workflowClassification?.selectedType || 'MONITORING';

    return generateLovablePrompt(
      workflowType,
      {
        refinedStatement: cycle.problem?.refinedStatement,
        statement: cycle.problem?.statement,
        frequency: cycle.problem?.frequency,
        painLevel: cycle.problem?.painLevel,
      },
      {
        who: cycle.context?.who,
        when: cycle.context?.when,
        currentSolution: cycle.context?.currentSolution,
      }
    );
  };

  // Get current template info for display
  const getTemplateInfo = () => {
    const workflowType = cycle.workflowClassification?.selectedType?.toUpperCase() || 'MONITORING';
    return PROMPT_TEMPLATES[workflowType] || PROMPT_TEMPLATES.MONITORING;
  };

  const [prompt, setPrompt] = useState(cycle.prompt?.editedPrompt || cycle.prompt?.generatedPrompt || generatePrompt());
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('Prompt copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy. Please select and copy manually.');
    }
  };

  const savePrompt = async (complete = false) => {
    startTransition(async () => {
      try {
        const promptData = {
          cycle_id: cycle.id,
          generated_prompt: generatePrompt(),
          edited_prompt: prompt,
          copied_at: copied ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };

        const { data: existing } = await supabase
          .from('prompts')
          .select('id')
          .eq('cycle_id', cycle.id)
          .single();

        if (existing) {
          await supabase.from('prompts').update(promptData).eq('id', existing.id);
        } else {
          await supabase.from('prompts').insert({
            ...promptData,
            created_at: new Date().toISOString(),
          });
        }

        if (complete) {
          await supabase
            .from('cycles')
            .update({
              current_step: 6,
              updated_at: new Date().toISOString(),
            })
            .eq('id', cycle.id);

          toast.success('Prompt saved!');
          router.push(`/cycle/${cycle.id}/step/6`);
        } else {
          toast.success('Draft saved!');
          router.refresh();
        }
      } catch (error) {
        console.error('Error saving prompt:', error);
        toast.error('Failed to save.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary of what we know */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Building From Your Research
          </CardTitle>
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
              <div className="text-stone-400 mb-1">Value Score</div>
              <div className="text-stone-200">
                {cycle.valueAssessment?.desperateUserScore || 0}/100
                <Badge
                  variant="outline"
                  className={`ml-2 ${
                    (cycle.valueAssessment?.desperateUserScore || 0) >= 70
                      ? 'text-emerald-400 border-emerald-500'
                      : 'text-amber-400 border-amber-500'
                  }`}
                >
                  {cycle.valueAssessment?.decision || 'pending'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-amber-400" />
            Your Lovable Prompt
          </CardTitle>
          <CardDescription>
            This prompt is generated from your research. Edit it to add specific features or requirements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-stone-300">Edit your prompt</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPrompt(generatePrompt())}
              className="text-amber-400"
            >
              <Sparkles className="mr-2 w-4 h-4" />
              Regenerate
            </Button>
          </div>

          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[300px] bg-stone-800/50 border-stone-700 focus:border-amber-500 font-mono text-sm"
          />

          <div className="flex gap-3">
            <Button
              onClick={copyToClipboard}
              className={`flex-1 ${copied ? 'bg-emerald-500' : 'bg-amber-500 hover:bg-amber-600'} text-stone-900`}
            >
              {copied ? (
                <>
                  <Check className="mr-2 w-4 h-4" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 w-4 h-4" /> Copy Prompt
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://lovable.dev', '_blank')}
              className="flex-1"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              Open Lovable
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Info */}
      <Card className="glass-card border-blue-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-blue-400 flex items-center gap-2">
            Template: {getTemplateInfo().name}
          </CardTitle>
          <CardDescription>
            This prompt uses the {getTemplateInfo().name} workflow pattern
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-stone-300 space-y-4">
          <div>
            <div className="font-medium text-stone-200 mb-2">Included Features:</div>
            <ul className="space-y-1">
              {getTemplateInfo().features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-medium text-stone-200 mb-2">Design Constraints:</div>
            <ul className="space-y-1">
              {getTemplateInfo().constraints.map((constraint, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>{constraint}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/4`)}>
          Back to Workflow
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => savePrompt(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => savePrompt(true)}
            disabled={!prompt.trim() || isPending}
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
