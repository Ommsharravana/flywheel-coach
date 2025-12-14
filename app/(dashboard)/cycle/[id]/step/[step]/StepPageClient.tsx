'use client';

import { useState } from 'react';
import { Cycle } from '@/lib/types/cycle';
import { AICoachChat, AICoachButton } from '@/components/coach/AICoachChat';

interface StepPageClientProps {
  cycle: Cycle;
  currentStep: number;
}

export function StepPageClient({ cycle, currentStep }: StepPageClientProps) {
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  return (
    <>
      <AICoachButton
        onClick={() => setIsCoachOpen(!isCoachOpen)}
        isOpen={isCoachOpen}
      />
      <AICoachChat
        cycle={cycle}
        currentStep={currentStep}
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </>
  );
}
