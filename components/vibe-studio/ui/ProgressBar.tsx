'use client';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-gray-500 font-mono tracking-wider">
          PROGRESS
        </span>
      </div>
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`flex-1 h-2 rounded-sm vibe-progress-segment ${
              index < currentStep ? 'active' : 'inactive'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
