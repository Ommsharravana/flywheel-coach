// Central help content configuration
// All tooltip and help text lives here for easy updates

export const HELP_CONTENT = {
  // Scoring Criteria Help
  criteria: {
    problem_impact: {
      title: 'Problem Impact (20%)',
      description:
        'How significant is the problem being solved? Does it affect many people or cause substantial pain? Look for problems that matter to real users, not just theoretical issues.',
      tips: [
        'Does this problem affect 10+ people or just one specific case?',
        'How painful is this problem on a scale of 1-10?',
        'Would users actively seek a solution to this?',
      ],
    },
    solution_innovation: {
      title: 'Solution Innovation (20%)',
      description:
        'Is the approach creative and novel? Does the team use technology in an interesting way? Look for unique applications of AI, not just obvious solutions.',
      tips: [
        'Have you seen this exact solution before?',
        'Does the team use AI in a creative way?',
        'Is this more than just a basic form with a database?',
      ],
    },
    working_prototype: {
      title: 'Working Prototype (20%)',
      description:
        'Does the app actually work? Is it polished and functional? A simple app that works is better than a complex app that crashes. Test the app yourself if possible.',
      tips: [
        'Can you use the app without errors?',
        'Does it handle edge cases gracefully?',
        'Is the UI clear and easy to navigate?',
      ],
    },
    user_validation: {
      title: 'User Validation (15%)',
      description:
        'Did the team test with real users? What feedback did they receive? Look for evidence of user interviews, testimonials, or testing with target audience.',
      tips: [
        'Did they talk to 5+ potential users?',
        'Do they have screenshots or quotes from users?',
        'Did they incorporate user feedback into the app?',
      ],
    },
    presentation_quality: {
      title: 'Presentation Quality (5%)',
      description:
        'How clear is their communication? Can they explain the problem and solution effectively? Is the demo smooth and engaging?',
      tips: [
        'Can you understand the problem in 30 seconds?',
        'Is the demo smooth or full of technical issues?',
        'Do they speak confidently about their solution?',
      ],
    },
    bioconvergence_alignment: {
      title: 'Bioconvergence Alignment (5%)',
      description:
        "How well does this connect to JKKN's mission of interdisciplinary innovation? Look for solutions that bridge biology, technology, and human needs.",
      tips: [
        'Does this connect multiple disciplines (health + tech, education + biology)?',
        'Does it address human needs with technology?',
        'Is there potential for real-world impact?',
      ],
    },
  },

  // Bonus Criteria Help
  bonus: {
    cross_disciplinary: {
      title: 'Cross-disciplinary Team (+5%)',
      description:
        'Team has members from 2 or more departments (e.g., CS + Pharmacy, EEE + Allied Health). This shows interdisciplinary collaboration.',
      check: 'Verify team member departments from their submission or ask them directly.',
    },
    cross_institutional: {
      title: 'Cross-institutional Team (+5%)',
      description:
        'Team has members from 2 or more JKKN institutions (e.g., Engineering + Dental, Arts & Science + Nursing). This shows cross-campus collaboration.',
      check: 'Check if team members are from different colleges within JKKN.',
    },
    first_year: {
      title: 'First-year Participation (+3%)',
      description:
        'At least one team member is a first-year student. This encourages early involvement in app development.',
      check: 'Ask team members which year they are in.',
    },
    user_testimonials: {
      title: 'User Testimonials (+2%)',
      description:
        'Real users vouching for the app\'s value. Look for video testimonials, written feedback, or screenshots of users praising the solution.',
      check: 'Ask to see user testimonials - videos, quotes, or messages from actual users.',
    },
  },

  // Scoring Process Help
  scoring: {
    how_to_score: {
      title: 'How to Score',
      steps: [
        'Watch the demo presentation carefully',
        'Test the app yourself if possible (click the "View App" button)',
        'Rate each criterion from 1 (lowest) to 10 (highest) using the sliders',
        'Check applicable bonuses (verify with team if needed)',
        'Add strengths, improvements, and private notes',
        'Review the calculated score before submitting',
      ],
    },
    what_makes_good_score: {
      title: 'What Makes a Good Score?',
      points: [
        '**8-10**: Exceptional - This could win a prize. Clear problem, innovative solution, works perfectly.',
        '**6-7**: Strong - Solid app with minor issues. Good potential but needs polish.',
        '**4-5**: Decent - The idea is there but execution has significant gaps.',
        '**1-3**: Needs work - Major problems with concept or implementation.',
      ],
    },
  },

  // Demo Day Tips for Participants
  demo_day: {
    for_participants: {
      title: 'Demo Day Tips',
      tips: [
        '**Start with the problem**: Make judges feel the pain your users experience',
        '**Show, don\'t tell**: Demo the app live, not just slides',
        '**Highlight innovation**: What\'s unique about your approach?',
        '**Prepare for failure**: Have a backup video in case live demo fails',
        '**Practice timing**: You have limited time - rehearse to fit',
        '**User evidence**: Show testimonials or feedback from real users',
        '**Answer confidently**: Judges will ask questions - know your app well',
      ],
    },
    what_judges_look_for: {
      title: 'What Judges Look For',
      points: [
        'A real problem that real people have',
        'A working app (not just mockups or ideas)',
        'Evidence of user testing and feedback',
        'Creative use of AI or technology',
        'Clear, confident presentation',
        'Potential for real-world impact',
      ],
    },
  },

  // FAQ
  faq: {
    judge_questions: [
      {
        q: 'What if the team\'s app doesn\'t work during the demo?',
        a: 'Judge based on their backup video if they have one. If no backup, score "Working Prototype" lower but don\'t penalize other criteria if the idea is sound.',
      },
      {
        q: 'Can I give decimal scores like 7.5?',
        a: 'No, use whole numbers only (1-10). The system calculates weighted scores automatically.',
      },
      {
        q: 'What if I\'m unsure about a bonus criterion?',
        a: 'Ask the team directly during Q&A, or check their submission details. When in doubt, don\'t check the box.',
      },
      {
        q: 'How much weight should I give to the idea vs execution?',
        a: 'Both matter! Problem Impact covers the idea (20%), Working Prototype covers execution (20%). Balance is key.',
      },
      {
        q: 'Can I change my score after submitting?',
        a: 'No, scores are final once submitted. Review carefully before hitting submit.',
      },
    ],
    participant_questions: [
      {
        q: 'What if our app crashes during the demo?',
        a: 'Have a backup video ready! Judges can watch it if live demo fails. Practice your demo multiple times to reduce chances of crashes.',
      },
      {
        q: 'How long should our presentation be?',
        a: 'Aim for 3-5 minutes. Get to the point quickly - problem, solution, demo, impact.',
      },
      {
        q: 'Do we need user testimonials to win?',
        a: 'Not required, but they help! User validation is 15% of your score, and testimonials give you a +2% bonus.',
      },
      {
        q: 'Can we use slides or should it be live demo only?',
        a: 'Use both! Start with 1-2 slides to explain the problem, then demo the app live. Keep slides minimal.',
      },
    ],
  },
} as const;

// Helper type for accessing help content
export type HelpKey = keyof typeof HELP_CONTENT;
export type CriteriaKey = keyof typeof HELP_CONTENT.criteria;
export type BonusKey = keyof typeof HELP_CONTENT.bonus;
