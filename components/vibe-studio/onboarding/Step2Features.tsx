'use client';

import { useEffect } from 'react';
import { useOnboardingStore, Feature } from '@/lib/stores/vibeOnboardingStore';
import { TerminalWindow } from '@/components/vibe-studio/ui/TerminalWindow';
import { Check } from 'lucide-react';

// Mock AI-generated features - in production, these would come from AI based on app idea
const generateFeatures = (appIdea: string): Feature[] => {
  // This would be an AI call in production
  return [
    { id: '1', name: 'User Authentication', description: 'Secure login and signup', selected: false },
    { id: '2', name: 'Dashboard', description: 'Overview of key metrics', selected: false },
    { id: '3', name: 'Data Management', description: 'CRUD operations for your data', selected: false },
    { id: '4', name: 'Search & Filter', description: 'Find content quickly', selected: false },
    { id: '5', name: 'Notifications', description: 'Real-time updates and alerts', selected: false },
  ];
};

export function Step2Features() {
  const {
    appIdea,
    features,
    setFeatures,
    toggleFeature,
    nextStep,
    prevStep
  } = useOnboardingStore();

  useEffect(() => {
    if (features.length === 0 && appIdea) {
      setFeatures(generateFeatures(appIdea));
    }
  }, [appIdea, features.length, setFeatures]);

  const selectedCount = features.filter(f => f.selected).length;
  const canContinue = selectedCount >= 1 && selectedCount <= 3;

  return (
    <TerminalWindow>
      <div className="space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            PICK CORE FEATURES
          </h1>
          <p className="text-gray-400">
            Select 1-3 features to start with (AI-generated based on your idea)
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => toggleFeature(feature.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-all text-left vibe-feature-card ${
                feature.selected ? 'selected' : ''
              }`}
            >
              <div className={`w-6 h-6 rounded border flex items-center justify-center transition-all ${
                feature.selected
                  ? 'bg-orange-500 border-orange-500'
                  : 'border-[#444]'
              }`}>
                {feature.selected && <Check className="w-4 h-4 text-black" />}
              </div>
              <div>
                <div className="font-mono text-sm tracking-wider text-white">
                  {feature.name}
                </div>
                <div className="text-xs text-gray-500">
                  {feature.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Selection count */}
        <div className="text-sm text-gray-400 font-mono">
          Selected: {selectedCount}/3
        </div>

        {/* Buttons */}
        <div className="space-y-3">
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
          <button
            onClick={prevStep}
            className="w-full py-2 text-gray-400 hover:text-white transition-colors font-mono text-sm"
          >
            ← BACK
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
          <span>STEP_02/05</span>
          <span className="text-cyan-400">SYSTEM_READY</span>
        </div>
      </div>
    </TerminalWindow>
  );
}
