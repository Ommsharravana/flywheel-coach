'use client';

import { useState, useRef, useCallback } from 'react';
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
import { useTranslation } from '@/lib/i18n/LanguageContext';

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
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();
  const { t } = useTranslation();

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

  // Auto-save timer ref (debounce saves)
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Silent background save (no toast, no navigation)
  const saveContextSilently = useCallback(async (
    whoVal: string,
    whenVal: string,
    whereVal: string,
    howPainfulVal: number,
    currentSolutionVal: string
  ) => {
    try {
      const contextData = {
        cycle_id: cycle.id,
        primary_users: whoVal,
        frequency: whenVal,
        pain_level: howPainfulVal,
        current_workaround: currentSolutionVal,
        completed: false,
        updated_at: new Date().toISOString(),
      };

      // Check if context exists
      const { data: existing, error: fetchError } = await supabase
        .from('contexts')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Auto-save fetch error:', fetchError);
        return;
      }

      if (existing) {
        await supabase
          .from('contexts')
          .update(contextData)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('contexts')
          .insert({
            ...contextData,
            created_at: new Date().toISOString(),
          });
      }
      console.log('Context auto-saved');
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [cycle.id, supabase]);

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback((
    whoVal: string,
    whenVal: string,
    whereVal: string,
    howPainfulVal: number,
    currentSolutionVal: string
  ) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = setTimeout(() => {
      saveContextSilently(whoVal, whenVal, whereVal, howPainfulVal, currentSolutionVal);
    }, 1000); // Save 1 second after typing stops
  }, [saveContextSilently]);

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

  const saveContext = async (complete = false) => {
    setIsPending(true);
    try {
      // Map to actual database column names
      const contextData = {
        cycle_id: cycle.id,
        primary_users: who,
        frequency: when,
        pain_level: howPainful,
        current_workaround: currentSolution,
        completed: complete && isContextComplete && hasInterviews,
        updated_at: new Date().toISOString(),
      };

      // Check if context exists
      const { data: existing, error: fetchError } = await supabase
        .from('contexts')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      // PGRST116 is "no rows found" which is expected for new contexts
      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let contextId: string;

      if (existing) {
        const { error: updateError } = await supabase
          .from('contexts')
          .update(contextData)
          .eq('id', existing.id);
        if (updateError) throw updateError;
        contextId = existing.id;
      } else {
        const { data: newContext, error: insertError } = await supabase
          .from('contexts')
          .insert({
            ...contextData,
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        if (!newContext) throw new Error('Failed to create context');
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

          const { data: existingInterview, error: interviewFetchError } = await supabase
            .from('interviews')
            .select('id')
            .eq('context_id', contextId)
            .eq('interviewee_name', interview.personName)
            .single();

          // PGRST116 means no rows found - that's expected for new interviews
          if (interviewFetchError && interviewFetchError.code !== 'PGRST116') {
            throw interviewFetchError;
          }

          if (existingInterview) {
            const { error: updateInterviewError } = await supabase
              .from('interviews')
              .update(interviewData)
              .eq('id', existingInterview.id);
            if (updateInterviewError) throw updateInterviewError;
          } else {
            const { error: insertInterviewError } = await supabase
              .from('interviews')
              .insert({
                ...interviewData,
                conducted_at: new Date().toISOString(),
              });
            if (insertInterviewError) throw insertInterviewError;
          }
        }
      }

      // Update cycle step only if completing
      if (complete && isContextComplete && hasInterviews) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            current_step: 3,
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success('Context saved successfully!');
        router.push(`/cycle/${cycle.id}/step/3`);
      } else {
        toast.success('Context saved!');
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving context:', error);
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
            <p className="text-sm text-stone-400 mb-1">{t('stepUI.youreExploring')}</p>
            <p className="text-stone-200 font-medium">
              &quot;{cycle.problem.refinedStatement || cycle.problem.statement}&quot;
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-2 bg-stone-800/50">
          <TabsTrigger value="context" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
            {t('stepUI.contextTemplate')}
          </TabsTrigger>
          <TabsTrigger value="interviews" className="data-[state=active]:bg-amber-500 data-[state=active]:text-stone-900">
            {t('stepUI.userInterviews')} ({interviews.filter((i) => i.personName.trim()).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="context" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100">{t('stepUI.contextTemplate')}</CardTitle>
              <CardDescription>
                {t('stepUI.contextTemplateDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-stone-300 mb-2 block">{t('stepUI.whoExperiences')}</Label>
                <Textarea
                  value={who}
                  onChange={(e) => {
                    const newWho = e.target.value;
                    setWho(newWho);
                    triggerAutoSave(newWho, when, where, howPainful, currentSolution);
                  }}
                  placeholder={t('stepUI.whoExperiencesPlaceholder')}
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">{t('stepUI.whenHappens')}</Label>
                <Textarea
                  value={when}
                  onChange={(e) => {
                    const newWhen = e.target.value;
                    setWhen(newWhen);
                    triggerAutoSave(who, newWhen, where, howPainful, currentSolution);
                  }}
                  placeholder={t('stepUI.whenHappensPlaceholder')}
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">{t('stepUI.whereOccurs')}</Label>
                <Input
                  value={where}
                  onChange={(e) => {
                    const newWhere = e.target.value;
                    setWhere(newWhere);
                    triggerAutoSave(who, when, newWhere, howPainful, currentSolution);
                  }}
                  placeholder={t('stepUI.whereOccursPlaceholder')}
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-3 block">
                  {t('stepUI.howPainful')} <span className="text-amber-400 font-bold">{howPainful}/10</span>
                </Label>
                <Slider
                  value={[howPainful]}
                  onValueChange={([value]) => {
                    setHowPainful(value);
                    triggerAutoSave(who, when, where, value, currentSolution);
                  }}
                  min={1}
                  max={10}
                  step={1}
                  className="py-4"
                />
              </div>

              <div>
                <Label className="text-stone-300 mb-2 block">{t('stepUI.howCurrentlySolve')}</Label>
                <Textarea
                  value={currentSolution}
                  onChange={(e) => {
                    const newSolution = e.target.value;
                    setCurrentSolution(newSolution);
                    triggerAutoSave(who, when, where, howPainful, newSolution);
                  }}
                  placeholder={t('stepUI.howCurrentlySolvePlaceholder')}
                  className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentTab('interviews')}
                  disabled={!isContextComplete}
                  className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                >
                  {t('stepUI.continueToInterviews')}
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
                {t('stepUI.userInterviews')}
              </CardTitle>
              <CardDescription>
                {t('stepUI.userInterviewsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interviews.length === 0 ? (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400 mb-4">{t('stepUI.noInterviewsYet')}</p>
                  <Button onClick={addInterview} variant="outline">
                    <Plus className="mr-2 w-4 h-4" />
                    {t('stepUI.addFirstInterview')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview, index) => (
                    <Card key={interview.id} className="bg-stone-800/50 border-stone-700">
                      <CardContent className="pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{t('stepUI.interviewNumber').replace('{number}', String(index + 1))}</Badge>
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
                            <Label className="text-sm text-stone-400">{t('stepUI.personName')}</Label>
                            <Input
                              value={interview.personName}
                              onChange={(e) => updateInterview(interview.id, 'personName', e.target.value)}
                              placeholder={t('stepUI.personNamePlaceholder')}
                              className="bg-stone-900/50 border-stone-600"
                            />
                          </div>
                          <div>
                            <Label className="text-sm text-stone-400">{t('settings.department')}</Label>
                            <Input
                              value={interview.role}
                              onChange={(e) => updateInterview(interview.id, 'role', e.target.value)}
                              placeholder={t('stepUI.rolePlaceholder')}
                              className="bg-stone-900/50 border-stone-600"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-stone-400">{t('stepUI.keyInsights')}</Label>
                          <Textarea
                            value={interview.notes}
                            onChange={(e) => updateInterview(interview.id, 'notes', e.target.value)}
                            placeholder={t('stepUI.keyInsightsPlaceholder')}
                            className="bg-stone-900/50 border-stone-600 min-h-[80px]"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-stone-400">
                              {t('stepUI.theirPainLevel').replace('{level}', String(interview.painLevel))}
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
                            <Label className="text-sm text-stone-400">{t('stepUI.wouldTheyPay')}</Label>
                            <div className="flex gap-2 mt-2">
                              <Button
                                size="sm"
                                variant={interview.wouldPay ? 'default' : 'outline'}
                                onClick={() => updateInterview(interview.id, 'wouldPay', true)}
                                className={interview.wouldPay ? 'bg-emerald-500' : ''}
                              >
                                {t('stepUI.yes')}
                              </Button>
                              <Button
                                size="sm"
                                variant={!interview.wouldPay ? 'default' : 'outline'}
                                onClick={() => updateInterview(interview.id, 'wouldPay', false)}
                                className={!interview.wouldPay ? 'bg-red-500' : ''}
                              >
                                {t('stepUI.no')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button onClick={addInterview} variant="outline" className="w-full">
                    <Plus className="mr-2 w-4 h-4" />
                    {t('stepUI.addAnotherInterview')}
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
                      {t('stepUI.interviewsRecorded').replace('{count}', String(interviews.filter((i) => i.personName.trim()).length))}
                    </p>
                    <p className="text-sm text-stone-400">
                      {t('stepUI.averagePainLevel')}{' '}
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
              {t('stepUI.backToContext')}
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => saveContext(false)} disabled={isPending}>
                <Save className="mr-2 w-4 h-4" />
                {t('stepUI.saveDraft')}
              </Button>
              <Button
                onClick={() => saveContext(true)}
                disabled={!isContextComplete || !hasInterviews || isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {isPending ? t('common.saving') : t('stepUI.completeAndContinue')}
                <ChevronRight className="ml-1 w-4 h-4" />
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
