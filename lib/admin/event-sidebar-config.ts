import {
  LayoutDashboard,
  FileText,
  Users,
  Target,
  Settings,
  Presentation,
  GitBranch,
  Printer,
  Sparkles,
  Scale,
  Vote,
  Trophy,
  Calendar,
  BookOpen,
  Lightbulb,
  ClipboardList,
  Award,
  MessageSquare,
  BarChart3,
  LucideIcon,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exactMatch?: boolean;
  external?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface EventSidebarConfig {
  type: string;
  label: string;
  description: string;
  sections: NavSection[];
}

// ============================================
// EVENT TYPE CONFIGURATIONS
// ============================================

function createSidebarConfig(slug: string, type: string): NavSection[] {
  const basePath = `/admin/events/${slug}`;

  // Common sections shared across event types
  const overviewSection: NavSection = {
    title: 'Overview',
    items: [
      {
        label: 'Event Dashboard',
        href: basePath,
        icon: LayoutDashboard,
        exactMatch: true,
      },
    ],
  };

  const settingsSection: NavSection = {
    title: 'Configuration',
    items: [
      {
        label: 'Settings',
        href: `${basePath}/settings`,
        icon: Settings,
      },
    ],
  };

  // Type-specific sections
  switch (type) {
    case 'appathon':
    case 'hackathon':
      return [
        overviewSection,
        {
          title: 'Management',
          items: [
            { label: 'Submissions', href: `${basePath}/submissions`, icon: FileText },
            { label: 'Builders', href: `${basePath}/builders`, icon: Users },
            { label: 'Learners', href: `${basePath}/learners`, icon: GraduationCap },
            { label: 'Senior Learners', href: `${basePath}/senior-learners`, icon: UserCheck },
            { label: 'Curate Problems', href: `${basePath}/curate`, icon: Target },
            { label: 'Settings', href: `${basePath}/settings`, icon: Settings },
          ],
        },
        {
          title: 'Demo Day',
          items: [
            { label: 'Command Center', href: `${basePath}/demo-day`, icon: Presentation },
            { label: 'Track Assignment', href: `${basePath}/demo-day/track-assignment`, icon: GitBranch },
            { label: 'Backup Sheets', href: `${basePath}/demo-day/backup-sheets`, icon: Printer },
            { label: 'AI Content', href: `${basePath}/demo-day/content-generator`, icon: Sparkles },
          ],
        },
        {
          title: 'Public Pages',
          items: [
            { label: 'Judge Panel', href: '/judge', icon: Scale, external: true },
            { label: 'Audience Voting', href: '/vote', icon: Vote, external: true },
            { label: 'Results', href: '/results', icon: Trophy, external: true },
          ],
        },
      ];

    case 'workshop':
      return [
        overviewSection,
        {
          title: 'Content',
          items: [
            { label: 'Sessions', href: `${basePath}/sessions`, icon: Calendar },
            { label: 'Materials', href: `${basePath}/materials`, icon: BookOpen },
            { label: 'Exercises', href: `${basePath}/exercises`, icon: ClipboardList },
          ],
        },
        {
          title: 'Participants',
          items: [
            { label: 'Attendees', href: `${basePath}/attendees`, icon: Users },
            { label: 'Feedback', href: `${basePath}/feedback`, icon: MessageSquare },
            { label: 'Certificates', href: `${basePath}/certificates`, icon: Award },
          ],
        },
        settingsSection,
      ];

    case 'ideathon':
      return [
        overviewSection,
        {
          title: 'Ideas',
          items: [
            { label: 'Submissions', href: `${basePath}/submissions`, icon: Lightbulb },
            { label: 'Teams', href: `${basePath}/teams`, icon: Users },
            { label: 'Themes', href: `${basePath}/themes`, icon: Target },
          ],
        },
        {
          title: 'Evaluation',
          items: [
            { label: 'Judging', href: `${basePath}/judging`, icon: Scale },
            { label: 'Results', href: `${basePath}/results`, icon: Trophy },
          ],
        },
        settingsSection,
      ];

    case 'competition':
      return [
        overviewSection,
        {
          title: 'Participants',
          items: [
            { label: 'Registrations', href: `${basePath}/registrations`, icon: ClipboardList },
            { label: 'Teams', href: `${basePath}/teams`, icon: Users },
          ],
        },
        {
          title: 'Competition',
          items: [
            { label: 'Rounds', href: `${basePath}/rounds`, icon: Calendar },
            { label: 'Scoring', href: `${basePath}/scoring`, icon: Scale },
            { label: 'Leaderboard', href: `${basePath}/leaderboard`, icon: BarChart3 },
            { label: 'Results', href: `${basePath}/results`, icon: Trophy },
          ],
        },
        settingsSection,
      ];

    default:
      // Generic event sidebar
      return [
        overviewSection,
        {
          title: 'Management',
          items: [
            { label: 'Participants', href: `${basePath}/participants`, icon: Users },
            { label: 'Schedule', href: `${basePath}/schedule`, icon: Calendar },
          ],
        },
        settingsSection,
      ];
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

export function getEventSidebarConfig(slug: string, eventType: string): NavSection[] {
  return createSidebarConfig(slug, eventType.toLowerCase());
}

// Event type metadata for UI display
export const EVENT_TYPES: Record<string, { label: string; description: string }> = {
  appathon: {
    label: 'Appathon',
    description: 'Hackathon-style app building competition with demos and judging',
  },
  hackathon: {
    label: 'Hackathon',
    description: 'Time-bound coding competition with submissions and judging',
  },
  workshop: {
    label: 'Workshop',
    description: 'Learning sessions with materials, exercises, and certificates',
  },
  ideathon: {
    label: 'Ideathon',
    description: 'Idea pitching competition with themes and evaluation',
  },
  competition: {
    label: 'Competition',
    description: 'Multi-round competition with scoring and leaderboards',
  },
  generic: {
    label: 'Generic Event',
    description: 'Basic event with participants and schedule',
  },
};
