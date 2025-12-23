// Appathon 2.0 Launch Document Content
// Source: /Users/omm/Vaults/JKKNKB/Events/Appathon-2.0/Launch-Document.md
// Can be deleted after January 2026

// ============================================
// SUCCESS STORY
// ============================================

export const APPATHON_SUCCESS_STORY = {
  headline: 'A Dental team won last year.',
  subheadline: 'Zero coding experience.',
  teamLead: 'Dr. Jagadheshan',
  teamMember: 'Roshini',
  department: 'Dental',
  project: 'AI Golden Proportion Analyzer',
  impact: 'Revolutionary tool for dental aesthetics assessment',
  eventYear: '2024',
  venue: 'Senthuraja Hall',
} as const;

// ============================================
// TWO-PHASE FORMAT
// ============================================

export const TWO_PHASE_FORMAT = {
  buildPhase: {
    name: 'BUILD PHASE',
    dates: 'Dec 21-30, 2025',
    startDate: '2025-12-21',
    endDate: '2025-12-30',
    days: 10,
    highlight: 'FREE Lovable access',
    description: 'Teams build apps using FREE Lovable',
  },
  demoDay: {
    name: 'DEMO DAY',
    date: 'Jan 3, 2026',
    isoDate: '2026-01-03',
    format: '7-min presentations',
    description: 'Teams present & compete for prizes',
  },
  lovableFreeEnd: '2025-12-31',
  whyTwoPhases: {
    opportunity: 'Lovable is FREE until December 31st, 2025.',
    challenge: 'After Dec 31, it becomes paid.',
    solution: 'BUILD during the free period (Dec 21-30) — 10 full days! DEMO on January 3rd — showcase your creation, win prizes.',
  },
  advantages: [
    'More time to build something meaningful',
    'More time to iterate and improve',
    'More time to validate with real users',
    'Demo Day focuses purely on presentation quality',
  ],
} as const;

// ============================================
// MYJKKN INTEGRATION TRACK
// ============================================

export const MYJKKN_TRACK = {
  isNew: true,
  tagline: 'Build apps that connect to REAL MyJKKN data!',
  description: 'Build with YOUR real JKKN data (grades, attendance, timetable)',
  extraPrizes: 11000,
  prizes: [
    { category: 'Best MyJKKN App', amount: 5000, criteria: 'Most useful app using MyJKKN data' },
    { category: 'Best Personal Dashboard', amount: 3000, criteria: 'Best use of personal data' },
    { category: 'Best Community Tool', amount: 3000, criteria: 'Most helpful to other learners' },
  ],
  comparison: {
    without: ['Standalone games', 'Demo projects', 'Practice exercises', '"Look what I made"'],
    with: ['Data-connected apps', 'Useful utilities', 'Production companions', '"Use this daily"'],
  },
  categories: [
    { id: 'personal', name: 'Personal Dashboards', description: 'Build something that shows YOUR data', example: '"My JKKN Day" - timetable + attendance + dues' },
    { id: 'community', name: 'Community Tools', description: 'Build something that helps OTHERS', example: 'Course Compass - reviews + difficulty ratings' },
    { id: 'department', name: 'Department Solutions', description: 'Solve a real department problem', example: 'Drug Flashcards (Pharmacy) from curriculum' },
    { id: 'innovation', name: 'Innovation Track', description: 'Surprise us with creative MCP use', example: "Something we haven't thought of!" },
  ],
  dataEndpoints: [
    { endpoint: '/academic/timetable', data: 'Class schedules', appIdea: 'Personal timetable widget' },
    { endpoint: '/academic/courses', data: 'Course catalog', appIdea: 'Course browser app' },
    { endpoint: '/students/grades', data: 'Your grades (with auth)', appIdea: 'Grade tracker with trends' },
    { endpoint: '/students/attendance', data: 'Your attendance', appIdea: 'Attendance alert app' },
    { endpoint: '/staff/directory', data: 'Faculty listing', appIdea: 'Faculty finder app' },
    { endpoint: '/notifications', data: 'Announcements', appIdea: 'Notification aggregator' },
    { endpoint: '/billing/dues', data: 'Fee status (with auth)', appIdea: 'Fee reminder app' },
    { endpoint: '/organizations', data: 'All 9 institutions', appIdea: 'Institution explorer' },
  ],
  securityRules: [
    { rule: 'Read-only access only', reason: 'You can DISPLAY data, not MODIFY it' },
    { rule: 'Your data stays yours', reason: 'You can only access YOUR grades, attendance, etc.' },
    { rule: 'No data storage', reason: 'Apps must not save MyJKKN data externally' },
    { rule: 'Rate-limited', reason: '100 requests/minute per user' },
    { rule: 'Logged', reason: 'All access is tracked for security' },
  ],
  howToStart: [
    { step: 1, action: 'Register for MyJKKN Track during team registration' },
    { step: 2, action: 'Receive MCP credentials (will be provided Dec 21)' },
    { step: 3, action: 'Go to GitHub repo and copy the context document', important: true },
    { step: 4, action: 'Paste context as FIRST prompt in Lovable before building' },
    { step: 5, action: 'Then tell Lovable your app idea' },
    { step: 6, action: 'Demo on Jan 3 with live MyJKKN connection' },
  ],
  contextUrl: 'https://github.com/JKKN-Institutions/MYJKKN-Context',
  contextNote: 'When Lovable knows MyJKKN\'s 19 modules, 53 database tables, and API structure upfront, it builds apps that actually work with real data — no guessing!',
} as const;

