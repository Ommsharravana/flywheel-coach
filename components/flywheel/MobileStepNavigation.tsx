'use client';

import { useSwipeable } from 'react-swipeable';
import { useRouter } from 'next/navigation';
import { Cycle, FLYWHEEL_STEPS, canAccessStep, getStepStatus } from '@/lib/types/cycle';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface MobileStepNavigationProps {
  cycle: Cycle;
  currentStep: number;
  children: ReactNode;
}

export function MobileStepNavigation({ cycle, currentStep, children }: MobileStepNavigationProps) {
  const router = useRouter();

  const canGoBack = currentStep > 1 && canAccessStep(cycle, currentStep - 1);
  const canGoForward = currentStep < 8 && canAccessStep(cycle, currentStep + 1);

  const goToPrevStep = () => {
    if (canGoBack) {
      router.push(`/cycle/${cycle.id}/step/${currentStep - 1}`);
    }
  };

  const goToNextStep = () => {
    if (canGoForward) {
      router.push(`/cycle/${cycle.id}/step/${currentStep + 1}`);
    }
  };

  const goToStep = (stepId: number) => {
    if (canAccessStep(cycle, stepId)) {
      router.push(`/cycle/${cycle.id}/step/${stepId}`);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextStep(),
    onSwipedRight: () => goToPrevStep(),
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    preventScrollOnSwipe: false,
  });

  const currentStepInfo = FLYWHEEL_STEPS[currentStep - 1];

  return (
    <div className="md:hidden">
      {/* Step indicator dots */}
      <div className="sticky top-0 z-20 bg-stone-900/95 backdrop-blur-sm border-b border-stone-800 pb-3 pt-2 px-4 -mx-4 mb-4">
        {/* Step name and arrows */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={goToPrevStep}
            disabled={!canGoBack}
            className={cn(
              'p-2 rounded-full transition-all',
              canGoBack
                ? 'text-amber-400 hover:bg-amber-500/20 active:scale-95'
                : 'text-stone-600 cursor-not-allowed'
            )}
            aria-label="Previous step"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="text-center flex-1">
            <div className="text-lg font-semibold text-stone-100 flex items-center justify-center gap-2">
              <span className="text-xl">{currentStepInfo?.icon}</span>
              <span>Step {currentStep}</span>
            </div>
            <div className="text-xs text-stone-400">{currentStepInfo?.name}</div>
          </div>

          <button
            onClick={goToNextStep}
            disabled={!canGoForward}
            className={cn(
              'p-2 rounded-full transition-all',
              canGoForward
                ? 'text-amber-400 hover:bg-amber-500/20 active:scale-95'
                : 'text-stone-600 cursor-not-allowed'
            )}
            aria-label="Next step"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {FLYWHEEL_STEPS.map((step) => {
            const status = getStepStatus(cycle, step.id);
            const isActive = step.id === currentStep;
            const isAccessible = canAccessStep(cycle, step.id);

            return (
              <button
                key={step.id}
                onClick={() => goToStep(step.id)}
                disabled={!isAccessible}
                className={cn(
                  'transition-all duration-200',
                  isActive
                    ? 'w-6 h-2 rounded-full bg-amber-500'
                    : status === 'completed'
                    ? 'w-2 h-2 rounded-full bg-emerald-500'
                    : isAccessible
                    ? 'w-2 h-2 rounded-full bg-stone-600 hover:bg-stone-500'
                    : 'w-2 h-2 rounded-full bg-stone-700 cursor-not-allowed'
                )}
                aria-label={`Go to step ${step.id}: ${step.name}`}
              />
            );
          })}
        </div>

        {/* Swipe hint */}
        <div className="text-center text-xs text-stone-500 mt-2">
          Swipe left/right to navigate
        </div>
      </div>

      {/* Swipeable content area */}
      <div {...swipeHandlers} className="touch-pan-y">
        {children}
      </div>

      {/* Bottom navigation bar - fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 backdrop-blur-sm border-t border-stone-800 p-3 md:hidden">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <button
            onClick={goToPrevStep}
            disabled={!canGoBack}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              canGoBack
                ? 'text-stone-200 bg-stone-800 hover:bg-stone-700 active:scale-95'
                : 'text-stone-600 bg-stone-800/50 cursor-not-allowed'
            )}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden xs:inline">Previous</span>
          </button>

          <div className="flex items-center gap-1.5">
            {FLYWHEEL_STEPS.map((step) => {
              const status = getStepStatus(cycle, step.id);
              const isActive = step.id === currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'rounded-full transition-all',
                    isActive
                      ? 'w-3 h-3 bg-amber-500'
                      : status === 'completed'
                      ? 'w-2 h-2 bg-emerald-500'
                      : 'w-2 h-2 bg-stone-600'
                  )}
                />
              );
            })}
          </div>

          <button
            onClick={goToNextStep}
            disabled={!canGoForward}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              canGoForward
                ? 'text-stone-900 bg-amber-500 hover:bg-amber-400 active:scale-95'
                : 'text-stone-600 bg-stone-800/50 cursor-not-allowed'
            )}
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Spacer for fixed bottom bar */}
      <div className="h-20" />
    </div>
  );
}
