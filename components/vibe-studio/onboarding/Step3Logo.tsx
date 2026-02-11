'use client';

import { useState } from 'react';
import { useOnboardingStore } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';
import { Plus, Loader2 } from 'lucide-react';

// Hash function to deterministically pick colors from prompt
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Generate SVG-based logo from prompt
function generateSVGLogo(prompt: string): string {
  const palettes = [
    ['#f59e0b', '#d97706'], // amber
    ['#3b82f6', '#1d4ed8'], // blue
    ['#10b981', '#059669'], // green
    ['#8b5cf6', '#6d28d9'], // purple
    ['#ec4899', '#db2777'], // pink
    ['#06b6d4', '#0891b2'], // cyan
    ['#f43f5e', '#e11d48'], // rose
    ['#14b8a6', '#0d9488'], // teal
  ];

  // Pick palette based on hash of prompt
  const hash = hashString(prompt);
  const palette = palettes[hash % palettes.length];

  // Extract monogram (first 1-2 letters)
  const words = prompt.trim().split(/\s+/);
  let monogram = '';
  if (words.length >= 2) {
    // Two words: take first letter of each
    monogram = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words[0]) {
    // One word: take first letter or first two letters
    monogram = words[0].length > 1
      ? words[0].substring(0, 2).toUpperCase()
      : words[0][0].toUpperCase();
  }

  // Create SVG with gradient background and monogram
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${palette[0]};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${palette[1]};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="40" fill="url(#grad)" />
      <text
        x="100"
        y="100"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="72"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
      >${monogram}</text>
    </svg>
  `.trim();

  // Convert to data URL
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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

    // Simulate delay for better UX feel
    setTimeout(() => {
      const logoDataUrl = generateSVGLogo(logoPrompt);
      setLogoUrl(logoDataUrl);
      setIsGenerating(false);
    }, 1000);
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
              <img // eslint-disable-line @next/next/no-img-element
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
