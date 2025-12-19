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

export interface ProblemTemplate {
  statement: string; // Full template with [PLACEHOLDERS]
  placeholders: {
    key: string;      // e.g., "WHO"
    hint: string;     // Guidance text
    example: string;  // Pre-filled example
  }[];
}

export interface ProblemIdea {
  problem: string;
  target: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  lovablePrompt?: string;
  template: ProblemTemplate;
}

export const PROBLEM_IDEAS: Record<AppathonThemeId, ProblemIdea[]> = {
  healthcare: [
    {
      problem: 'Drug interaction checker',
      target: 'Pharmacy learners',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Pharmacy learners during clinical postings' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'checking drug interactions quickly' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they cannot memorize 10,000+ drug combinations' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'delayed patient care and reduced confidence' },
        ],
      },
    },
    {
      problem: 'Patient appointment scheduler',
      target: 'Hospital staff',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Hospital reception staff' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'managing patient appointments efficiently' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'the current system is paper-based and hard to search' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'double-bookings and long patient wait times' },
        ],
      },
    },
    {
      problem: 'Mental health check-in tracker',
      target: 'College learners',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'College learners aged 18-22' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking their mental health consistently' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'there is stigma around seeking help and no private way to monitor themselves' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'stress builds up unnoticed until it affects academic performance' },
        ],
      },
    },
    {
      problem: 'Diet planner for diabetics',
      target: 'Patients',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Diabetic patients managing their condition at home' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'planning meals that keep blood sugar stable' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'nutritional information is confusing and generic diet charts do not fit local foods' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'blood sugar spikes and poor disease management' },
        ],
      },
    },
    {
      problem: 'First aid guide (searchable)',
      target: 'General public',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Parents and household members' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding correct first aid steps during emergencies' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they panic and cannot remember the training they received' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'incorrect treatment or dangerous delays' },
        ],
      },
    },
    {
      problem: 'Lab report explainer',
      target: 'Patients',
      difficulty: 'Hard',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Patients receiving blood test results' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'understanding what their lab values mean' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'reports use medical jargon and reference ranges without explanation' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'unnecessary anxiety or ignoring important warning signs' },
        ],
      },
    },
    {
      problem: 'Medication reminder app',
      target: 'Elderly patients',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Elderly patients taking 3+ medications daily' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'remembering to take the right medicine at the right time' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'complex schedules and memory decline with age' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missed doses or accidental double-dosing' },
        ],
      },
    },
    {
      problem: 'Symptom checker chatbot',
      target: 'General public',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'People experiencing health symptoms at home' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'deciding whether to visit a doctor or wait' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they cannot assess severity and online searches cause panic' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'either unnecessary ER visits or dangerously ignoring serious symptoms' },
        ],
      },
    },
  ],
  education: [
    {
      problem: 'Flashcard generator from notes',
      target: 'Learners',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'College learners preparing for exams' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'creating effective study flashcards from their notes' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'manually making flashcards is time-consuming and boring' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'they skip this effective study method entirely' },
        ],
      },
    },
    {
      problem: 'Study schedule optimizer',
      target: 'Learners',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners with multiple subjects and activities' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'allocating study time effectively across subjects' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they do not know how to prioritize based on exam dates and difficulty' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'last-minute cramming and uneven preparation' },
        ],
      },
    },
    {
      problem: 'Assignment deadline tracker',
      target: 'Learners',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners juggling 5-6 courses simultaneously' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'keeping track of all assignment deadlines' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'deadlines are announced on different platforms and easy to miss' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'late submissions and lost marks' },
        ],
      },
    },
    {
      problem: 'Quiz generator from textbook',
      target: 'Senior Learners',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Senior Learners creating assessments for their classes' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'creating varied quiz questions from textbook content' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'writing original questions for every chapter takes hours' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'repetitive questions year after year or fewer practice tests' },
        ],
      },
    },
    {
      problem: 'Personalized learning path',
      target: 'Learners',
      difficulty: 'Hard',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners with different skill levels in the same class' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding the right learning resources for their level' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'one-size-fits-all curriculum does not adapt to individual gaps' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'weak foundations that compound into bigger problems' },
        ],
      },
    },
    {
      problem: 'Doubt clarification bot',
      target: 'Learners',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners studying late at night or on weekends' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'getting quick answers to academic doubts' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'faculty are not available outside office hours' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'stuck on problems for hours or giving up' },
        ],
      },
    },
    {
      problem: 'Study group finder',
      target: 'College learners',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners who study better in groups' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding peers studying the same subject at the same level' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'there is no platform to discover and join study groups' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'isolated studying and missing peer learning benefits' },
        ],
      },
    },
    {
      problem: 'Exam preparation tracker',
      target: 'Competitive exam aspirants',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'GATE/NEET/JEE aspirants preparing over 6-12 months' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking progress across the vast syllabus' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'no way to visualize which topics are strong vs weak' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'wasted time on already-learned topics while weak areas remain' },
        ],
      },
    },
  ],
  agriculture: [
    {
      problem: 'Crop disease identifier (photo-based)',
      target: 'Farmers',
      difficulty: 'Hard',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Small-scale farmers in rural areas' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'identifying crop diseases early enough to treat them' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'agricultural experts are far away and symptoms look similar' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'entire harvests lost to preventable diseases' },
        ],
      },
    },
    {
      problem: 'Weather-based planting advisor',
      target: 'Farmers',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Farmers planning their next crop cycle' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'deciding the right time to plant based on weather' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'weather forecasts are generic and do not give farming-specific advice' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'seeds wasted when unexpected rain or drought hits' },
        ],
      },
    },
    {
      problem: 'Market price tracker',
      target: 'Farmers',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Farmers ready to sell their harvest' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing the current market prices before going to the mandi' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'prices change daily and middlemen exploit information gaps' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'selling at lower prices than what the market actually offers' },
        ],
      },
    },
    {
      problem: 'Irrigation scheduler',
      target: 'Farmers',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Farmers with limited water resources' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing when and how much to irrigate' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they rely on guesswork instead of soil moisture data' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'either water waste or under-watered crops' },
        ],
      },
    },
    {
      problem: 'Fertilizer calculator',
      target: 'Farmers',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Farmers buying fertilizers for their fields' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'calculating the right amount and type of fertilizer' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'recommendations on bags are generic and do not consider soil conditions' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'over-fertilization wasting money or under-fertilization hurting yield' },
        ],
      },
    },
    {
      problem: 'Pest alert system',
      target: 'Farmers',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Farmers in pest-prone regions' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'getting early warning about pest outbreaks in their area' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'information spreads slowly through word of mouth' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'pests spread to their fields before they can take preventive action' },
        ],
      },
    },
    {
      problem: 'Livestock health tracker',
      target: 'Dairy farmers',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Dairy farmers with 5-20 cattle' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking vaccination schedules and health records for each animal' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'paper records get lost and it is hard to remember dates for each animal' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missed vaccinations leading to disease outbreaks' },
        ],
      },
    },
    {
      problem: 'Seasonal crop planner',
      target: 'Small farmers',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'First-generation farmers or those trying new crops' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing which crops to plant in which season' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'traditional knowledge is being lost and climate is changing' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'wrong crop choices leading to poor harvests' },
        ],
      },
    },
  ],
  environment: [
    {
      problem: 'Waste segregation guide',
      target: 'Households',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Urban households trying to segregate waste' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing which bin to put different items in' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'categories overlap and rules vary by municipality' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'recyclables end up in landfills' },
        ],
      },
    },
    {
      problem: 'Carbon footprint calculator',
      target: 'Individuals',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Environmentally conscious individuals' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'understanding their personal carbon footprint' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'existing calculators are complex and not localized to India' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'no motivation to change because they cannot see their impact' },
        ],
      },
    },
    {
      problem: 'Water usage tracker',
      target: 'Households',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Families in water-scarce regions' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking how much water they use daily' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'there is no easy way to measure individual activities' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'unknowing water waste while tanks run dry' },
        ],
      },
    },
    {
      problem: 'Recycling locator',
      target: 'Community',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'People with e-waste or special recyclables' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding where to recycle specific items' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'recycling centers are not well advertised' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'items end up in regular trash instead of being recycled' },
        ],
      },
    },
    {
      problem: 'Energy saving tips',
      target: 'Households',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Families with high electricity bills' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'reducing their energy consumption' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they do not know which appliances waste the most' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'high bills and unnecessary environmental impact' },
        ],
      },
    },
    {
      problem: 'Tree planting tracker',
      target: 'Community',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Environmental groups organizing tree drives' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking survival rates of planted trees' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'no system to monitor trees after planting events' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'many trees die unnoticed in the first year' },
        ],
      },
    },
    {
      problem: 'Air quality monitor',
      target: 'Urban residents',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Urban residents with respiratory conditions' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing when air quality is bad in their specific area' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'official monitors are far away and data is city-wide' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'outdoor activities during unhealthy conditions' },
        ],
      },
    },
    {
      problem: 'Sustainable product finder',
      target: 'Conscious consumers',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Shoppers who want to buy eco-friendly products' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding truly sustainable alternatives' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'greenwashing makes it hard to identify genuine products' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'giving up and buying conventional products' },
        ],
      },
    },
  ],
  community: [
    {
      problem: 'Local event finder',
      target: 'Community',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Residents looking for weekend activities' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'discovering local events and gatherings' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'events are promoted on scattered WhatsApp groups and posters' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missing interesting events they would have attended' },
        ],
      },
    },
    {
      problem: 'Lost & found portal',
      target: 'Campus',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Campus learners and staff' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'recovering lost items on campus' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'there is no central system to report and claim lost items' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'valuable items never reunited with owners' },
        ],
      },
    },
    {
      problem: 'Carpool matcher',
      target: 'Commuters',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners and staff commuting from nearby towns' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding others traveling the same route' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'no platform to discover and coordinate rides' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'each person driving alone wasting fuel and money' },
        ],
      },
    },
    {
      problem: 'Skill sharing platform',
      target: 'Community',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'People who want to learn new skills informally' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'connecting with others who can teach or learn' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'no way to discover hidden talents in their community' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'paying for classes when free peer learning is possible' },
        ],
      },
    },
    {
      problem: 'Blood donor connector',
      target: 'Hospitals',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Families urgently needing blood for patients' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding matching blood donors quickly' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'donor databases are outdated and calling takes time' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'delays in surgery while scrambling for donors' },
        ],
      },
    },
    {
      problem: 'Senior citizen assistance',
      target: 'Elderly',
      difficulty: 'Medium',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Elderly people living alone' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'getting help with daily tasks like medicine pickup' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they hesitate to ask neighbors and family is far away' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'isolation and missed medications' },
        ],
      },
    },
    {
      problem: 'Volunteer opportunity finder',
      target: 'College learners',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'College learners wanting to contribute to society' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding meaningful volunteer opportunities' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'NGOs advertise through word-of-mouth only' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'willing volunteers never connecting with organizations' },
        ],
      },
    },
    {
      problem: 'Local business directory',
      target: 'Neighborhood',
      difficulty: 'Easy',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Residents new to the neighborhood' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding trusted local shops and services' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'small businesses are not on Google Maps' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'supporting big chains instead of local businesses' },
        ],
      },
    },
  ],
  myjkkn: [
    {
      problem: 'My Day - Today\'s classes + countdown',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me my today\'s classes and tell me how many minutes until my next class',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'JKKN learners with packed schedules' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'knowing what class is next and when to leave' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'checking the timetable PDF each time is cumbersome' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'arriving late to classes or wrong rooms' },
        ],
      },
    },
    {
      problem: 'Grade Tracker - Marks and GPA prediction',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show my grades for each subject and calculate what GPA I\'ll get if I keep this up',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners aiming for specific GPA targets' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'predicting their final GPA from current marks' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'MyJKKN shows raw marks but not projected GPA' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'not knowing how much harder to study in remaining exams' },
        ],
      },
    },
    {
      problem: 'Attendance Alert - Warns below 75%',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Alert me if my attendance is getting low and tell me which classes I\'m missing',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners who sometimes skip classes' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'realizing their attendance has dropped too low' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'they only check attendance occasionally and math is tricky' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'suddenly blocked from exams due to shortage' },
        ],
      },
    },
    {
      problem: 'Fee Reminder - Payment status',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me my fee status - what I\'ve paid and what I still owe',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners managing their own fee payments' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'tracking pending fees and payment deadlines' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'fee structure is complex with multiple components' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'late fees or blocked hall tickets' },
        ],
      },
    },
    {
      problem: 'Faculty Finder - Search by name/department',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Help me find a faculty member and show their cabin location',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'First-year learners navigating campus' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding where a specific faculty sits' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'campus is large and there is no searchable directory' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'wasting time wandering or missing meeting slots' },
        ],
      },
    },
    {
      problem: 'All My Updates - Notifications aggregator',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Show me all announcements and notifications from my college',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners who miss important announcements' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'staying updated on college notices' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'announcements come through multiple channels' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missing deadlines or important events' },
        ],
      },
    },
    {
      problem: 'Campus Explorer - All 9 institutions',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Let me explore all JKKN colleges and see what programs they offer',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners curious about other JKKN institutions' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'learning what other colleges in JKKN offer' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'information is scattered across different websites' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missing cross-campus opportunities and events' },
        ],
      },
    },
    {
      problem: 'Course Browser - Find electives',
      target: 'Learners',
      difficulty: 'Easy',
      lovablePrompt: 'Help me browse available courses and see which ones fit my schedule',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners choosing elective subjects' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'finding electives that fit their schedule and interests' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'course catalog is a static PDF with no filtering' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'choosing wrong electives and regretting later' },
        ],
      },
    },
    {
      problem: 'My JKKN Dashboard - Everything in one screen',
      target: 'Learners',
      difficulty: 'Medium',
      lovablePrompt: 'Create a dashboard showing my classes, grades, attendance, and dues together',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Busy learners juggling multiple responsibilities' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'getting a quick overview of their academic status' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'must navigate 4-5 different pages in MyJKKN' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'missing issues until they become urgent' },
        ],
      },
    },
    {
      problem: 'Study Planner - Based on exam dates',
      target: 'Learners',
      difficulty: 'Medium',
      lovablePrompt: 'Look at my exam schedule and create a study plan for me',
      template: {
        statement: '[WHO] struggles with [PROBLEM] because [CAUSE], which leads to [IMPACT].',
        placeholders: [
          { key: 'WHO', hint: 'Your target users', example: 'Learners preparing for semester exams' },
          { key: 'PROBLEM', hint: 'The specific challenge', example: 'creating a balanced study schedule' },
          { key: 'CAUSE', hint: 'Root cause of the problem', example: 'exam dates are known but planning is left to the learner' },
          { key: 'IMPACT', hint: 'Negative consequence', example: 'over-preparing for easy subjects while neglecting hard ones' },
        ],
      },
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
