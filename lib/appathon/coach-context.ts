// Appathon 2.0 - AI Coach Context Enhancement
// Can be deleted after January 2026

import { getCurrentBuildDay, getCurrentPhase, getDaysRemaining } from './roadmap';

// Full Appathon context to inject into the AI Coach system prompt
export const APPATHON_COACH_CONTEXT = `
=== APPATHON 2.0 CONTEXT ===

You are now coaching a participant in APPATHON 2.0, JKKN's app-building competition where learners build real apps using Lovable (no coding required).

KEY DATES:
- Build Phase: December 21-30, 2025 (10 days)
- Submission Deadline: December 30, 11:59 PM
- Demo Day: January 3, 2026
- Lovable is FREE until December 31st

JUDGING CRITERIA (mention these when relevant):
1. Problem Impact (25%) - How significant is the problem? Does it affect many people?
2. Solution Innovation (20%) - Is the approach creative? Does AI enhance it?
3. Working Prototype (25%) - Does it actually work? Is it polished? Test on mobile!
4. User Validation (15%) - Did they test with 5+ real users? Documented feedback?
5. Presentation Quality (10%) - Clear demo, good communication
6. Bioconvergence Alignment (5%) - Connection to JKKN's mission of convergence

BONUS POINTS THEY CAN EARN:
- Cross-disciplinary team: +5% (members from 2+ departments)
- Cross-institutional team: +5% (members from 2+ JKKN institutions)
- First-year participation: +3% (at least one first-year member)
- User testimonials: +2% (real users vouching for the app)

SPECIAL TRACK: MyJKKN Data Integration
Teams can build apps using real MyJKKN data (grades, timetables, attendance).
Extra prizes available: Best MyJKKN App (5,000), Best Personal Dashboard (3,000), Best Community Tool (3,000)
For MyJKKN apps, they should paste the GitHub context document as their FIRST prompt in Lovable.

YOUR COACHING APPROACH FOR APPATHON PARTICIPANTS:

1. HELP THEM PICK A WINNING PROBLEM
   - Focus on Problem Impact (25%) - suggest problems that affect many people
   - Encourage them to think about user desperation, not just interest
   - Remind them: "A simple problem done well beats a complex one done poorly"

2. ENCOURAGE USER VALIDATION
   - This is worth 15% + potential bonus points for testimonials
   - Push them to talk to 5+ potential users before and during building
   - Suggest they document exact user quotes

3. KEEP THEM FOCUSED ON A WORKING PROTOTYPE
   - Working Prototype is 25% - the biggest single criterion
   - Discourage feature creep: "Will this help you win?"
   - Remind them to test on mobile (judges often use phones)

4. GUIDE THEIR TIMELINE
   - Days 1-2: Problem definition & planning
   - Days 3-5: Core features (focus on ONE flow)
   - Days 6-7: User testing (talk to 5+ users)
   - Days 8-9: Polish based on feedback
   - Day 10: Final prep & submission (backup video required!)

5. IF THEY SEEM STUCK
   - Suggest simpler versions of their idea
   - Encourage pivots if needed (it's better to pivot early)
   - Remind them that the 5 themes have sample problems to inspire them

THEMES THEY CAN CHOOSE:
- Healthcare + AI
- Education + AI
- Agriculture + AI
- Environment + AI
- Community + AI
- MyJKKN Data Apps (uses real JKKN data - has extra prizes!)

TOTAL PRIZE POOL: Over 63,000 with prizes for:
- Main categories (1st: 15,000, 2nd: 10,000, 3rd: 5,000)
- Theme-specific awards
- MyJKKN integration awards
- Team composition bonuses

Remember: You're helping them build something that could win. Be encouraging but practical.
`;

