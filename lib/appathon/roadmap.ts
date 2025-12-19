// Appathon 2.0 - 10-Day Build Phase Roadmap
// Can be deleted after January 2026

import { APPATHON_DATES } from './content';

export interface RoadmapPhase {
  days: string;
  dayNumbers: number[];
  title: string;
  tasks: string[];
  tips: string[];
  focusArea: 'planning' | 'building' | 'testing' | 'polishing' | 'submitting';
}

export const BUILD_PHASE_ROADMAP: RoadmapPhase[] = [
  {
    days: '1-2',
    dayNumbers: [1, 2],
    title: 'Problem & Planning',
    focusArea: 'planning',
    tasks: [
      'Define your problem clearly in one sentence',
      'Sketch your solution on paper (no code yet!)',
      'Identify 5 potential users to talk to',
      'Create your Lovable project',
      'Write your first prompt describing what you want',
    ],
    tips: [
      "Don't skip planning - it saves time later",
      'Talk to at least 2 potential users before building',
      'Simple problems done well beat complex problems done poorly',
      "For MyJKKN apps: Paste the context document first!",
    ],
  },
  {
    days: '3-5',
    dayNumbers: [3, 4, 5],
    title: 'Core Features',
    focusArea: 'building',
    tasks: [
      'Build the ONE most important feature first',
      'Get something working end-to-end',
      "Don't worry about making it pretty yet",
      'Test each feature as you build it',
      'Keep a list of bugs to fix later',
    ],
    tips: [
      'Focus on ONE core flow that works perfectly',
      'Ship something that works, not everything that might be nice',
      'If something is hard, ask: do we really need this?',
      "It's okay to pivot if your idea isn't working",
    ],
  },
  {
    days: '6-7',
    dayNumbers: [6, 7],
    title: 'User Testing',
    focusArea: 'testing',
    tasks: [
      'Show your app to 5+ potential users',
      'Watch them use it (don\'t help unless stuck)',
      'Ask: "What\'s confusing? What\'s missing?"',
      'Document their exact words (for bonus points!)',
      'Record video testimonials if possible',
    ],
    tips: [
      'Real user feedback > your assumptions',
      "User Validation is worth 15% of your score",
      'Testimonials give you bonus points',
      "Listen more than you explain",
    ],
  },
  {
    days: '8-9',
    dayNumbers: [8, 9],
    title: 'Iteration & Polish',
    focusArea: 'polishing',
    tasks: [
      'Fix the top 3 issues users mentioned',
      'Improve the UI/UX based on feedback',
      'Test on mobile (many judges use phones)',
      'Add final touches and loading states',
      'Remove any debug code or dummy data',
    ],
    tips: [
      "Don't add new features - polish what you have",
      "Working Prototype is worth 25% of your score",
      'A polished simple app beats a buggy complex one',
      'Test everything one more time',
    ],
  },
  {
    days: '10',
    dayNumbers: [10],
    title: 'Final Prep & Submission',
    focusArea: 'submitting',
    tasks: [
      'Record a 2-minute backup demo video',
      'Test your app one final time',
      'Prepare your presentation notes',
      'Submit before 11:59 PM!',
      'Get a good night\'s sleep for Demo Day',
    ],
    tips: [
      'Backup video is REQUIRED - tech can fail on Demo Day',
      "Don't make last-minute changes that might break things",
      'Submit early, not at 11:58 PM',
      "You've got this! 🎉",
    ],
  },
];

// Calculate current day in the build phase
export function getCurrentBuildDay(): number {
  const start = new Date(APPATHON_DATES.buildPhaseStart);
  const now = new Date();
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(10, diffDays));
}

// Get current phase based on day
export function getCurrentPhase(): RoadmapPhase | null {
  const currentDay = getCurrentBuildDay();
  if (currentDay <= 0) return null;

  return BUILD_PHASE_ROADMAP.find((phase) =>
    phase.dayNumbers.includes(currentDay)
  ) ?? null;
}

// Check if build phase has started
export function isBuildPhaseActive(): boolean {
  const now = new Date();
  const start = new Date(APPATHON_DATES.buildPhaseStart);
  const end = new Date(APPATHON_DATES.buildPhaseEnd);
  end.setHours(23, 59, 59, 999);
  return now >= start && now <= end;
}

// Get days remaining in build phase
export function getDaysRemaining(): number {
  const end = new Date(APPATHON_DATES.buildPhaseEnd);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// Get phase status
export type PhaseStatus = 'completed' | 'current' | 'upcoming';

export function getPhaseStatus(phase: RoadmapPhase): PhaseStatus {
  const currentDay = getCurrentBuildDay();
  const lastDayOfPhase = Math.max(...phase.dayNumbers);
  const firstDayOfPhase = Math.min(...phase.dayNumbers);

  if (currentDay > lastDayOfPhase) return 'completed';
  if (currentDay >= firstDayOfPhase) return 'current';
  return 'upcoming';
}

// Demo Day countdown
export function getDemoDayCountdown(): { days: number; hours: number; isDemo: boolean } {
  const demoDay = new Date(APPATHON_DATES.demoDay);
  demoDay.setHours(9, 0, 0, 0); // 9 AM
  const now = new Date();
  const diffTime = demoDay.getTime() - now.getTime();

  if (diffTime <= 0) {
    return { days: 0, hours: 0, isDemo: true };
  }

  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return { days, hours, isDemo: false };
}
