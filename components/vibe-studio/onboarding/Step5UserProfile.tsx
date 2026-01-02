'use client';

import { useRouter } from 'next/navigation';
import { useOnboardingStore, Motivation, Experience, Tool, Challenge } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';

const MOTIVATIONS: { value: Motivation; label: string }[] = [
  { value: 'PERSONAL', label: 'PERSONAL' },
  { value: 'FUN', label: 'FUN' },
  { value: 'MONEY', label: 'MONEY' },
  { value: 'LEVELING_UP', label: 'LEVELING UP' },
];

const EXPERIENCES: { value: Experience; label: string }[] = [
  { value: 'NEVER', label: 'NEVER' },
  { value: 'NO_CODER', label: 'NO CODER' },
  { value: 'AI_TOOL_EXPLORER', label: 'AI TOOL EXPLORER' },
  { value: 'DEVELOPER', label: 'DEVELOPER' },
];

const TOOLS: { value: Tool; label: string }[] = [
  { value: 'CLAUDE_CODE', label: 'CLAUDE CODE' },
  { value: 'CURSOR', label: 'CURSOR' },
  { value: 'NO_CODE_TOOLS', label: 'NO CODE TOOLS' },
  { value: 'BOLT', label: 'BOLT' },
  { value: 'LOVABLE', label: 'LOVABLE' },
];

const CHALLENGES: { value: Challenge; label: string }[] = [
  { value: 'SETUP', label: 'SETUP' },
  { value: 'FIXING_BUGS', label: 'FIXING BUGS' },
  { value: 'SLOW_WORKFLOWS', label: 'SLOW WORKFLOWS' },
];

export function Step5UserProfile() {
  const router = useRouter();
  const {
    motivation,
    setMotivation,
    experience,
    setExperience,
    toolsUsed,
    toggleTool,
    codeAgentComfort,
    setCodeAgentComfort,
    biggestChallenge,
    setBiggestChallenge,
    prevStep,
  } = useOnboardingStore();

  const canContinue = motivation && experience && biggestChallenge;

  const handleCreateBlueprint = () => {
    // Navigate to the AI Chat Builder
    router.push('/vibe-studio/builder');
  };

  return (
    <TerminalWindow>
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            TELL US ABOUT YOU
          </h1>
          <p className="text-gray-400">
            Help us understand your vibe coding journey
          </p>
        </div>

        {/* Motivation */}
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider block mb-3">
            WHAT MOTIVATES YOU?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {MOTIVATIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMotivation(m.value)}
                className={`p-3 rounded-lg font-mono text-sm tracking-wider transition-all ${
                  motivation === m.value
                    ? 'border border-orange-500 bg-orange-500/10 text-white'
                    : 'border border-[#333] text-gray-400 hover:border-orange-500/50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider block mb-3">
            EXPERIENCE BUILDING APPS?
          </label>
          <div className="grid grid-cols-2 gap-2">
            {EXPERIENCES.map((e) => (
              <button
                key={e.value}
                onClick={() => setExperience(e.value)}
                className={`p-3 rounded-lg font-mono text-sm tracking-wider transition-all ${
                  experience === e.value
                    ? 'border border-orange-500 bg-orange-500/10 text-white'
                    : 'border border-[#333] text-gray-400 hover:border-orange-500/50'
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Used */}
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider block mb-3">
            WHICH TOOLS HAVE YOU USED? (SELECT ALL)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {TOOLS.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleTool(t.value)}
                className={`p-3 rounded-lg font-mono text-sm tracking-wider transition-all ${
                  toolsUsed.includes(t.value)
                    ? 'border border-orange-500 bg-orange-500/10 text-white'
                    : 'border border-[#333] text-gray-400 hover:border-orange-500/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Code Agent Comfort */}
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider block mb-3">
            HOW COMFORTABLE WITH CODE AGENTS? (0-10)
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500 font-mono">0</span>
            <input
              type="range"
              min="0"
              max="10"
              value={codeAgentComfort}
              onChange={(e) => setCodeAgentComfort(parseInt(e.target.value))}
              className="vibe-terminal-slider flex-1"
            />
            <span className="text-xs text-gray-500 font-mono">10</span>
            <span className="text-xl font-bold text-orange-500 w-8 text-right">
              {codeAgentComfort}
            </span>
          </div>
        </div>

        {/* Biggest Challenge */}
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider block mb-3">
            BIGGEST CHALLENGE FOR YOU?
          </label>
          <div className="space-y-2">
            {CHALLENGES.map((c) => (
              <button
                key={c.value}
                onClick={() => setBiggestChallenge(c.value)}
                className={`w-full p-3 rounded-lg font-mono text-sm tracking-wider transition-all ${
                  biggestChallenge === c.value
                    ? 'border border-orange-500 bg-orange-500/10 text-white'
                    : 'border border-[#333] text-gray-400 hover:border-orange-500/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create Blueprint Button */}
        <button
          onClick={handleCreateBlueprint}
          disabled={!canContinue}
          className={`w-full py-4 rounded-lg font-bold text-lg tracking-wider transition-all ${
            canContinue
              ? 'vibe-btn-gradient text-black hover:shadow-lg'
              : 'bg-[#333] text-gray-500 cursor-not-allowed'
          }`}
        >
          [CREATE BLUEPRINT]
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
          <span>STEP_05/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
