import { WalkthroughStep } from '@/components/shared/Walkthrough';

export const JUDGE_SCORING_WALKTHROUGH: WalkthroughStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Judge Scoring',
    description:
      "This quick guide will show you how to score submissions. It takes less than a minute, and you'll be scoring with confidence!",
    position: 'center',
  },
  {
    id: 'submission-info',
    title: 'Submission Details',
    description:
      'Start by reviewing the app name, problem statement, and links. Click "View App" to test it yourself, or "Watch Demo" to see it in action.',
    targetSelector: '[data-walkthrough="submission-info"]',
    position: 'bottom',
  },
  {
    id: 'criteria-section',
    title: 'Scoring Criteria',
    description:
      'Rate each criterion from 1 (lowest) to 10 (highest). Hover over the ? icons to see what each criterion means. Your scores are automatically weighted.',
    targetSelector: '[data-walkthrough="criteria-section"]',
    position: 'bottom',
  },
  {
    id: 'slider-usage',
    title: 'Using the Sliders',
    description:
      'Drag the sliders to score. The score updates in real-time. Don\'t overthink it - go with your gut feeling based on the demo!',
    targetSelector: '[data-walkthrough="first-criterion"]',
    position: 'right',
  },
  {
    id: 'bonus-section',
    title: 'Bonus Criteria',
    description:
      'Check the boxes for applicable bonuses. These add percentage points to the final score. Verify with the team if you\'re unsure.',
    targetSelector: '[data-walkthrough="bonus-section"]',
    position: 'bottom',
  },
  {
    id: 'notes-section',
    title: 'Add Your Feedback',
    description:
      'Write strengths and areas for improvement. This helps teams grow. "Additional Notes" is private - only you and admins can see it.',
    targetSelector: '[data-walkthrough="notes-section"]',
    position: 'top',
  },
  {
    id: 'submit',
    title: 'Review and Submit',
    description:
      'Check the calculated score. When ready, click "Submit Score". Your scores auto-save as drafts, so you can come back anytime.',
    targetSelector: '[data-walkthrough="submit-section"]',
    position: 'top',
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description:
      'Need help later? Click the help icon in the navigation or visit the Help page. Happy judging!',
    position: 'center',
  },
];
