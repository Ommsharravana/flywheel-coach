// Event Types for JKKN Solution Studio Events System

export type EventBannerColor = 'amber' | 'emerald' | 'violet' | 'rose' | 'sky';

export interface JudgingCriterion {
  name: string;
  weight: number;
}

export interface BonusCriterion {
  name: string;
  bonus: number;
}

export interface RoadmapPhase {
  days1_2?: string;
  days3_5?: string;
  days6_7?: string;
  days8_9?: string;
  day10?: string;
}

export interface EventConfig {
  type?: 'appathon' | 'hackathon' | 'workshop' | 'challenge';
  themes?: string[];
  judgingCriteria?: JudgingCriterion[];
  bonusCriteria?: BonusCriterion[];
  problemIdeas?: ProblemIdea[];
  roadmap?: RoadmapPhase;
  coachContext?: string;
}

export interface ProblemIdea {
  id: string;
  title: string;
  theme: string;
  description: string;
  targetUsers?: string;
  lovablePrompt?: string;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  config: EventConfig;
  banner_color: EventBannerColor;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithParticipantCount extends Event {
  participant_count: number;
}

// Helper to check if event is currently running
export function isEventLive(event: Event): boolean {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  return now >= start && now <= end && event.is_active;
}

// Helper to check if event is upcoming
export function isEventUpcoming(event: Event): boolean {
  const now = new Date();
  const start = new Date(event.start_date);
  return now < start && event.is_active;
}

// Helper to check if event has ended
export function isEventEnded(event: Event): boolean {
  const now = new Date();
  const end = new Date(event.end_date);
  return now > end;
}

// Get days remaining in event
export function getDaysRemaining(event: Event): number {
  const now = new Date();
  const end = new Date(event.end_date);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Get days until event starts
export function getDaysUntilStart(event: Event): number {
  const now = new Date();
  const start = new Date(event.start_date);
  const diff = start.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Banner color to Tailwind classes
export function getBannerColorClasses(color: EventBannerColor): {
  gradient: string;
  text: string;
  border: string;
  glow: string;
} {
  const colors: Record<EventBannerColor, { gradient: string; text: string; border: string; glow: string }> = {
    amber: {
      gradient: 'from-amber-500 via-orange-500 to-rose-500',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      glow: 'shadow-amber-500/20',
    },
    emerald: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      glow: 'shadow-emerald-500/20',
    },
    violet: {
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      text: 'text-violet-400',
      border: 'border-violet-500/30',
      glow: 'shadow-violet-500/20',
    },
    rose: {
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      glow: 'shadow-rose-500/20',
    },
    sky: {
      gradient: 'from-sky-500 via-blue-500 to-indigo-500',
      text: 'text-sky-400',
      border: 'border-sky-500/30',
      glow: 'shadow-sky-500/20',
    },
  };
  return colors[color];
}
