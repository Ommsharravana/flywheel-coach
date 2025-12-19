// Appathon 2.0 Content
// All event-specific content - can be deleted after January 2026

export const APPATHON_THEMES = [
  {
    id: 'healthcare',
    name: 'Healthcare + AI',
    icon: '🏥',
    description: 'Digital health solutions for patients, clinicians, and caregivers',
  },
  {
    id: 'education',
    name: 'Education + AI',
    icon: '📚',
    description: 'Learning enhancement tools for learners and educators',
  },
  {
    id: 'agriculture',
    name: 'Agriculture + AI',
    icon: '🌾',
    description: 'Smart farming solutions for sustainable agriculture',
  },
  {
    id: 'environment',
    name: 'Environment + AI',
    icon: '🌍',
    description: 'Sustainability tools for a greener future',
  },
  {
    id: 'community',
    name: 'Community + AI',
    icon: '👥',
    description: 'Social impact solutions for local communities',
  },
  {
    id: 'myjkkn',
    name: 'MyJKKN Data Apps',
    icon: '📱',
    description: 'Apps using your real JKKN data (grades, timetable, attendance)',
    isSpecialTrack: true,
  },
] as const;

export type AppathonThemeId = (typeof APPATHON_THEMES)[number]['id'];

export const JUDGING_CRITERIA = [
  {
    name: 'Problem Impact',
    weight: 25,
    description: 'How significant is the problem being solved?',
    tips: 'Pick a problem that affects many people or causes significant pain',
  },
  {
    name: 'Solution Innovation',
    weight: 20,
    description: 'Is the approach creative and novel?',
    tips: 'Think beyond obvious solutions. How can AI make this better?',
  },
  {
    name: 'Working Prototype',
    weight: 25,
    description: 'Does the app actually work? Is it polished?',
    tips: 'A simple app that works beats a complex app that crashes',
  },
  {
    name: 'User Validation',
    weight: 15,
    description: 'Did you test with real users? What feedback?',
    tips: 'Talk to 5+ potential users. Document their feedback.',
  },
  {
    name: 'Presentation Quality',
    weight: 10,
    description: 'Clear communication, good demo',
    tips: 'Practice your demo. Have a backup video ready.',
  },
  {
    name: 'Bioconvergence Alignment',
    weight: 5,
    description: "Connection to JKKN's mission",
    tips: 'How does your solution connect biology, technology, and human needs?',
  },
] as const;

export const BONUS_CRITERIA = [
  {
    name: 'Cross-disciplinary team',
    points: 5,
    description: 'Members from 2+ departments',
    icon: '🔀',
  },
  {
    name: 'Cross-institutional team',
    points: 5,
    description: 'Members from 2+ JKKN institutions',
    icon: '🏛️',
  },
  {
    name: 'First-year participation',
    points: 3,
    description: 'At least one first-year team member',
    icon: '🌱',
  },
  {
    name: 'User testimonials',
    points: 2,
    description: 'Real users vouching for your app',
    icon: '💬',
  },
] as const;

export interface ProblemIdea {
  problem: string;
  target: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lovablePrompt?: string;
}

