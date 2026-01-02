'use client';

import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';

export function Step4AppName() {
  const { appName, setAppName, nextStep, prevStep } = useOnboardingStore();

  const canContinue = appName.trim().length > 0;

  return (
    <TerminalWindow>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            APP NAME
          </h1>
          <p className="text-gray-400">
            What should we call your app?
          </p>
        </div>

        {/* App name input */}
        <div className="flex items-center gap-2 p-4 border border-[#333] rounded-lg focus-within:border-orange-500 transition-colors">
          <span className="text-orange-500 font-mono">&gt;</span>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="Enter your app name..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none font-mono"
            autoFocus
          />
        </div>

        {/* Continue Button */}
        <button
          onClick={nextStep}
          disabled={!canContinue}
          className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all ${
            canContinue
              ? 'vibe-btn-gradient text-black hover:shadow-lg'
              : 'bg-[#333] text-gray-500 cursor-not-allowed'
          }`}
        >
          [CONTINUE]
        </button>

        {/* Back link */}
        <button
          onClick={prevStep}
          className="w-full py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
        >
          ← BACK
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>STEP_04/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