// ============================================
// COMPLETE TIMELINE
// ============================================

export const APPATHON_TIMELINE = {
  phase0: {
    name: 'Preparation',
    dates: 'Dec 11-20',
    activities: [
      { date: 'Dec 11-15', activity: 'Vibe Coding workshops across all institutions' },
      { date: 'Dec 16-20', activity: 'Practice on Lovable (FREE)' },
      { date: 'Dec 15', activity: 'Registration opens' },
      { date: 'Dec 20', activity: 'Registration closes, teams confirmed', important: true },
    ],
  },
  phase1: {
    name: 'BUILD PHASE',
    dates: 'Dec 21-30',
    icon: 'lightning',
    activities: [
      { date: 'Dec 21', activity: 'Build Phase Begins — Problem statements released', important: true },
      { date: 'Dec 21-30', activity: 'Teams build on Lovable (FREE ACCESS)' },
      { date: 'Dec 25', activity: 'Mid-point check-in (optional mentor review)' },
      { date: 'Dec 28', activity: 'Final 3 days — polish and test' },
      { date: 'Dec 30 (11:59 PM)', activity: 'BUILD DEADLINE — Submit app link', important: true },
    ],
  },
  phase2: {
    name: 'DEMO DAY',
    dates: 'Jan 3, 2026',
    icon: 'trophy',
    schedule: [
      { time: '9:00 AM', activity: 'Check-in & Tech Setup' },
      { time: '9:30 AM', activity: 'Inauguration' },
      { time: '10:00 AM - 1:00 PM', activity: 'Team Presentations (7 min each)' },
      { time: '1:00 PM - 2:00 PM', activity: 'Lunch Break' },
      { time: '2:00 PM - 4:00 PM', activity: 'Remaining Presentations' },
      { time: '4:00 PM - 5:00 PM', activity: "People's Choice Voting + Judging" },
      { time: '5:00 PM - 6:00 PM', activity: 'Results & Prize Distribution', important: true },
    ],
  },
} as const;

// ============================================
// ELIGIBILITY & RULES
// ============================================

export const ELIGIBILITY = {
  whoCanParticipate: [
    'All Learners from the 9 JKKN Institutions',
    'Senior Learners (Faculty) can participate as team members OR mentors',
    'Cross-institutional teams allowed and encouraged',
    'No prior coding experience required',
  ],
  teamComposition: {
    minSize: 2,
    maxSize: 4,
    crossDepartment: 'Bonus points for interdisciplinary teams',
    yearMix: 'Any combination allowed',
    seniorLearner: 'Can be team member OR mentor (choose one)',
  },
} as const;