// Get step-specific Appathon guidance
export function getAppathonStepGuidance(step: number): string {
  const currentDay = getCurrentBuildDay();
  const daysRemaining = getDaysRemaining();
  const currentPhase = getCurrentPhase();

  let timeContext = '';
  if (currentDay > 0 && currentDay <= 10) {
    timeContext = `\n\nTIME CHECK: Day ${currentDay} of 10. ${daysRemaining} days remaining until submission.`;
    if (currentPhase) {
      timeContext += ` Current focus should be: ${currentPhase.title}.`;
    }
  }

  switch (step) {
    case 1: // Problem Discovery
      return `
APPATHON STEP 1 TIPS:
- For Appathon, pick problems from the 5 bioconvergence themes or build a MyJKKN Data App
- Problem Impact is worth 25% of the score - choose wisely!
- The MyJKKN track has extra 11,000 in prizes
- Consider: Who has this problem? How desperate are they?
- Suggest browsing the problem ideas panel for inspiration${timeContext}`;

    case 2: // Context Discovery
      return `
APPATHON STEP 2 TIPS:
- Talk to at least 2 potential users BEFORE building
- Document their exact words - you'll need this for User Validation (15%)
- Ask: "On a scale of 1-10, how painful is this problem?"
- Cross-disciplinary insights can earn +5% bonus!${timeContext}`;

    case 3: // Value Discovery
      return `
APPATHON STEP 3 TIPS:
- User Validation is worth 15% of the judging score
- Start talking to users NOW, not after building
- Testimonials from real users give +2% bonus points
- Document feedback carefully - judges will ask about it${timeContext}`;

    case 4: // Workflow Classification
      return `
APPATHON STEP 4 TIPS:
- Choose the simplest workflow that solves the problem
- For Appathon, simpler is often better - you have 10 days
- Complex workflows = more chances for bugs
- Working Prototype (25%) beats ambitious but broken${timeContext}`;

    case 5: // Prompt Generation
      return `
APPATHON STEP 5 TIPS:
- These prompts are for Lovable - AI will build your app!
- For MyJKKN apps, paste the context document FIRST
- Start simple, then iterate
- Test each feature before adding the next${timeContext}`;

    case 6: // Build
      return `
APPATHON BUILD PHASE TIPS:
- Working Prototype is 25% of your score - make it work!
- Focus on ONE core flow that works perfectly
- Test on mobile (many judges use phones)
- Keep a bug list but don't fix everything - prioritize

10-DAY ROADMAP:
- Days 1-2: Problem & Planning
- Days 3-5: Core Features (you should be here!)
- Days 6-7: User Testing
- Days 8-9: Polish
- Day 10: Final prep (backup video!)${timeContext}`;

    case 7: // Deployment
      return `
APPATHON DEPLOYMENT TIPS:
- Make sure your app is publicly accessible
- Test the public URL on a different device
- Share with 5+ users for validation
- Record a 2-minute backup video (REQUIRED for Demo Day)${timeContext}`;

    case 8: // Impact Discovery
      return `
APPATHON IMPACT TIPS:
- Collect metrics: How many users tried it? What did they say?
- User testimonials earn +2% bonus points
- Document before/after: How much time/effort does it save?
- Prepare for Demo Day: What's your 7-minute pitch?${timeContext}`;

    default:
      return timeContext;
  }
}

// Generate dynamic tips based on current situation
export function getContextualAppathonTips(): string[] {
  const currentDay = getCurrentBuildDay();
  const daysRemaining = getDaysRemaining();
  const tips: string[] = [];

  if (currentDay === 0) {
    tips.push('Build phase starts December 21st. Use this time to talk to users!');
    tips.push('Form your team and register by December 20th.');
  } else if (currentDay <= 2) {
    tips.push("You're in the planning phase. Don't skip this!");
    tips.push('Talk to at least 2 potential users before coding.');
  } else if (currentDay <= 5) {
    tips.push('Focus on your ONE core feature. Get it working end-to-end.');
    tips.push("Don't add features yet - make the main thing work first.");
  } else if (currentDay <= 7) {
    tips.push('Time to test with real users! Talk to at least 5.');
    tips.push('Document their feedback - you need this for judging.');
  } else if (currentDay <= 9) {
    tips.push('Polish time! Fix the top issues users mentioned.');
    tips.push('Test on mobile - many judges use phones.');
  } else if (currentDay === 10) {
    tips.push('Submission day! Record your backup video.');
    tips.push('Submit before 11:59 PM. Early is better than risky.');
  }

  if (daysRemaining > 0 && daysRemaining <= 3) {
    tips.push(`Only ${daysRemaining} days left! Focus on what's essential.`);
  }

  return tips;
}
