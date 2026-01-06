'use client';

import { useRouter } from 'next/navigation';
import { Zap, Code2, Sparkles } from 'lucide-react';

export default function VibeStudioLanding() {
  const router = useRouter();

  const handleStart = () => {
    router.push('/vibe-studio/onboarding');
  };

  return (
    <div className="min-h-screen vibe-grid-background vibe-corner-brackets vibe-corner-brackets-bottom">
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        {/* Terminal-style header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          {/* Logo/Title */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-4">
            <span className="text-white">JKKN</span>
            <span className="text-orange-500">_</span>
            <span className="text-orange-500">VIBE</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl font-mono tracking-wider">
            BUILD APPS WITH AI. NO CODING REQUIRED.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-12 max-w-2xl px-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-mono tracking-wider">INSTANT BUILD</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-mono tracking-wider">CLAUDE MAX</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
            </div>
            <p className="text-[10px] sm:text-xs text-gray-500 font-mono tracking-wider">AI POWERED</p>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="group relative px-8 sm:px-12 py-4 sm:py-6 rounded-lg vibe-btn-gradient text-black font-bold text-lg sm:text-xl tracking-wider transition-all hover:scale-105 min-h-[48px]"
        >
          <span className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">[</span>
            PRESS TO START
            <span className="text-xl sm:text-2xl">]</span>
          </span>
        </button>

        {/* BYOS notice */}
        <p className="mt-6 sm:mt-8 text-[10px] sm:text-xs text-gray-600 font-mono tracking-wider text-center px-4">
          POWERED BY YOUR CLAUDE MAX SUBSCRIPTION
        </p>

        {/* Footer info */}
        <div className="absolute bottom-4 sm:bottom-8 left-0 right-0 flex justify-center px-4">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-8 text-[10px] sm:text-xs text-gray-600 font-mono">
            <span>JKKN_INSTITUTIONS</span>
            <span className="text-orange-500 hidden sm:inline">|</span>
            <span>APPATHON_2.0</span>
            <span className="text-orange-500 hidden sm:inline">|</span>
            <span>2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