export const BUILD_PHASE_RULES = {
  mustDo: [
    { rule: 'Use Lovable (https://lovable.dev)', note: 'MANDATORY platform' },
    { rule: 'Start fresh on Dec 21', note: 'No pre-built projects allowed' },
    { rule: 'Build within the theme', note: 'Choose from the 5 bioconvergence themes' },
    { rule: 'Submit by Dec 30, 11:59 PM', note: 'Late submissions not accepted' },
    { rule: 'Document your process', note: 'Keep screenshots/recordings of key milestones' },
  ],
  canDo: [
    'Work any hours during the 10 days',
    'Collaborate with teammates remotely or in-person',
    'Seek help from mentors (but they can\'t build for you)',
    'Talk to potential users and iterate based on feedback',
    'Use any AI tools within Lovable',
    'Start multiple projects and pick the best one',
  ],
  cannotDo: [
    'Use any project started before Dec 21',
    "Copy another team's work",
    'Have someone outside your team build for you',
    'Submit after the deadline',
  ],
  verification: [
    { date: 'Dec 21', action: 'All teams share their NEW Lovable project link (empty/new project)' },
    { date: 'Dec 25', action: 'Mid-point screenshot submission (optional but recommended)' },
    { date: 'Dec 30', action: 'Final submission with build history visible' },
    { date: 'Jan 3', action: 'Teams must explain their build process during demo' },
  ],
  note: 'Lovable tracks project history. We can verify when projects were created.',
} as const;

export const DEMO_DAY_RULES = {
  presentationFormat: [
    { element: 'Live Demo', duration: '4 minutes', details: 'Show your app working' },
    { element: 'Problem & Solution', duration: '2 minutes', details: 'Explain what you solved' },
    { element: 'Q&A', duration: '1 minute', details: 'Judges ask questions' },
    { element: 'Total', duration: '7 minutes', details: 'Hard stop' },
  ],
  whatToPrepare: [
    'Working app link (Lovable URL)',
    'Backup video (in case of internet issues)',
    'One-page summary (problem, solution, impact)',
    'User feedback (if you tested with real users — bonus points!)',
  ],
  rules: [
    'No building/coding on Demo Day (apps are frozen at Dec 30 deadline)',
    'Minor bug fixes allowed only with organizer approval',
    'All team members must be present',
    'Dress code: Smart casual (JKKN branded if available)',
  ],
} as const;

// ============================================
// PRIZES
// ============================================

export const PRIZE_STRUCTURE_DETAILED = {
  main: [
    { place: 'First Prize', amount: 15000, recognition: 'Featured in JKKN100' },
    { place: 'Second Prize', amount: 10000, recognition: 'NIF incubation priority' },
    { place: 'Third Prize', amount: 5000, recognition: 'Mentorship opportunity' },
  ],
  special: [
    { category: 'Best Healthcare Solution', amount: 5000, criteria: 'Healthcare + AI theme' },
    { category: 'Best Education Solution', amount: 5000, criteria: 'Education + AI theme' },
    { category: 'Best First-Year Team', amount: 3000, criteria: 'Team with first-year learners' },
    { category: 'Best Cross-Institutional Team', amount: 3000, criteria: 'Members from 2+ institutions' },
    { category: "People's Choice", amount: 3000, criteria: 'Audience voting on Demo Day' },
    { category: 'Best User Validation', amount: 3000, criteria: 'Most impressive user feedback' },
  ],
  myjkkn: [
    { category: 'Best MyJKKN App', amount: 5000, criteria: 'Most useful app using MyJKKN data' },
    { category: 'Best Personal Dashboard', amount: 3000, criteria: 'Best use of personal data (grades, timetable, etc.)' },
    { category: 'Best Community Tool', amount: 3000, criteria: 'Most helpful to other learners' },
  ],
  totalPool: 63000,
  forAllParticipants: [
    'Certificate of Participation',
    'LinkedIn recommendation from JKKN',
    'Portfolio addition with verified project link',
    'Opportunity to present at JKKN100 events',
  ],
} as const;

// ============================================
// BUILD PHASE TIPS
// ============================================

