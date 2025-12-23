'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronRight, Lightbulb, RefreshCcw, Save, Target, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ImpactDiscoveryProps {
  cycle: Cycle;
}

export function ImpactDiscovery({ cycle }: ImpactDiscoveryProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const supabase = createClient();
  const { t } = useTranslation();

  const [usersReached, setUsersReached] = useState(cycle.impact?.usersReached || 0);
  const [timeSavedMinutes, setTimeSavedMinutes] = useState(cycle.impact?.timeSavedMinutes || 0);
  const [satisfactionScore, setSatisfactionScore] = useState(cycle.impact?.satisfactionScore || 5);
  const [feedback, setFeedback] = useState(cycle.impact?.feedback || '');
  const [lessonsLearned, setLessonsLearned] = useState(cycle.impact?.lessonsLearned || '');
  const [newProblems, setNewProblems] = useState<string[]>(cycle.impact?.newProblems || ['']);

  const hasMinimumData = usersReached > 0 || timeSavedMinutes > 0;

  const addNewProblem = () => {
    setNewProblems([...newProblems, '']);
  };

  const updateProblem = (index: number, value: string) => {
    const updated = [...newProblems];
    updated[index] = value;
    setNewProblems(updated);
  };

  const removeProblem = (index: number) => {
    if (newProblems.length > 1) {
      setNewProblems(newProblems.filter((_, i) => i !== index));
    }
  };

  const saveImpact = async (complete = false) => {
    setIsPending(true);
    try {
      // Map UI fields to actual DB column names
      // DB table is impact_assessments (not impacts!)
      // DB expects: total_users, potential_users, adoption_rate, weekly_active_users, returning_users,
      // retention_rate, pain_before, pain_after, time_before, time_after, referral_users, referral_rate,
      // nps_score, impact_score, new_problems_discovered
      // DB constraints:
      // - nps_score CHECK (nps_score BETWEEN 1 AND 10)
      // - impact_score CHECK (impact_score BETWEEN 0 AND 100)
      // - time_before and time_after are TEXT type
      const calculatedImpactScore = Math.min(100, Math.max(0, Math.round((usersReached * timeSavedMinutes) / 100)));

      const impactData = {
        cycle_id: cycle.id,
        total_users: usersReached,
        potential_users: usersReached * 10, // Estimate potential as 10x current
        adoption_rate: usersReached > 0 ? 0.1 : 0, // 10% default adoption
        weekly_active_users: Math.round(usersReached * 0.3), // Estimate 30% weekly active
        returning_users: Math.round(usersReached * 0.2), // Estimate 20% returning
        retention_rate: usersReached > 0 ? 0.2 : 0, // 20% retention rate
        pain_before: 8, // High pain before (estimated)
        pain_after: Math.max(1, 10 - satisfactionScore), // Lower pain after = higher satisfaction
        time_before: `${timeSavedMinutes + 30} minutes`, // TEXT field - time before solution
        time_after: '30 minutes', // TEXT field - time after solution
        referral_users: 0,
        referral_rate: 0,
        nps_score: satisfactionScore, // DB expects 1-10, which matches our satisfaction score
        impact_score: calculatedImpactScore, // Clamped to 0-100
        new_problems_discovered: newProblems.filter((p) => p.trim()),
        completed: complete,
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: fetchError } = await supabase
        .from('impact_assessments')
        .select('id')
        .eq('cycle_id', cycle.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        const { error } = await supabase.from('impact_assessments').update(impactData).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('impact_assessments').insert({
          ...impactData,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      }

      if (complete) {
        const { error: cycleError } = await supabase
          .from('cycles')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', cycle.id);
        if (cycleError) throw cycleError;

        toast.success(t('stepUI.cycleCompleted'));
        router.push(`/cycle/${cycle.id}`);
      } else {
        toast.success(t('stepUI.impactSaved'));
        router.refresh();
      }
    } catch (error: unknown) {
      console.error('Error saving impact:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  const startNewCycle = async () => {
    // Get first new problem that has content
    const firstProblem = newProblems.find((p) => p.trim());

    if (!firstProblem) {
      toast.error(t('stepUI.addProblemFirst'));
      return;
    }

    setIsPending(true);
    try {
      // First complete this cycle
      await saveImpact(true);

      // Create new cycle with the new problem
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not authenticated');
        setIsPending(false);
        return;
      }

      // DB uses 'name' not 'title', and doesn't have 'step_statuses' column
      const newCycleId = crypto.randomUUID();
      const { error: cycleError } = await supabase.from('cycles').insert({
        id: newCycleId,
        user_id: user.id,
        name: 'New Cycle',
        status: 'active',
        current_step: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (cycleError) throw cycleError;

      // Pre-populate with the new problem
      // DB problems table: selected_question, q_takes_too_long, q_repetitive, etc.
      const { error: problemError } = await supabase.from('problems').insert({
        cycle_id: newCycleId,
        selected_question: firstProblem,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      if (problemError) throw problemError;

      toast.success(t('stepUI.newCycleStarted'));
      router.push(`/cycle/${newCycleId}/step/1`);
    } catch (error: unknown) {
      console.error('Error starting new cycle:', error);
      const errorMessage = error instanceof Error ? error.message :
        (error as { message?: string })?.message || 'Unknown error';
      toast.error(`Failed to start new cycle: ${errorMessage}`);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Solution reminder */}
      {cycle.build?.projectUrl && (
        <Card className="glass-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-emerald-400 font-medium">{t('stepUI.youShippedIt')}</p>
                <a
                  href={cycle.build.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-stone-400 hover:text-stone-300 text-sm"
                >
                  {cycle.build.projectUrl}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-xl text-stone-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" />
            {t('stepUI.measureImpact')}
          </CardTitle>
          <CardDescription>
            {t('stepUI.measureImpactDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metrics grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-400" />
                <Label className="text-stone-300">{t('stepUI.usersReached')}</Label>
              </div>
              <Input
                type="number"
                value={usersReached}
                onChange={(e) => setUsersReached(parseInt(e.target.value) || 0)}
                min={0}
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500 text-2xl font-bold"
              />
              <p className="text-xs text-stone-500 mt-1">{t('stepUI.usersReachedDesc')}</p>
            </div>

            <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-emerald-400" />
                <Label className="text-stone-300">{t('stepUI.timeSavedMinutes')}</Label>
              </div>
              <Input
                type="number"
                value={timeSavedMinutes}
                onChange={(e) => setTimeSavedMinutes(parseInt(e.target.value) || 0)}
                min={0}
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500 text-2xl font-bold"
              />
              <p className="text-xs text-stone-500 mt-1">{t('stepUI.timeSavedDesc')}</p>
            </div>

            <div className="p-4 bg-stone-800/30 rounded-lg border border-stone-700">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <Label className="text-stone-300">{t('stepUI.satisfactionScore')}</Label>
              </div>
              <Input
                type="number"
                value={satisfactionScore}
                onChange={(e) => setSatisfactionScore(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={10}
                className="bg-stone-800/50 border-stone-700 focus:border-amber-500 text-2xl font-bold"
              />
              <p className="text-xs text-stone-500 mt-1">{t('stepUI.satisfactionDesc')}</p>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <Label className="text-stone-300 mb-2 block">{t('stepUI.userFeedback')}</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={t('stepUI.userFeedbackPlaceholder')}
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>

          {/* Lessons learned */}
          <div>
            <Label className="text-stone-300 mb-2 block">{t('stepUI.lessonsLearned')}</Label>
            <Textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              placeholder={t('stepUI.lessonsLearnedPlaceholder')}
              className="bg-stone-800/50 border-stone-700 focus:border-amber-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* New problems discovered - the flywheel continues */}
      <Card className="glass-card border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {t('stepUI.newProblemsDiscovered')}
          </CardTitle>
          <CardDescription>
            {t('stepUI.newProblemsDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {newProblems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-2"
            >
              <Input
                value={problem}
                onChange={(e) => updateProblem(index, e.target.value)}
                placeholder={t('stepUI.newProblemPlaceholder')}
                className="flex-1 bg-stone-800/50 border-stone-700 focus:border-amber-500"
              />
              {newProblems.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeProblem(index)}
                  className="text-red-400"
                >
                  ×
                </Button>
              )}
            </motion.div>
          ))}
          <Button variant="outline" onClick={addNewProblem} className="w-full">
            + {t('stepUI.addAnotherProblem')}
          </Button>
        </CardContent>
      </Card>

      {/* Impact summary */}
      {hasMinimumData && (
        <Card className="glass-card border-emerald-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-emerald-400 font-medium text-lg">{t('stepUI.impactMeasured')}</p>
                <p className="text-sm text-stone-400">
                  {t('stepUI.impactMeasuredDesc').replace('{users}', String(usersReached)).replace('{minutes}', String(timeSavedMinutes))}
                </p>
              </div>
            </div>

            {/* Total impact calculation */}
            <div className="p-4 bg-stone-800/30 rounded-lg">
              <p className="text-sm text-stone-400 mb-1">{t('stepUI.totalTimeSaved')}</p>
              <p className="text-2xl font-bold text-emerald-400">
                {t('stepUI.hoursFormat').replace('{hours}', (usersReached * timeSavedMinutes / 60).toFixed(1))}
              </p>
              <p className="text-xs text-stone-500">
                {t('stepUI.timeSavedCalc').replace('{users}', String(usersReached)).replace('{minutes}', String(timeSavedMinutes))}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => router.push(`/cycle/${cycle.id}/step/7`)}>
          {t('stepUI.backToDeployment')}
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => saveImpact(false)} disabled={isPending}>
            <Save className="mr-2 w-4 h-4" />
            {t('stepUI.saveDraft')}
          </Button>
          {newProblems.some((p) => p.trim()) && (
            <Button
              onClick={startNewCycle}
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-600 text-stone-900"
            >
              <RefreshCcw className="mr-2 w-4 h-4" />
              {t('stepUI.startNewCycle')}
            </Button>
          )}
          <Button
            onClick={() => saveImpact(true)}
            disabled={!hasMinimumData || isPending}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            {isPending ? t('common.saving') : t('stepUI.completeCycle')}
            <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
