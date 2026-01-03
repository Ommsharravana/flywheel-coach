'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useWalkthroughStore } from '@/lib/stores/walkthrough';
import { cn } from '@/lib/utils';

export interface WalkthroughStep {
  id: string;
  title: string;
  description: string;
  // Target element selector (e.g., '[data-walkthrough="scoring-form"]')
  targetSelector?: string;
  // Position of the card relative to target
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  // Custom positioning (overrides position)
  customPosition?: { top?: string; bottom?: string; left?: string; right?: string };
}

interface WalkthroughProps {
  id: string;
  steps: WalkthroughStep[];
  onComplete?: () => void;
  autoStart?: boolean;
}

/**
 * Walkthrough Component
 *
 * Provides step-by-step guided tour with spotlight effect
 *
 * Usage:
 * ```tsx
 * <Walkthrough
 *   id="judge-scoring"
 *   steps={[
 *     {
 *       id: 'step-1',
 *       title: 'Welcome',
 *       description: 'This is how to score...',
 *       targetSelector: '[data-walkthrough="criteria"]'
 *     }
 *   ]}
 * />
 * ```
 *
 * Accessibility:
 * - Keyboard navigation (Arrow keys, Escape)
 * - Focus management
 * - ARIA labels
 */
export function Walkthrough({
  id,
  steps,
  onComplete,
  autoStart = true,
}: WalkthroughProps) {
  const {
    activeWalkthrough,
    currentStep,
    hasCompletedWalkthrough,
    startWalkthrough,
    nextStep,
    previousStep,
    completeWalkthrough,
    skipWalkthrough,
  } = useWalkthroughStore();

  const targetRef = useRef<HTMLElement | null>(null);
  const isActive = activeWalkthrough === id;
  const step = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  // Auto-start if user hasn't completed
  useEffect(() => {
    if (autoStart && !hasCompletedWalkthrough(id) && !activeWalkthrough) {
      startWalkthrough(id);
    }
  }, [autoStart, id, hasCompletedWalkthrough, startWalkthrough, activeWalkthrough]);

  // Update target element when step changes
  useEffect(() => {
    if (isActive && step?.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      targetRef.current = element;

      // Scroll target into view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isActive, step, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          if (!isLastStep) nextStep();
          else handleComplete();
          break;
        case 'ArrowLeft':
          if (!isFirstStep) previousStep();
          break;
        case 'Escape':
          handleSkip();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isFirstStep, isLastStep, nextStep, previousStep]);

  const handleComplete = () => {
    completeWalkthrough(id);
    onComplete?.();
  };

  const handleSkip = () => {
    skipWalkthrough(id);
  };

  if (!isActive || !step) return null;

  // Get target position for card placement
  const getCardPosition = () => {
    if (step.customPosition) return step.customPosition;

    const target = targetRef.current;
    if (!target || !step.targetSelector) {
      // Center if no target
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const rect = target.getBoundingClientRect();
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          top: `${rect.top - 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${rect.bottom + 20}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - 20}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + 20}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Overlay with spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Spotlight on target (if exists) */}
          {targetRef.current && step.targetSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed z-50 pointer-events-none border-2 border-amber-400 rounded-lg shadow-lg shadow-amber-400/50"
              style={{
                top: targetRef.current.getBoundingClientRect().top - 4,
                left: targetRef.current.getBoundingClientRect().left - 4,
                width: targetRef.current.getBoundingClientRect().width + 8,
                height: targetRef.current.getBoundingClientRect().height + 8,
              }}
            />
          )}

          {/* Walkthrough Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-[60]"
            style={getCardPosition()}
          >
            <Card className="glass-card border-amber-500/50 shadow-2xl max-w-md w-full mx-4">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-stone-100 text-lg">
                      {step.title}
                    </CardTitle>
                    <p className="text-xs text-stone-500 mt-1">
                      Step {currentStep + 1} of {steps.length}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-stone-500 hover:text-stone-300 -mt-1 -mr-1"
                    aria-label="Skip walkthrough"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-stone-300 leading-relaxed">
                  {step.description}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previousStep}
                    disabled={isFirstStep}
                    className={cn(
                      'text-stone-400',
                      isFirstStep && 'invisible'
                    )}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <div className="flex gap-1">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          i === currentStep
                            ? 'bg-amber-400'
                            : 'bg-stone-600'
                        )}
                      />
                    ))}
                  </div>

                  {isLastStep ? (
                    <Button
                      size="sm"
                      onClick={handleComplete}
                      className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                    >
                      Got it!
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={nextStep}
                      className="bg-amber-500 hover:bg-amber-600 text-stone-900"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>

                {/* Skip option */}
                <p className="text-xs text-center text-stone-500">
                  Press <kbd className="px-1 py-0.5 bg-stone-700 rounded text-stone-300">Esc</kbd> to skip
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