export const BUILD_PHASE_TIPS = {
  days1_2: {
    phase: 'Problem & Planning',
    tips: [
      'Define your problem clearly',
      'Sketch your solution on paper',
      'Identify your target users',
      'Create your Lovable project',
    ],
  },
  days3_5: {
    phase: 'Core Features',
    tips: [
      'Build the main functionality',
      "Don't worry about polish yet",
      'Get something working end-to-end',
    ],
  },
  days6_7: {
    phase: 'User Testing',
    tips: [
      'Show your app to 5+ potential users',
      'Collect feedback',
      'Document what they say (for bonus points!)',
    ],
  },
  days8_9: {
    phase: 'Iteration & Polish',
    tips: [
      'Fix issues based on feedback',
      'Improve UI/UX',
      'Add final touches',
    ],
  },
  day10: {
    phase: 'Final Prep',
    tips: [
      'Test everything one more time',
      'Record a backup demo video',
      'Submit before 11:59 PM!',
    ],
  },
} as const;

// ============================================
// RESOURCES
// ============================================

export const RESOURCES = {
  solutionStudio: {
    name: 'JKKN Solution Studio',
    url: 'https://flywheel-coach.vercel.app/',
    tagline: 'Find Problems Worth Solving',
    description: 'AI-powered coach for the Problem-to-Impact Flywheel methodology',
    note: 'Teams that go through Solution Studio before building win more often. It takes 30 minutes but saves days of building the wrong thing.',
  },
  lovable: {
    name: 'Lovable',
    loginUrl: 'https://lovable.dev/login',
    docsUrl: 'https://docs.lovable.dev',
    newFeatures: [
      { name: 'Voice Mode', description: 'Talk to Lovable instead of typing', usage: 'Click mic icon, describe what you want out loud' },
      { name: 'Chat Mode', description: 'Refine your idea before building', usage: 'Ask questions, clarify features, THEN hit build' },
      { name: 'File-to-App', description: 'Drop a spreadsheet, get a working app', usage: 'Drag Excel/CSV file → Lovable creates app from your data' },
      { name: 'AI Images', description: 'Generate images right inside your app', usage: 'In Design view, click "Generate" on any image' },
      { name: 'Themes', description: 'One-click professional styling', usage: 'Click theme button → instant polished look' },
      { name: 'Lovable Cloud', description: 'Database without setup headaches', usage: 'Auto-configured, no Supabase knowledge needed' },
    ],
    proTip: 'Use Chat Mode first to think through your app, then Voice Mode to describe features naturally. This gets 20% fewer errors than jumping straight to building!',
    postFreeNote: 'After Dec 31: Lovable offers 50% student discount — verify with your institution email.',
  },
  vibeCoding: {
    lessonPlan: 'https://docs.google.com/document/d/10l0KrXVbtZ8VdkXKBccnSmKDAEFf6YQW5H-rwlQSkMA/edit',
    slides: 'https://docs.google.com/presentation/d/10GAXhte27DH_Wo61AlYulu73oOia9uDoOZ5o-EUlgXA/edit',
    video: 'https://www.youtube.com/watch?v=TNkEpbmQ1EY',
  },
} as const;

// ============================================
// HALL OF FAME - APPATHON 1.0
// ============================================