export const PROBLEM_IDEAS: Record<AppathonThemeId, ProblemIdea[]> = {
  healthcare: [
    { problem: 'Drug interaction checker', target: 'Pharmacy learners', difficulty: 'Medium' },
    { problem: 'Patient appointment scheduler', target: 'Hospital staff', difficulty: 'Easy' },
    { problem: 'Mental health check-in tracker', target: 'College learners', difficulty: 'Medium' },
    { problem: 'Diet planner for diabetics', target: 'Patients', difficulty: 'Medium' },
    { problem: 'First aid guide (searchable)', target: 'General public', difficulty: 'Easy' },
    { problem: 'Lab report explainer', target: 'Patients', difficulty: 'Hard' },
    { problem: 'Medication reminder app', target: 'Elderly patients', difficulty: 'Easy' },
    { problem: 'Symptom checker chatbot', target: 'General public', difficulty: 'Medium' },
  ],
  education: [
    { problem: 'Flashcard generator from notes', target: 'Learners', difficulty: 'Easy' },
    { problem: 'Study schedule optimizer', target: 'Learners', difficulty: 'Medium' },
    { problem: 'Assignment deadline tracker', target: 'Learners', difficulty: 'Easy' },
    { problem: 'Quiz generator from textbook', target: 'Senior Learners', difficulty: 'Medium' },
    { problem: 'Personalized learning path', target: 'Learners', difficulty: 'Hard' },
    { problem: 'Doubt clarification bot', target: 'Learners', difficulty: 'Medium' },
    { problem: 'Study group finder', target: 'College learners', difficulty: 'Easy' },
    { problem: 'Exam preparation tracker', target: 'Competitive exam aspirants', difficulty: 'Medium' },
  ],
  agriculture: [
    { problem: 'Crop disease identifier (photo-based)', target: 'Farmers', difficulty: 'Hard' },
    { problem: 'Weather-based planting advisor', target: 'Farmers', difficulty: 'Medium' },
    { problem: 'Market price tracker', target: 'Farmers', difficulty: 'Easy' },
    { problem: 'Irrigation scheduler', target: 'Farmers', difficulty: 'Medium' },
    { problem: 'Fertilizer calculator', target: 'Farmers', difficulty: 'Easy' },
    { problem: 'Pest alert system', target: 'Farmers', difficulty: 'Medium' },
    { problem: 'Livestock health tracker', target: 'Dairy farmers', difficulty: 'Medium' },
    { problem: 'Seasonal crop planner', target: 'Small farmers', difficulty: 'Easy' },
  ],
  environment: [
    { problem: 'Waste segregation guide', target: 'Households', difficulty: 'Easy' },
    { problem: 'Carbon footprint calculator', target: 'Individuals', difficulty: 'Medium' },
    { problem: 'Water usage tracker', target: 'Households', difficulty: 'Easy' },
    { problem: 'Recycling locator', target: 'Community', difficulty: 'Medium' },
    { problem: 'Energy saving tips', target: 'Households', difficulty: 'Easy' },
    { problem: 'Tree planting tracker', target: 'Community', difficulty: 'Easy' },
    { problem: 'Air quality monitor', target: 'Urban residents', difficulty: 'Medium' },
    { problem: 'Sustainable product finder', target: 'Conscious consumers', difficulty: 'Medium' },
  ],
  community: [
    { problem: 'Local event finder', target: 'Community', difficulty: 'Easy' },
    { problem: 'Lost & found portal', target: 'Campus', difficulty: 'Easy' },
    { problem: 'Carpool matcher', target: 'Commuters', difficulty: 'Medium' },
    { problem: 'Skill sharing platform', target: 'Community', difficulty: 'Medium' },
    { problem: 'Blood donor connector', target: 'Hospitals', difficulty: 'Medium' },
    { problem: 'Senior citizen assistance', target: 'Elderly', difficulty: 'Medium' },
    { problem: 'Volunteer opportunity finder', target: 'College learners', difficulty: 'Easy' },
    { problem: 'Local business directory', target: 'Neighborhood', difficulty: 'Easy' },
  ],
  myjkkn: [
    {
      problem: 'My Day - Today\'s classes + countdown',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me my today\'s classes and tell me how many minutes until my next class',
    },
    {
      problem: 'Grade Tracker - Marks and GPA prediction',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show my grades for each subject and calculate what GPA I\'ll get if I keep this up',
    },
    {
      problem: 'Attendance Alert - Warns below 75%',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Alert me if my attendance is getting low and tell me which classes I\'m missing',
    },
    {
      problem: 'Fee Reminder - Payment status',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me my fee status - what I\'ve paid and what I still owe',
    },
    {
      problem: 'Faculty Finder - Search by name/department',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Help me find a faculty member and show their cabin location',
    },
    {
      problem: 'All My Updates - Notifications aggregator',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me all announcements and notifications from my college',
    },
    {
      problem: 'Campus Explorer - All 9 institutions',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Let me explore all JKKN colleges and see what programs they offer',
    },
    {
      problem: 'Course Browser - Find electives',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Help me browse available courses and see which ones fit my schedule',
    },
    {
      problem: 'My JKKN Dashboard - Everything in one screen',
      target: 'Learners',
      difficulty: 'Medium',
      lovablePrompt: 'Create a dashboard showing my classes, grades, attendance, and dues together',
    },
    {
      problem: 'Study Planner - Based on exam dates',
      target: 'Learners',
      difficulty: 'Medium',
      lovablePrompt: 'Look at my exam schedule and create a study plan for me',
    },
  ],
};

