'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Diamond, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ValueDiscoveryProps {
  cycle: Cycle;
}

const DESPERATE_USER_CRITERIA = [
  {
    id: 'activelySearching',
    title: 'Actively Searching',
    question: 'Are they actively looking for a solution?',
    description: 'They\'ve searched online, asked friends, or tried to find alternatives.',
    weight: 20,
  },
  {
    id: 'triedAlternatives',
    title: 'Tried Alternatives',
    question: 'Have they tried and rejected other solutions?',
    description: 'They\'ve used workarounds, hacks, or competing products but found them lacking.',
    weight: 20,
  },
  {
    id: 'willingToPay',
    title: 'Willing to Pay',
    question: 'Would they pay money to solve this?',
    description: 'They value the solution enough to spend money, not just time.',
    weight: 25,
  },
  {
    id: 'urgentNeed',
    title: 'Urgent Need',
    question: 'Is this problem urgent for them?',
    description: 'They need a solution soon, not "someday".',
    weight: 20,
  },
  {
    id: 'frequentProblem',
    title: 'Frequent Problem',
    question: 'Do they encounter this problem frequently?',
    description: 'They deal with this daily or weekly, not just occasionally.',
    weight: 15,
  },
];

export function ValueDiscovery({ cycle }: ValueDiscoveryProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();

  const [criteria, setCriteria] = useState<Record<string, boolean>>(
    cycle.valueAssessment?.criteria || {
      activelySearching: false,
      triedAlternatives: false,
      willingToPay: false,
      urgentNeed: false,
      frequentProblem: false,
    }
  );

  const [evidence, setEvidence] = useState<Record<string, string>>(
    cycle.valueAssessment?.evidence || {
      activelySearching: '',
      triedAlternatives: '',
      willingToPay: '',
      urgentNeed: '',
      frequentProblem: '',
    }
  );

  // Calculate score
  const score = DESPERATE_USER_CRITERIA.reduce((acc, c) => {
    return acc + (criteria[c.id] ? c.weight : 0);
  }, 0);

  const getDecision = (): 'proceed' | 'pivot' | 'abandon' => {
    if (score >= 70) return 'proceed';
    if (score >= 40) return 'pivot';
    return 'abandon';
  };

  const decision = getDecision();

  const hasEvidence = Object.values(evidence).some((e) => e.trim().length > 0);

  const saveValue = async (complete = false) => {
    setIsPending(true);
    try {
      // Map to actual database column names
      // DB expects: multiple_have_it, complained_before, doing_something, light_up_at_solution, ask_when_can_use
      // UI has: frequentProblem, activelySearching, triedAlternatives, willingToPay, urgentNeed
      const dbDecision = decision === 'abandon' ? 'stop' : decision; // DB allows: proceed, iterate, pivot, stop
      const dbScore = Math.round(score / 20); // Convert 0-100 to 0-5

      const valueData = {
        cycle_id: cycle.id,
        multiple_have_it: criteria.frequentProblem,
        multiple_have_it_evidence: evidence.frequentProblem || null,
        complained_before: criteria.activelySearching,
        complained_before_evidence: evidence.activelySearching || null,
        doing_something: criteria.triedAlternatives,
        doing_something_evidence: evidence.triedAlternatives || null,
        light_up_at_solution: criteria.willingToPay,
        light_up_evidence: evidence.willingToPay || null,
        ask_when_can_use: criteria.urgentNeed,
        ask_when_evidence: evidence.urgentNeed || null,
        desperate_user_score: dbScore,
        quadrant: score >= 70 ? 'quick-win' : score >= 40 ? 'strategic' : 'skip',
        decision: dbDecision,
        completed: complete,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('value_assessments')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase.from('value_assessments').update(valueData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('value_assessments').insert({
          ...valueData,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 4,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('Value assessment complete!');
        router.push(`/cycle/${cycle.id}/step/4`);
      } else {
        toast.success('Saved!');
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving value:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Problem reminder */}
      {cycle.problem && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-400 mb-1">Validating value for:</p>
            <p className="text-stone-200 font-medium">
              &quot;{cycle.problem.refinedStatement || cycle.problem.statement}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Diamond className="w-5 h-5 text-amber-400" />
            The Desperate User Test
          </CardTitle>
          <CardDescription>
            Evaluate whether users are desperate enough for your solution to succeed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DESPERATE_USER_CRITERIA.map((c) => (
            <div key={c.id} className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-stone-200">{c.title}</span>
                    <Badge variant="outline" className="text-xs">
                      {c.weight} pts
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-400">{c.question}</p>
                  <p className="text-xs text-stone-500">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={criteria[c.id] ? 'default' : 'outline'}
                    onClick={() => setCriteria({ ...criteria, [c.id]: true })}
                    className={criteria[c.id] ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={!criteria[c.id] ? 'default' : 'outline'}
                    onClick={() => setCriteria({ ...criteria, [c.id]: false })}
                    className={!criteria[c.id] ? 'bg-red-500 hover:bg-red-600' : ''}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={evidence[c.id] || ''}
                onChange={(e) => setEvidence({ ...evidence, [c.id]: e.target.value })}
                placeholder="Evidence: What have you observed or heard that supports this?"
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500 text-sm"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Score Card */}
      <Card
        className={`glass-card ${
          decision === 'proceed'
            ? 'border-emerald-500/50'
            : decision === 'pivot'
            ? 'border-amber-500/50'
            : 'border-red-500/50'
        }`}
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label className="text-stone-400">Desperate User Score</Label>
              <div className="text-4xl font-bold text-stone-100">{score}/100</div>
            </div>
            <div
              className={`px-4 py-2 rounded-full font-medium ${
                decision === 'proceed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : decision === 'pivot'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {decision === 'proceed' && 'PROCEED'}
              {decision === 'pivot' && 'CONSIDER PIVOTING'}
              {decision === 'abandon' && 'RETHINK THIS'}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-3 bg-stone-800 rounded-full overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-500 ${
                decision === 'proceed'
                  ? 'bg-emerald-500'
                  : decision === 'pivot'
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>

          {/* Decision guidance */}
          <div className="text-sm text-stone-400">
            {decision === 'proceed' && (
              <p>
                Strong signal! Users are desperate enough for this solution. Proceed to workflow
                classification.
              </p>
            )}
            {decision === 'pivot' && (
              <p>
                Mixed signals. Consider refining your problem or target audience. You can still
                proceed, but be prepared to iterate.
              </p>
            )}
            {decision === 'abandon' && (
              <p>
                Weak signal. Users may not value this enough. Consider going back to Problem
                Discovery with a different problem.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/2`)}>
          Back to Context
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveValue(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => saveValue(true)}
            disabled={score === 0 || isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? 'Saving...' : 'Complete & Continue'}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