export const HALL_OF_FAME = {
  event: {
    name: 'Appathon 1.0',
    date: 'October 2024',
    venue: 'Senthuraja Hall',
  },
  stats: {
    teamsInFinals: 17,
    departmentsRepresented: 6,
    workingAppsBuilt: 17,
    departments: ['EEE', 'ECE', 'CSE', 'IT', 'S&H', 'Dental'],
  },
  winner: {
    team: "Dr. Jagadheshan's Team",
    members: ['Dr. Jagadheshan', 'Roshini'],
    department: 'Dental',
    project: 'AI Golden Proportion Analyzer',
    impact: 'Revolutionary tool for dental aesthetics assessment',
  },
  whatMadeItSpecial: [
    'Non-coders from Dental built an AI-powered analyzer that won First Prize.',
    'First-year learners competed alongside final-year teams.',
    'Ideas mattered more than programming skills.',
  ],
  finalists: [
    { rank: 1, teamLead: "L. Shivaranjani", dept: 'EEE', project: 'EduConnect', theme: 'Education' },
    { rank: 2, teamLead: "B. Tamilarasan", dept: 'ECE', project: 'Mobility System for Disabilities', theme: 'Accessibility' },
    { rank: 3, teamLead: "Parkavi", dept: 'ECE', project: 'Health Data Security App', theme: 'Healthcare' },
    { rank: 4, teamLead: "Naveenkumar T", dept: 'CSE', project: 'Plant Disease Diagnostics', theme: 'Agriculture' },
    { rank: 5, teamLead: "Prabha K", dept: 'CSE', project: 'Alumni Association Platform', theme: 'Community' },
    { rank: 6, teamLead: "Vishnu Priya", dept: 'S&H', project: 'Bus Haven Scheduler', theme: 'Transportation' },
    { rank: 7, teamLead: "Anbarasan", dept: 'IT', project: 'Museum Guide Chatbot', theme: 'Tourism' },
    { rank: 8, teamLead: "Arunkumar", dept: 'IT', project: 'Study Notes Portal', theme: 'Education' },
    { rank: 9, teamLead: "Vaishnavi M", dept: 'IT', project: 'HeartTrack Monitoring', theme: 'Healthcare' },
    { rank: 10, teamLead: "K. Vaishnavi", dept: 'IT', project: 'Women Safety Analytics', theme: 'Safety' },
    { rank: 11, teamLead: "Muthu Pandy", dept: 'Dental', project: 'Exam Scheduler', theme: 'Education' },
    { rank: 12, teamLead: "S. Ranjani", dept: 'EEE', project: 'Vector-Borne Disease Detection', theme: 'Healthcare' },
    { rank: 13, teamLead: "Yogeshwaren", dept: 'ECE', project: 'Digital Audiometer', theme: 'Healthcare' },
    { rank: 14, teamLead: "Vignesh D", dept: '-', project: '[Project]', theme: '-' },
    { rank: 15, teamLead: "Dr. Jagadheshan", dept: 'Dental', project: 'AI Golden Proportion Analyzer', theme: 'Healthcare', isWinner: true },
    { rank: 16, teamLead: "Ambritha P", dept: 'Dental', project: 'Dental Fluorosis Assessment', theme: 'Healthcare' },
    { rank: 17, teamLead: "Preethi", dept: 'Dental', project: 'Aseptic Monitoring', theme: 'Healthcare' },
  ],
} as const;

// ============================================
// FAQ
// ============================================

export const APPATHON_FAQ = {
  registration: [
    {
      question: 'Can I participate alone?',
      answer: 'No. Minimum team size is 2 members. This ensures collaboration and diverse perspectives.',
    },
    {
      question: 'Can Senior Learners (Faculty) participate?',
      answer: "Yes! They can be team members OR mentors — but not both. If participating, they follow the same rules as learners.",
    },
    {
      question: 'Can I be in multiple teams?',
      answer: 'No. Each person can only be in one team.',
    },
    {
      question: 'My teammate is from a different JKKN institution. Is that allowed?',
      answer: 'Yes! Cross-institutional teams get +5 bonus points.',
    },
    {
      question: 'What if my team has members from different departments?',
      answer: "That's encouraged! Cross-disciplinary teams get +5 bonus points.",
    },
  ],
  buildPhase: [
    {
      question: 'Can I start building before Dec 21?',
      answer: 'You can PRACTICE on Lovable before Dec 21, but your competition project MUST be created fresh on Dec 21 or after. We verify creation dates.',
    },
    {
      question: 'What if Lovable is down during Build Phase?',
      answer: "We'll provide guidance. Keep screenshots of any issues. The deadline may be extended if there are platform-wide problems.",
    },
    {
      question: 'Can I use other AI tools besides Lovable?',
      answer: 'No. For this competition, you MUST use Lovable only. This ensures a level playing field.',
    },
    {
      question: "What if I realize my idea isn't working?",
      answer: "You have 10 days! Pivot early. It's better to change direction on Day 3 than struggle until Day 10.",
    },
    {
      question: 'Can mentors help me build?',
      answer: 'Mentors can guide and advise, but they CANNOT build for you. If a mentor is found building for a team, both may be disqualified.',
    },
  ],
  demoDay: [
    {
      question: "What if I can't attend Demo Day on Jan 3?",
      answer: 'All team members must be present. If you have a genuine emergency, contact organizers before Jan 1.',
    },
    {
      question: "What if my app doesn't work during the demo?",
      answer: "That's why we require a backup video! Upload a screen recording of your app working to YouTube/Drive before Demo Day.",
    },
    {
      question: 'Can I fix bugs on Demo Day?',
      answer: 'Only with organizer approval for critical issues. Major building/changes are not allowed.',
    },
    {
      question: 'How long is the presentation?',
      answer: '7 minutes total: 4 min demo + 2 min problem/solution explanation + 1 min Q&A.',
    },
  ],
  prizes: [
    {
      question: 'What if two teams have the same score?',
      answer: 'Judges will use user validation as the tiebreaker. Teams with real user feedback rank higher.',
    },
    {
      question: 'Can one team win multiple prizes?',
      answer: 'Yes! A team could win First Prize AND Best Healthcare Solution if they excel in both.',
    },
    {
      question: "Is there any recognition for participants who don't win?",
      answer: 'Yes! All participants get: Certificate of Participation, LinkedIn recommendation, Portfolio addition.',
    },
  ],
} as const;

