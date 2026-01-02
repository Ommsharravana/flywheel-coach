'use client';

import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { ProgressBar } from '@/components/vibe-studio/ui/ProgressBar';
import { Step1AppIdea } from '@/components/vibe-studio/onboarding/Step1AppIdea';
import { Step2Features } from '@/components/vibe-studio/onboarding/Step2Features';
import { Step3Logo } from '@/components/vibe-studio/onboarding/Step3Logo';
import { Step4AppName } from '@/components/vibe-studio/onboarding/Step4AppName';
import { Step5UserProfile } from '@/components/vibe-studio/onboarding/Step5UserProfile';

const TOTAL_STEPS = 5;

export default function VibeStudioOnboarding() {
  const { currentStep } = useOnboardingStore();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1AppIdea />;
      case 2:
        return <Step2Features />;
      case 3:
        return <Step3Logo />;
      case 4:
        return <Step4AppName />;
      case 5:
        return <Step5UserProfile />;
      default:
        return <Step1AppIdea />;
    }
  };

  return (
    <div className="min-h-screen vibe-grid-background vibe-corner-brackets vibe-corner-brackets-bottom">
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Main content */}
        <div className="w-full max-w-2xl">
          {renderStep()}
        </div>

        {/* Progress bar at bottom */}
        <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      </div>
    </div>
  );
}
