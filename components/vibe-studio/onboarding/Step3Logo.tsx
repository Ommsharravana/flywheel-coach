'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';
import { Plus, Loader2 } from 'lucide-react';

export function Step3Logo() {
  const {
    logoPrompt,
    setLogoPrompt,
    logoUrl,
    setLogoUrl,
    nextStep,
    prevStep
  } = useOnboardingStore();

  const [isGenerating, setIsGenerating] = useState(false);

  const generateLogo = async () => {
    if (!logoPrompt.trim()) return;

    setIsGenerating(true);
    // TODO: Integrate with AI image generation (Gemini ImageGen)
    // For now, simulate with a delay
    setTimeout(() => {
      setLogoUrl(`https://placehold.co/200x200/1a1a1a/f97316?text=${encodeURIComponent(logoPrompt.split(' ')[0] || 'Logo')}`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <TerminalWindow>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            APP LOGO
          </h1>
          <p className="text-gray-400">
            Optional - generate one with AI
          </p>
        </div>

        {/* Logo preview area */}
        <div className="flex justify-center">
          <div
            className="w-48 h-48 vibe-dashed-box rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors"
            onClick={() => !logoUrl && generateLogo()}
          >
            {isGenerating ? (
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Generated logo"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <>
                <Plus className="w-8 h-8 text-gray-500 mb-2" />
                <span className="text-xs text-gray-500 font-mono tracking-wider">
                  GENERATE LOGO
                </span>
              </>
            )}
          </div>
        </div>

        {/* Logo prompt input */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 p-3 border border-[#333] rounded-lg focus-within:border-orange-500 transition-colors">
            <span className="text-orange-500 font-mono">&gt;</span>
            <input
              type="text"
              value={logoPrompt}
              onChange={(e) => setLogoPrompt(e.target.value)}
              placeholder="dog, butterfly, mountain, coffee cup..."
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none font-mono text-sm"
            />
          </div>
          <button
            onClick={generateLogo}
            disabled={!logoPrompt.trim() || isGenerating}
            className={`px-6 py-3 rounded-lg font-mono text-sm tracking-wider transition-all ${
              logoPrompt.trim() && !isGenerating
                ? 'border border-orange-500 text-orange-500 hover:bg-orange-500/10'
                : 'border border-[#333] text-gray-500 cursor-not-allowed'
            }`}
          >
            {isGenerating ? 'GENERATING...' : 'GENERATE'}
          </button>
        </div>

        {/* Continue Button */}
        <button
          onClick={nextStep}
          className="w-full py-4 rounded-lg font-bold text-lg tracking-wider vibe-btn-gradient text-black hover:shadow-lg transition-all"
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
          <span>STEP_03/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