// ============================================
// SOCIAL & MARKETING
// ============================================

export const SOCIAL_CONTENT = {
  hashtags: ['#Appathon2', '#JKKN100', '#VibeCoding', '#HumansAsPrincipals', '#BuildWithLovable', '#10DaysToBuild'],
  taglines: [
    'Build Apps. No Code. Just Ideas.',
    '10 Days. 1 App. Zero Coding Required.',
    'Dental Won Last Time. What About Your Department?',
    'Ideas Win. Not Code.',
    'Build Apps Without Writing Code.',
  ],
  keyMessages: {
    forLearners: 'You have 10 days to build something meaningful. Use it wisely — talk to users, iterate, and create something you\'re proud of.',
    forSeniorLearners: 'This is co-learning in action. Guide your teams, but let them discover. The best mentors ask questions, not give answers.',
    forLeadership: "Appathon 2.0 demonstrates JKKN's 'Humans as Principals, AI are Agents' philosophy at scale. 10 days of building + Demo Day = deeper learning.",
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getTotalPrizePoolDetailed(): number {
  const main = PRIZE_STRUCTURE_DETAILED.main.reduce((sum, p) => sum + p.amount, 0);
  const special = PRIZE_STRUCTURE_DETAILED.special.reduce((sum, p) => sum + p.amount, 0);
  const myjkkn = PRIZE_STRUCTURE_DETAILED.myjkkn.reduce((sum, p) => sum + p.amount, 0);
  return main + special + myjkkn;
}

export function getMyJKKNExtraPrizes(): number {
  return MYJKKN_TRACK.prizes.reduce((sum, p) => sum + p.amount, 0);
}

export function getDaysUntilBuildPhase(): number {
  const now = new Date();
  const buildStart = new Date(TWO_PHASE_FORMAT.buildPhase.startDate);
  const diff = buildStart.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getDaysUntilDemoDay(): number {
  const now = new Date();
  const demoDay = new Date(TWO_PHASE_FORMAT.demoDay.isoDate);
  const diff = demoDay.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isBuildPhaseActive(): boolean {
  const now = new Date();
  const start = new Date(TWO_PHASE_FORMAT.buildPhase.startDate);
  const end = new Date(TWO_PHASE_FORMAT.buildPhase.endDate);
  end.setHours(23, 59, 59);
  return now >= start && now <= end;
}

export function isLovableStillFree(): boolean {
  const now = new Date();
  const freeEnd = new Date(TWO_PHASE_FORMAT.lovableFreeEnd);
  freeEnd.setHours(23, 59, 59);
  return now <= freeEnd;
}
