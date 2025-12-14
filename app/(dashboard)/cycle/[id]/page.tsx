import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FlywheelNavigator, FlywheelProgress } from '@/components/flywheel/FlywheelNavigator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowRight, Clock, Home, RotateCcw, Target } from 'lucide-react';
import { Cycle } from '@/lib/types/cycle';
import { CycleActions } from './CycleActions';

interface CyclePageProps {
  params: Promise<{ id: string }>;
}

export default async function CyclePage({ params }: CyclePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the cycle
  const { data: rawCycleData, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !rawCycleData) {
    redirect('/dashboard');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cycleData = rawCycleData as any;

  // Transform to Cycle type
  const cycle: Cycle = {
    id: cycleData.id,
    userId: cycleData.user_id,
    name: cycleData.name || 'Flywheel Cycle',
    status: cycleData.status,
    currentStep: cycleData.current_step,
    impactScore: cycleData.impact_score,
    startedAt: cycleData.started_at,
    createdAt: cycleData.created_at,
    updatedAt: cycleData.updated_at,
    completedAt: cycleData.completed_at,
  };

  // Fetch problem if exists
  const { data: rawProblemData } = await supabase
    .from('problems')
    .select('*')
    .eq('cycle_id', id)
    .single();

  if (rawProblemData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const problemData = rawProblemData as any;
    cycle.problem = {
      id: problemData.id,
      statement: problemData.statement,
      refinedStatement: problemData.refined_statement,
      painLevel: problemData.pain_level,
      frequency: problemData.frequency,
      answers: problemData.answers || {},
    };
  }

  const currentStepName = [
    'Problem Discovery',
    'Context Discovery',
    'Value Discovery',
    'Workflow Classification',
    'Prompt Generation',
    'Building',
    'Deployment',
    'Impact Discovery',
  ][cycle.currentStep - 1];

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/dashboard" className="text-stone-500 hover:text-stone-300 text-sm mb-2 flex items-center gap-1">
              <Home className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-3xl font-display font-bold text-stone-100">
              {cycle.name}
            </h1>
            <p className="text-stone-400 mt-1">
              Started {new Date(cycle.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CycleActions cycleId={id} />
            <Link href={`/cycle/${id}/step/${cycle.currentStep}`}>
              <Button className="bg-amber-500 hover:bg-amber-600 text-stone-900 font-semibold">
                Continue to {currentStepName}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress */}
        <Card className="glass-card mb-8">
          <CardContent className="pt-6">
            <FlywheelProgress cycle={cycle} />
          </CardContent>
        </Card>

        {/* Flywheel Navigator */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-xl text-stone-100">Flywheel Progress</CardTitle>
              <CardDescription>Click any completed or current step to navigate</CardDescription>
            </CardHeader>
            <CardContent>
              <FlywheelNavigator cycle={cycle} currentStep={cycle.currentStep} />
            </CardContent>
          </Card>

          {/* Current Step Info */}
          <div className="space-y-6">
            <Card className="glass-card border-amber-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-amber-400">
                      Step {cycle.currentStep}: {currentStepName}
                    </CardTitle>
                    <CardDescription>Currently in progress</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-stone-300 mb-4">
                  {cycle.currentStep === 1 &&
                    'Discover a problem worth solving by answering 5 key questions and crafting your problem statement.'}
                  {cycle.currentStep === 2 &&
                    'Understand who experiences this problem, when it happens, and how painful it is.'}
                  {cycle.currentStep === 3 &&
                    'Apply the Desperate User Test to validate real demand for your solution.'}
                  {cycle.currentStep === 4 &&
                    'Classify your solution into one of 10 workflow types for optimal building.'}
                  {cycle.currentStep === 5 &&
                    'Generate a Lovable-ready prompt based on everything you\'ve learned.'}
                  {cycle.currentStep === 6 &&
                    'Build your solution using Lovable AI with the generated prompt.'}
                  {cycle.currentStep === 7 &&
                    'Deploy your solution and get it live for users.'}
                  {cycle.currentStep === 8 &&
                    'Measure impact and discover new problems for the next cycle.'}
                </p>
                <Link href={`/cycle/${id}/step/${cycle.currentStep}`}>
                  <Button className="w-full bg-amber-500 hover:bg-amber-600 text-stone-900">
                    Continue Step
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-lg text-stone-100">Cycle Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-400">
                      {Math.max(0, cycle.currentStep - 1)}
                    </div>
                    <div className="text-sm text-stone-400">Steps Complete</div>
                  </div>
                  <div className="text-center p-4 bg-stone-800/50 rounded-lg">
                    <div className="text-2xl font-bold text-stone-100">
                      <Clock className="w-6 h-6 inline" />
                    </div>
                    <div className="text-sm text-stone-400">In Progress</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Problem Summary (if exists) */}
            {cycle.problem && (
              <Card className="glass-card border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-400">Problem Statement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-stone-300 italic">
                    "{cycle.problem.refinedStatement || cycle.problem.statement}"
                  </p>
                  <div className="flex gap-4 mt-4 text-sm">
                    <div className="text-stone-400">
                      Pain: <span className="text-amber-400">{cycle.problem.painLevel}/10</span>
                    </div>
                    <div className="text-stone-400">
                      Frequency: <span className="text-amber-400 capitalize">{cycle.problem.frequency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
