/**
 * Flywheel 8-Step Methodology
 *
 * The core JKKN innovation methodology used in Appathon 2.0 and beyond.
 * Based on the "Find Problem → Build Solution → Measure Impact" cycle.
 */

import type { Methodology } from './types';

export const FLYWHEEL_8: Methodology = {
  id: 'flywheel-8',
  name: 'Flywheel 8-Step',
  description:
    'The complete innovation cycle: discover problems, validate value, build solutions, measure impact.',
  version: '1.0.0',

  steps: [
    {
      id: 1,
      name: 'Problem Discovery',
      shortName: 'Problem',
      description: 'Find a problem worth solving through 5 key questions',
      icon: 'Search',
      color: 'text-amber-400',
      component: 'ProblemDiscovery',
      dataTable: 'problems',
      requiredFields: ['selected_question', 'refined_statement'],
    },
    {
      id: 2,
      name: 'Context Discovery',
      shortName: 'Context',
      description: 'Understand who, when, and how painful the problem is',
      icon: 'Target',
      color: 'text-blue-400',
      component: 'ContextDiscovery',
      dataTable: 'contexts',
      requiredFields: ['who_affected', 'when_occurs'],
    },
    {
      id: 3,
      name: 'Value Discovery',
      shortName: 'Value',
      description: 'Apply the Desperate User Test to validate demand',
      icon: 'Gem',
      color: 'text-purple-400',
      component: 'ValueDiscovery',
      dataTable: 'value_assessments',
      requiredFields: ['desperate_user_score'],
    },
    {
      id: 4,
      name: 'Workflow Classification',
      shortName: 'Workflow',
      description: 'Identify which of 10 workflow types fits best',
      icon: 'Settings',
      color: 'text-green-400',
      component: 'WorkflowClassification',
      dataTable: 'workflows',
      requiredFields: ['selected_types'],
    },
    {
      id: 5,
      name: 'Prompt Generation',
      shortName: 'Prompt',
      description: 'Generate a Lovable-ready prompt for building',
      icon: 'Sparkles',
      color: 'text-pink-400',
      component: 'PromptGeneration',
      dataTable: 'prompts',
      requiredFields: ['generated_prompt'],
    },
    {
      id: 6,
      name: 'Building',
      shortName: 'Build',
      description: 'Build your solution with Lovable AI',
      icon: 'Hammer',
      color: 'text-orange-400',
      component: 'Building',
      dataTable: 'builds',
      requiredFields: ['lovable_url'],
    },
    {
      id: 7,
      name: 'Deployment',
      shortName: 'Deploy',
      description: 'Deploy your solution and get it live',
      icon: 'Rocket',
      color: 'text-cyan-400',
      component: 'Deployment',
      dataTable: 'deployments',
      requiredFields: ['deployed_url'],
    },
    {
      id: 8,
      name: 'Impact Discovery',
      shortName: 'Impact',
      description: 'Measure results and discover new problems',
      icon: 'BarChart3',
      color: 'text-emerald-400',
      component: 'ImpactDiscovery',
      dataTable: 'impact_assessments',
      requiredFields: ['users_reached'],
    },
  ],

  completionStep: 8,

  features: {
    problemBank: true,
    teamMode: false,
    submission: false, // Appathon adds this via extension
    impactTracking: true,
  },

  branding: {
    primaryColor: 'amber',
    accentColor: 'orange',
  },
};

/**
 * Appathon Extension Step
 *
 * Added as step 9 when the cycle is part of an Appathon event.
 * This step handles competition submission.
 */
export const APPATHON_SUBMISSION_STEP = {
  id: 9,
  name: 'Appathon Submission',
  shortName: 'Submit',
  description: 'Submit your solution for the Appathon competition',
  icon: 'Trophy',
  color: 'text-yellow-400',
  component: 'AppathonSubmission',
  dataTable: 'appathon_submissions',
  requiredFields: ['submitted_at'],
  optional: false,
};

/**
 * Get Flywheel methodology with optional Appathon extension
 */
export function getFlywheelMethodology(includeAppathon: boolean = false): Methodology {
  if (!includeAppathon) {
    return FLYWHEEL_8;
  }

  return {
    ...FLYWHEEL_8,
    id: 'flywheel-8-appathon',
    name: 'Flywheel 8-Step + Appathon',
    steps: [...FLYWHEEL_8.steps, APPATHON_SUBMISSION_STEP],
    completionStep: 9,
    features: {
      ...FLYWHEEL_8.features,
      submission: true,
    },
  };
}
