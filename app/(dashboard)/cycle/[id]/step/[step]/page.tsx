import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUserId } from '@/lib/supabase/effective-user';
import { Cycle, FLYWHEEL_STEPS } from '@/lib/types/cycle';
import { FlywheelNavigator } from '@/components/flywheel/FlywheelNavigator';
import { MobileStepNavigation } from '@/components/flywheel/MobileStepNavigation';
import { ProblemDiscovery } from '@/components/steps/ProblemDiscovery';
import { ContextDiscovery } from '@/components/steps/ContextDiscovery';
import { ValueDiscovery } from '@/components/steps/ValueDiscovery';
import { WorkflowClassifier } from '@/components/steps/WorkflowClassifier';
import { PromptGenerator } from '@/components/steps/PromptGenerator';
import { BuildTracker } from '@/components/steps/BuildTracker';
import { DeploymentTracker } from '@/components/steps/DeploymentTracker';
import { ImpactDiscovery } from '@/components/steps/ImpactDiscovery';
import { StepPageClient } from './StepPageClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StepPageProps {
  params: Promise<{ id: string; step: string }>;
}

export default async function StepPage({ params }: StepPageProps) {
  const { id, step } = await params;
  const stepNumber = parseInt(step, 10);
  const supabase = await createClient();

  // Get effective user ID (respects impersonation)
  const effectiveUserId = await getEffectiveUserId();

  if (!effectiveUserId) {
    redirect('/login');
  }

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > 8) {
    redirect(`/cycle/${id}`);
  }

  // Fetch the cycle using effective user ID
  const { data: rawCycleData, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', id)
    .eq('user_id', effectiveUserId)
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
    name: cycleData.name || 'Cycle',
    status: cycleData.status,
    currentStep: cycleData.current_step,
    impactScore: cycleData.impact_score,
    startedAt: cycleData.started_at,
    createdAt: cycleData.created_at,
    updatedAt: cycleData.updated_at,
    completedAt: cycleData.completed_at,
  };

  // Helper to safely cast Supabase data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = (data: unknown): any => data;

  // Fetch related data based on step
  if (stepNumber >= 1) {
    const { data: rawProblemData } = await supabase
      .from('problems')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawProblemData) {
      const problemData = asAny(rawProblemData);
      cycle.problem = {
        id: problemData.id,
        statement: problemData.statement,
        refinedStatement: problemData.refined_statement,
        painLevel: problemData.pain_level,
        frequency: problemData.frequency,
        answers: problemData.answers || {},
      };
    }
  }

  if (stepNumber >= 2) {
    const { data: rawContextData } = await supabase
      .from('contexts')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawContextData) {
      const contextData = asAny(rawContextData);
      cycle.context = {
        id: contextData.id,
        who: contextData.primary_users || '',
        when: contextData.frequency || '',
        where: '',
        howPainful: contextData.pain_level || 5,
        currentSolution: contextData.current_workaround || '',
        interviews: [],
      };
    }
  }

  if (stepNumber >= 3) {
    const { data: rawValueData } = await supabase
      .from('value_assessments')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawValueData) {
      const valueData = asAny(rawValueData);
      cycle.valueAssessment = {
        id: valueData.id,
        desperateUserScore: (valueData.desperate_user_score || 0) * 20, // DB stores 0-5, convert to 0-100
        criteria: {
          activelySearching: valueData.complained_before || false,
          triedAlternatives: valueData.doing_something || false,
          willingToPay: valueData.light_up_at_solution || false,
          urgentNeed: valueData.ask_when_can_use || false,
          frequentProblem: valueData.multiple_have_it || false,
        },
        evidence: {
          activelySearching: valueData.complained_before_evidence || '',
          triedAlternatives: valueData.doing_something_evidence || '',
          willingToPay: valueData.light_up_evidence || '',
          urgentNeed: valueData.ask_when_evidence || '',
          frequentProblem: valueData.multiple_have_it_evidence || '',
        },
        decision: valueData.decision,
      };
    }
  }

  if (stepNumber >= 4) {
    const { data: rawWorkflowData } = await supabase
      .from('workflow_classifications')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawWorkflowData) {
      const workflowData = asAny(rawWorkflowData);
      // Support multi-select with backward compatibility for single selection
      const selectedTypes = workflowData.classification_path?.original_types
        || (workflowData.classification_path?.original_type ? [workflowData.classification_path.original_type] : [])
        || (workflowData.workflow_type ? [workflowData.workflow_type] : []);

      cycle.workflowClassification = {
        id: workflowData.id,
        // Deprecated: kept for backward compat
        selectedType: workflowData.classification_path?.original_type || workflowData.workflow_type,
        // New: array of selected types
        selectedTypes,
        reasoning: workflowData.classification_path?.reasoning || '',
        customDescription: workflowData.classification_path?.custom_description || '',
        features: workflowData.features || [],
      };
    }
  }

  if (stepNumber >= 5) {
    const { data: rawPromptData } = await supabase
      .from('prompts')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawPromptData) {
      const promptData = asAny(rawPromptData);
      cycle.prompt = {
        id: promptData.id,
        generatedPrompt: promptData.generated_prompt,
        editedPrompt: promptData.edited_prompt,
        copiedAt: promptData.copied_at,
      };
    }
  }

  if (stepNumber >= 6) {
    const { data: rawBuildData } = await supabase
      .from('builds')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawBuildData) {
      const buildData = asAny(rawBuildData);
      cycle.build = {
        id: buildData.id,
        lovableUrl: buildData.lovable_project_url, // DB column is lovable_project_url
        projectUrl: buildData.deployed_url, // DB column is deployed_url
        screenshotUrl: buildData.screenshot_urls?.[0], // DB column is screenshot_urls (array)
        completedAt: buildData.completed_at,
      };
    }
  }

  if (stepNumber >= 8) {
    const { data: rawImpactData } = await supabase
      .from('impacts')
      .select('*')
      .eq('cycle_id', id)
      .single();

    if (rawImpactData) {
      const impactData = asAny(rawImpactData);
      cycle.impact = {
        id: impactData.id,
        usersReached: impactData.users_reached,
        timeSavedMinutes: impactData.time_saved_minutes,
        satisfactionScore: impactData.satisfaction_score,
        feedback: impactData.feedback,
        lessonsLearned: impactData.lessons_learned,
        newProblems: impactData.new_problems || [],
      };
    }
  }

  const stepInfo = FLYWHEEL_STEPS[stepNumber - 1];
  const prevStep = stepNumber > 1 ? stepNumber - 1 : null;
  const nextStep = stepNumber < 8 ? stepNumber + 1 : null;

  // Render appropriate step component
  const renderStepComponent = () => {
    switch (stepNumber) {
      case 1:
        return <ProblemDiscovery cycle={cycle} />;
      case 2:
        return <ContextDiscovery cycle={cycle} />;
      case 3:
        return <ValueDiscovery cycle={cycle} />;
      case 4:
        return <WorkflowClassifier cycle={cycle} />;
      case 5:
        return <PromptGenerator cycle={cycle} />;
      case 6:
        return <BuildTracker cycle={cycle} />;
      case 7:
        return <DeploymentTracker cycle={cycle} />;
      case 8:
        return <ImpactDiscovery cycle={cycle} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-stone-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with navigation - Desktop only */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-stone-500 hover:text-stone-300 text-sm flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span className="text-stone-600">/</span>
            <Link href={`/cycle/${id}`} className="text-stone-500 hover:text-stone-300 text-sm flex items-center gap-1">
              Cycle Overview
            </Link>
          </div>

          {/* Compact step navigator */}
          <FlywheelNavigator cycle={cycle} currentStep={stepNumber} compact />
        </div>

        {/* Mobile swipe navigation */}
        <MobileStepNavigation cycle={cycle} currentStep={stepNumber}>
          {/* Mobile step content */}
          <div className="space-y-4">
            {renderStepComponent()}
          </div>
        </MobileStepNavigation>

        {/* Desktop layout */}
        <div className="hidden md:block">
          {/* Step header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-3xl">
              {stepInfo.icon}
            </div>
            <div>
              <div className="text-sm text-amber-400 font-medium">Step {stepNumber} of 8</div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-stone-100">
                {stepInfo.name}
              </h1>
              <p className="text-stone-400">{stepInfo.description}</p>
            </div>
          </div>

          {/* Main content area */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Step content - 2 columns */}
            <div className="lg:col-span-2">
              {renderStepComponent()}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Navigation card */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-100">Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prevStep && (
                    <Link href={`/cycle/${id}/step/${prevStep}`}>
                      <Button variant="outline" className="w-full justify-start">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Step {prevStep}: {FLYWHEEL_STEPS[prevStep - 1].shortName}
                      </Button>
                    </Link>
                  )}
                  {nextStep && (
                    <Link href={`/cycle/${id}/step/${nextStep}`}>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled={stepNumber >= cycle.currentStep}
                      >
                        Step {nextStep}: {FLYWHEEL_STEPS[nextStep - 1].shortName}
                        <ArrowRight className="ml-auto h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>

              {/* Tips card */}
              <Card className="glass-card border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-400">Tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-stone-300 space-y-2">
                  {stepNumber === 1 && (
                    <>
                      <p>Be specific about the problem. Vague problems lead to vague solutions.</p>
                      <p>Think about problems you personally experience - you'll understand them better.</p>
                    </>
                  )}
                  {stepNumber === 2 && (
                    <>
                      <p>Talk to at least 3 people who experience this problem.</p>
                      <p>Listen more than you talk. Let them describe the pain in their words.</p>
                    </>
                  )}
                  {stepNumber === 3 && (
                    <>
                      <p>The Desperate User Test separates "nice to have" from "must have" problems.</p>
                      <p>Look for evidence, not just opinions.</p>
                    </>
                  )}
                  {stepNumber === 4 && (
                    <>
                      <p>Most problems fit into one of 10 common workflow types.</p>
                      <p>Choosing the right type makes building much faster.</p>
                    </>
                  )}
                  {stepNumber === 5 && (
                    <>
                      <p>A good prompt includes context, constraints, and clear outcomes.</p>
                      <p>The more specific your prompt, the better the result.</p>
                    </>
                  )}
                  {stepNumber === 6 && (
                    <>
                      <p>Don't try to build everything at once. Start with the core flow.</p>
                      <p>Get something working, then iterate.</p>
                    </>
                  )}
                  {stepNumber === 7 && (
                    <>
                      <p>Ship early, ship often. Perfect is the enemy of done.</p>
                      <p>Real feedback from real users is worth more than speculation.</p>
                    </>
                  )}
                  {stepNumber === 8 && (
                    <>
                      <p>Measure what matters. Don't track vanity metrics.</p>
                      <p>Every completed cycle reveals new problems - that's the flywheel!</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* AI Coach */}
        <StepPageClient cycle={cycle} currentStep={stepNumber} />
      </div>
    </div>
  );
}
