'use client';

import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';

export function Step1AppIdea() {
  const { platform, setPlatform, appIdea, setAppIdea, nextStep } = useOnboardingStore();

  const canContinue = appIdea.trim().length > 0;

  return (
    <TerminalWindow>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            WHAT&apos;S YOUR APP IDEA?
          </h1>
          <p className="text-gray-400">
            Describe what you want to build
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setPlatform('WEB')}
            className={`px-6 py-2 rounded font-mono text-sm tracking-wider transition-all ${
              platform === 'WEB'
                ? 'bg-orange-500 text-black'
                : 'bg-transparent border border-[#333] text-gray-400 hover:border-orange-500'
            }`}
          >
            WEB
          </button>
          <button
            onClick={() => setPlatform('MOBILE')}
            className={`px-6 py-2 rounded font-mono text-sm tracking-wider transition-all ${
              platform === 'MOBILE'
                ? 'bg-orange-500 text-black'
                : 'bg-transparent border border-[#333] text-gray-400 hover:border-orange-500'
            }`}
          >
            MOBILE
          </button>
        </div>

        {/* App Idea Input */}
        <div className="relative">
          <div className="flex items-start gap-2 p-4 border border-[#333] rounded-lg focus-within:border-orange-500 transition-colors">
            <span className="text-orange-500 font-mono">&gt;</span>
            <textarea
              value={appIdea}
              onChange={(e) => setAppIdea(e.target.value)}
              placeholder="Describe your app idea in plain English..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 resize-none focus:outline-none min-h-[120px] font-mono"
              autoFocus
            />
          </div>
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

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>STEP_01/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