export const MYJKKN_DATA_ENDPOINTS = [
  {
    endpoint: '/academic/timetable',
    data: 'Class schedules',
    appIdea: 'Personal timetable widget',
  },
  {
    endpoint: '/academic/courses',
    data: 'Course catalog',
    appIdea: 'Course browser app',
  },
  {
    endpoint: '/students/grades',
    data: 'Your grades (with auth)',
    appIdea: 'Grade tracker with trends',
  },
  {
    endpoint: '/students/attendance',
    data: 'Your attendance',
    appIdea: 'Attendance alert app',
  },
  {
    endpoint: '/staff/directory',
    data: 'Faculty listing',
    appIdea: 'Faculty finder app',
  },
  {
    endpoint: '/notifications',
    data: 'Announcements',
    appIdea: 'Notification aggregator',
  },
  {
    endpoint: '/billing/dues',
    data: 'Fee status (with auth)',
    appIdea: 'Fee reminder app',
  },
  {
    endpoint: '/organizations',
    data: 'All 9 institutions',
    appIdea: 'Institution explorer',
  },
] as const;

export const APPATHON_DATES = {
  buildPhaseStart: '2025-12-21',
  buildPhaseEnd: '2025-12-30',
  submissionDeadline: '2025-12-30T23:59:00',
  demoDay: '2026-01-03',
  lovableFreeEnd: '2025-12-31',
} as const;

export const PRIZE_STRUCTURE = {
  main: [
    { place: 'First Prize', amount: 15000, extras: 'Featured in JKKN100' },
    { place: 'Second Prize', amount: 10000, extras: 'NIF incubation priority' },
    { place: 'Third Prize', amount: 5000, extras: 'Mentorship opportunity' },
  ],
  special: [
    { category: 'Best Healthcare Solution', amount: 5000 },
    { category: 'Best Education Solution', amount: 5000 },
    { category: 'Best First-Year Team', amount: 3000 },
    { category: 'Best Cross-Institutional Team', amount: 3000 },
    { category: "People's Choice", amount: 3000 },
    { category: 'Best User Validation', amount: 3000 },
  ],
  myjkkn: [
    { category: 'Best MyJKKN App', amount: 5000 },
    { category: 'Best Personal Dashboard', amount: 3000 },
    { category: 'Best Community Tool', amount: 3000 },
  ],
} as const;

// Helper to get total prize pool
export function getTotalPrizePool(): number {
  const mainTotal = PRIZE_STRUCTURE.main.reduce((sum, p) => sum + p.amount, 0);
  const specialTotal = PRIZE_STRUCTURE.special.reduce((sum, p) => sum + p.amount, 0);
  const myjkknTotal = PRIZE_STRUCTURE.myjkkn.reduce((sum, p) => sum + p.amount, 0);
  return mainTotal + specialTotal + myjkknTotal;
}

// Helper to get problem ideas by difficulty
export function getProblemIdeasByDifficulty(
  difficulty: 'Easy' | 'Medium' | 'Hard'
): ProblemIdea[] {
  return Object.values(PROBLEM_IDEAS)
    .flat()
    .filter((idea) => idea.difficulty === difficulty);
}
