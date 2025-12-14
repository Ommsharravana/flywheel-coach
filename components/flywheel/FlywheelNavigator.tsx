'use client';

import { cn } from '@/lib/utils';
import { FLYWHEEL_STEPS, StepStatus, Cycle, getStepStatus, canAccessStep } from '@/lib/types/cycle';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface FlywheelNavigatorProps {
  cycle: Cycle;
  currentStep?: number;
  onStepClick?: (stepId: number) => void;
  compact?: boolean;
}

const statusColors: Record<StepStatus, { bg: string; border: string; text: string; glow: string }> = {
  'not-started': {
    bg: 'bg-stone-800/50',
    border: 'border-stone-700',
    text: 'text-stone-500',
    glow: '',
  },
  'in-progress': {
    bg: 'bg-amber-500/20',
    border: 'border-amber-500',
    text: 'text-amber-400',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
  },
  completed: {
    bg: 'bg-emerald-500/20',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    glow: '',
  },
  skipped: {
    bg: 'bg-stone-800/30',
    border: 'border-stone-600',
    text: 'text-stone-600',
    glow: '',
  },
};

export function FlywheelNavigator({ cycle, currentStep, onStepClick, compact = false }: FlywheelNavigatorProps) {
  const steps = FLYWHEEL_STEPS.map((step) => ({
    ...step,
    status: getStepStatus(cycle, step.id),
    accessible: canAccessStep(cycle, step.id),
  }));

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const colors = statusColors[step.status];
          const isActive = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.accessible && onStepClick?.(step.id)}
                disabled={!step.accessible}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                  colors.bg,
                  colors.border,
                  colors.text,
                  'border-2',
                  step.accessible ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50',
                  isActive && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-900'
                )}
                title={step.name}
              >
                {step.status === 'completed' ? '✓' : step.id}
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-4 h-0.5 mx-0.5',
                  step.status === 'completed' ? 'bg-emerald-500' : 'bg-stone-700'
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Circular Flywheel for larger screens */}
      <div className="hidden md:block relative w-[400px] h-[400px] mx-auto">
        {/* Center hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl z-10">
          <div className="text-center">
            <div className="text-2xl font-bold text-stone-900">
              {steps.filter((s) => s.status === 'completed').length}
            </div>
            <div className="text-xs text-stone-800 font-medium">of 8</div>
          </div>
        </div>

        {/* Steps around the wheel */}
        {steps.map((step, index) => {
          const angle = (index * 360) / 8 - 90; // Start from top
          const radius = 160;
          const x = Math.cos((angle * Math.PI) / 180) * radius;
          const y = Math.sin((angle * Math.PI) / 180) * radius;
          const colors = statusColors[step.status];
          const isActive = currentStep === step.id;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="absolute"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Link
                href={step.accessible ? `/cycle/${cycle.id}/step/${step.id}` : '#'}
                onClick={(e) => {
                  if (!step.accessible) {
                    e.preventDefault();
                    return;
                  }
                  onStepClick?.(step.id);
                }}
                className={cn(
                  'block w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300',
                  colors.bg,
                  colors.border,
                  colors.glow,
                  'border-2',
                  step.accessible ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-50',
                  isActive && 'ring-4 ring-amber-500/50 scale-110'
                )}
              >
                <span className="text-2xl">{step.icon}</span>
              </Link>
              <div className={cn(
                'absolute top-full mt-1 left-1/2 -translate-x-1/2 text-center whitespace-nowrap',
                colors.text
              )}>
                <div className="text-xs font-medium">{step.shortName}</div>
              </div>
            </motion.div>
          );
        })}

        {/* Connection lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
          {steps.map((step, index) => {
            const nextIndex = (index + 1) % 8;
            const angle1 = (index * 360) / 8 - 90;
            const angle2 = (nextIndex * 360) / 8 - 90;
            const radius = 160;
            const x1 = 200 + Math.cos((angle1 * Math.PI) / 180) * radius;
            const y1 = 200 + Math.sin((angle1 * Math.PI) / 180) * radius;
            const x2 = 200 + Math.cos((angle2 * Math.PI) / 180) * radius;
            const y2 = 200 + Math.sin((angle2 * Math.PI) / 180) * radius;

            return (
              <line
                key={`line-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={step.status === 'completed' ? '#10b981' : '#44403c'}
                strokeWidth="2"
                strokeDasharray={step.status === 'completed' ? '0' : '4'}
              />
            );
          })}
        </svg>
      </div>

      {/* Linear list for mobile */}
      <div className="md:hidden space-y-2">
        {steps.map((step, index) => {
          const colors = statusColors[step.status];
          const isActive = currentStep === step.id;

          return (
            <Link
              key={step.id}
              href={step.accessible ? `/cycle/${cycle.id}/step/${step.id}` : '#'}
              onClick={(e) => {
                if (!step.accessible) e.preventDefault();
              }}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl transition-all',
                colors.bg,
                colors.border,
                colors.glow,
                'border',
                step.accessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                isActive && 'ring-2 ring-amber-500'
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center text-2xl',
                colors.bg,
                colors.border,
                'border-2'
              )}>
                {step.status === 'completed' ? '✓' : step.icon}
              </div>
              <div className="flex-1">
                <div className={cn('font-medium', colors.text)}>{step.name}</div>
                <div className="text-sm text-stone-500">{step.description}</div>
              </div>
              {step.status === 'in-progress' && (
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Export a simpler progress bar version
export function FlywheelProgress({ cycle }: { cycle: Cycle }) {
  const completed = Math.max(0, cycle.currentStep - 1);
  const percentage = (completed / 8) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm text-stone-400 mb-2">
        <span>Progress</span>
        <span>{completed}/8 steps</span>
      </div>
      <div className="h-2 bg-stone-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
        />
      </div>
    </div>
  );
}
