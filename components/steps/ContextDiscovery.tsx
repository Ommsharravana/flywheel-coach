'use client';

import { useState, useTransition } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, MessageSquare, Plus, Save, Trash2, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface ContextDiscoveryProps {
  cycle: Cycle;
}

interface Interview {
  id: string;
  personName: string;
  role: string;
  notes: string;
  painLevel: number;
  wouldPay: boolean;
}

export function ContextDiscovery({ cycle }: ContextDiscoveryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const [who, setWho] = useState(cycle.context?.who || '');
  const [when, setWhen] = useState(cycle.context?.when || '');
  const [where, setWhere] = useState(cycle.context?.where || '');
  const [howPainful, setHowPainful] = useState(cycle.context?.howPainful || 5);
  const [currentSolution, setCurrentSolution] = useState(cycle.context?.currentSolution || '');
  const [interviews, setInterviews] = useState<Interview[]>(
    cycle.context?.interviews?.map((i) => ({
      id: i.id,
      personName: i.personName,
      role: i.role,
      notes: i.notes,
      painLevel: i.painLevel,
      wouldPay: i.wouldPay,
    })) || []
  );
  const [currentTab, setCurrentTab] = useState('context');

  const addInterview = () => {
    setInterviews([
      ...interviews,
      {
        id: Date.now().toString(),
        personName: '',
        role: '',
        notes: '',
        painLevel: 5,
        wouldPay: false,
      },
    ]);
  };

  const updateInterview = (id: string, field: keyof Interview, value: string | number | boolean) => {
    setInterviews(
      interviews.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const removeInterview = (id: string) => {
    setInterviews(interviews.filter((i) => i.id !== id));
  };

  const isContextComplete = who.trim() && when.trim() && currentSolution.trim();
  const hasInterviews = interviews.length >= 1 && interviews.some((i) => i.personName.trim());

  const saveContext = async () => {
    startTransition(async () => {
      try {
        // Map to actual database column names
        const contextData = {
          cycle_id: cycle.id,
          primary_users: who,
          frequency: when,
          pain_level: howPainful,
          current_workaround: currentSolution,
          completed: isContextComplete && hasInterviews,
          updated_at: new Date().toISOString(),
        };

        // Check if context exists
        const { data: existing } = await supabase
          .from('contexts')
          .select('id')
          .eq('cycle_id', cycle.id)
          .single();

        let contextId: string;

        if (existing) {
          await supabase.from('contexts').update(contextData).eq('id', existing.id);
          contextId = existing.id;
        } else {
          const { data: newContext, error } = await supabase.from('contexts').insert({
            ...contextData,
            created_at: new Date().toISOString(),
          }).select('id').single();

          if (error) throw error;
          contextId = newContext.id;
        }

        // Save interviews - use context_id, not cycle_id
        for (const interview of interviews) {
          if (interview.personName.trim()) {
            const interviewData = {
              context_id: contextId,
              interviewee_name: interview.personName,
              interviewee_role: interview.role,
              key_quote: interview.notes,
              pain_level: interview.painLevel,
            };

            const { data: existingInterview } = await supabase
              .from('interviews')
              .select('id')
              .eq('context_id', contextId)
              .eq('interviewee_name', interview.personName)
              .single();

            if (existingInterview) {
              await supabase.from('interviews').update(interviewData).eq('id', existingInterview.id);
            } else {
              await supabase.from('interviews').insert({
                ...interviewData,
                conducted_at: new Date().toISOString(),
              });
            }
          }
        }

        // Update cycle step if completing
        if (isContextComplete && hasInterviews) {
          await supabase
            .from('cycles')
            .update({
              current_step: 3,
              updated_at: new Date().toISOString(),
            })
            .eq('id', cycle.id);
        }

        toast.success('Context saved successfully!');

        if (isContextComplete && hasInterviews) {
          router.push(`/cycle/${cycle.id}/step/3`);
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error('Error saving context:', error);
        toast.error('Failed to save. Please try again.');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Problem reminder */}
      {cycle.problem && (
        <Card className="glass-card border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-sm text-stone-400 mb-1">You're exploring context for:</p>
            <p className="text-stone-200 font-medium">
              "{cycle.problem.refinedStatement || cycle.problem.statement}"
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 bg-stone-800/50">
          <TabsTrigger value="context" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
            Context Template
          </TabsTrigger>
          <TabsTrigger value="interviews" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
            Interviews ({interviews.filter((i) => i.personName.trim()).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="context" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100">Context Template</CardTitle>
              <CardDescription>
                Fill in the details to understand when and how this problem occurs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-stone-300 mb-2 block">Who experiences this problem?</Label>
                <Textarea
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  placeholder="e.g., 2nd year CS students who are preparing for placements..."
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">When does it happen?</Label>
                <Textarea
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                  placeholder="e.g., During exam preparation, when they need to revise multiple subjects..."
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">Where does it occur? (optional)</Label>
                <Input
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="e.g., In the library, hostel room, during lab sessions..."
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-3 block">
                  How painful is this? <span className="text-amber-400 font-bold">{howPainful}/10</span>
                </Label>
                <Slider
                  value={[howPainful]}
                  onValueChange={([value]) => setHowPainful(value)}
                  min={1}
                  max={10}
                  step={1}
                  className="py-4"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">How do they currently solve it?</Label>
                <Textarea
                  value={currentSolution}
                  onChange={(e) => setCurrentSolution(e.target.value)}
                  placeholder="e.g., They use multiple apps, ask seniors, or just struggle through..."
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentTab('interviews')}
                  disabled={!isContextComplete}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                >
                  Continue to Interviews
                  <ChevronRight className="ml-1 w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews" className="mt-6 space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                User Interviews
              </CardTitle>
              <CardDescription>
                Talk to at least 3 people who experience this problem. Record what you learn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interviews.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400 mb-4">No interviews recorded yet</p>
                  <Button onClick={addInterview} variant="outline">
                    <Plus className="mr-2 w-4 h-4" />
                    Add First Interview
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview, index) => (
                    <Card key={interview.id} className="bg-stone-800/50 border-stone-700">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Interview #{index + 1}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeInterview(interview.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-stone-400">Name</Label>
                            <Input
                              value={interview.personName}
                              onChange={(e) => updateInterview(interview.id, 'personName', e.target.value)}
                              placeholder="Person's name"
                              className="bg-stone-900/50 border-stone-600"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-stone-400">Role</Label>
                            <Input
                              value={interview.role}
                              onChange={(e) => updateInterview(interview.id, 'role', e.target.value)}
                              placeholder="e.g., 2nd year student"
                              className="bg-stone-900/50 border-stone-600"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-stone-400">Key Insights</Label>
                          <Textarea
                            value={interview.notes}
                            onChange={(e) => updateInterview(interview.id, 'notes', e.target.value)}
                            placeholder="What did they say about the problem? What surprised you?"
                            className="bg-stone-900/50 border-stone-600 min-h-[80px]"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-stone-400">
                              Their Pain Level: {interview.painLevel}/10
                            </Label>
                            <Slider
                              value={[interview.painLevel]}
                              onValueChange={([value]) => updateInterview(interview.id, 'painLevel', value)}
                              min={1}
                              max={10}
                              className="py-2"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-stone-400">Would they pay to solve this?</Label>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant={interview.wouldPay ? 'default' : 'outline'}
                                onClick={() => updateInterview(interview.id, 'wouldPay', true)}
                                className={interview.wouldPay ? 'bg-emerald-500' : ''}
                              >
                                Yes
                              </Button>
                              <Button
                                size="sm"
                                variant={!interview.wouldPay ? 'default' : 'outline'}
                                onClick={() => updateInterview(interview.id, 'wouldPay', false)}
                                className={!interview.wouldPay ? 'bg-red-500' : ''}
                              >
                                No
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button onClick={addInterview} variant="outline" className="w-full">
                    <Plus className="mr-2 w-4 h-4" />
                    Add Another Interview
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary */}
          {hasInterviews && (
            <Card className="glass-card border-emerald-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Check className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-emerald-400 font-medium">
                      {interviews.filter((i) => i.personName.trim()).length} interview(s) recorded
                    </p>
                    <p className="text-sm text-stone-400">
                      Average pain level:{' '}
                      {(
                        interviews.filter((i) => i.personName.trim()).reduce((acc, i) => acc + i.painLevel, 0) /
                        interviews.filter((i) => i.personName.trim()).length
                      ).toFixed(1)}
                      /10
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentTab('context')}>
              Back to Context
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={saveContext} disabled={isPending}>
                <Save className="mr-2 w-4 h-4" />
                Save Draft
              </Button>
              <Button
                onClick={saveContext}
                disabled={!isContextComplete || !hasInterviews || isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isPending ? 'Saving...' : 'Complete & Continue'}
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
