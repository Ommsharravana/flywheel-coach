// Flywheel Cycle Types

export type CycleStatus = 'active' | 'completed' | 'abandoned';

export type StepStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';

export interface FlywheelStep {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  status: StepStatus;
}

export const FLYWHEEL_STEPS: Omit<FlywheelStep, 'status'>[] = [
  {
    id: 1,
    name: 'Problem Discovery',
    shortName: 'Problem',
    description: 'Find a problem worth solving through 5 key questions',
    icon: '🔍',
  },
  {
    id: 2,
    name: 'Context Discovery',
    shortName: 'Context',
    description: 'Understand who, when, and how painful the problem is',
    icon: '🎯',
  },
  {
    id: 3,
    name: 'Value Discovery',
    shortName: 'Value',
    description: 'Apply the Desperate User Test to validate demand',
    icon: '💎',
  },
  {
    id: 4,
    name: 'Workflow Classification',
    shortName: 'Workflow',
    description: 'Identify which of 10 workflow types fits best',
    icon: '⚙️',
  },
  {
    id: 5,
    name: 'Prompt Generation',
    shortName: 'Prompt',
    description: 'Generate a Lovable-ready prompt for building',
    icon: '✨',
  },
  {
    id: 6,
    name: 'Building',
    shortName: 'Build',
    description: 'Build your solution with Lovable AI',
    icon: '🔨',
  },
  {
    id: 7,
    name: 'Deployment',
    shortName: 'Deploy',
    description: 'Deploy your solution and get it live',
    icon: '🚀',
  },
  {
    id: 8,
    name: 'Impact Discovery',
    shortName: 'Impact',
    description: 'Measure results and discover new problems',
    icon: '📊',
  },
];

export interface Problem {
  id: string;
  statement: string;
  refinedStatement?: string;
  painLevel: number; // 1-10
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
  answers: {
    question1: string; // What frustrates you most?
    question2: string; // What takes too long?
    question3: string; // What do you avoid doing?
    question4: string; // What would you pay to fix?
    question5: string; // What problem affects others too?
  };
}

export interface Context {
  id: string;
  who: string; // Who experiences this problem?
  when: string; // When does it happen?
  where: string; // Where does it occur?
  howPainful: number; // 1-10
  currentSolution: string; // How do they solve it now?
  interviews: Interview[];
}

export interface Interview {
  id: string;
  personName: string;
  role: string;
  date: string;
  notes: string;
  painLevel: number;
  wouldPay: boolean;
  referrals: string[];
}

export interface ValueAssessment {
  id: string;
  desperateUserScore: number; // 0-100
  criteria: {
    activelySearching: boolean;
    triedAlternatives: boolean;
    willingToPay: boolean;
    urgentNeed: boolean;
    frequentProblem: boolean;
  };
  evidence: {
    activelySearching: string;
    triedAlternatives: string;
    willingToPay: string;
    urgentNeed: string;
    frequentProblem: string;
  };
  decision: 'proceed' | 'pivot' | 'abandon';
}

export type WorkflowType =
  | 'form-to-output'
  | 'data-entry'
  | 'approval-workflow'
  | 'notification-system'
  | 'search-filter'
  | 'dashboard-analytics'
  | 'content-management'
  | 'scheduling-booking'
  | 'inventory-tracking'
  | 'communication-hub'
  | 'custom';

export interface WorkflowClassification {
  id: string;
  selectedType?: WorkflowType; // Deprecated: kept for backward compatibility
  selectedTypes: WorkflowType[]; // New: supports multi-select
  reasoning: string;
  customDescription?: string;
  features: string[];
}

export interface Prompt {
  id: string;
  generatedPrompt: string;
  editedPrompt?: string;
  copiedAt?: string;
}

export interface Build {
  id: string;
  lovableUrl?: string;
  projectUrl?: string;
  screenshotUrl?: string;
  completedAt?: string;
}

export interface Impact {
  id: string;
  usersReached: number;
  timeSavedMinutes: number;
  satisfactionScore: number; // 1-10
  feedback: string;
  lessonsLearned: string;
  newProblems: string[];
}

export interface Cycle {
  id: string;
  userId: string;
  name: string;
  status: CycleStatus;
  currentStep: number;
  problem?: Problem;
  context?: Context;
  valueAssessment?: ValueAssessment;
  workflowClassification?: WorkflowClassification;
  prompt?: Prompt;
  build?: Build;
  impact?: Impact;
  impactScore?: number;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// Helper function to get step status based on currentStep
export function getStepStatus(cycle: Cycle, stepId: number): StepStatus {
  if (stepId < cycle.currentStep) return 'completed';
  if (stepId === cycle.currentStep) return 'in-progress';
  return 'not-started';
}

// Helper to check if step is accessible
export function canAccessStep(cycle: Cycle, stepId: number): boolean {
  if (stepId === 1) return true;
  // Can access current step or any previous step
  return stepId <= cycle.currentStep;
}
