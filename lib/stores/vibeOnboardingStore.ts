import { create } from 'zustand';

export type Platform = 'WEB' | 'MOBILE';
export type Motivation = 'PERSONAL' | 'FUN' | 'MONEY' | 'LEVELING_UP';
export type Experience = 'NEVER' | 'NO_CODER' | 'AI_TOOL_EXPLORER' | 'DEVELOPER';
export type Tool = 'CLAUDE_CODE' | 'CURSOR' | 'NO_CODE_TOOLS' | 'BOLT' | 'LOVABLE';
export type Challenge = 'SETUP' | 'FIXING_BUGS' | 'SLOW_WORKFLOWS';

export interface Feature {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

interface OnboardingState {
  // Step 1: App Idea
  platform: Platform;
  appIdea: string;

  // Step 2: Features
  features: Feature[];

  // Step 3: Logo
  logoPrompt: string;
  logoUrl: string | null;

  // Step 4: App Name
  appName: string;

  // Step 5: User Profile
  motivation: Motivation | null;
  experience: Experience | null;
  toolsUsed: Tool[];
  codeAgentComfort: number;
  biggestChallenge: Challenge | null;

  // Navigation
  currentStep: number;

  // Actions
  setPlatform: (platform: Platform) => void;
  setAppIdea: (idea: string) => void;
  setFeatures: (features: Feature[]) => void;
  toggleFeature: (featureId: string) => void;
  setLogoPrompt: (prompt: string) => void;
  setLogoUrl: (url: string | null) => void;
  setAppName: (name: string) => void;
  setMotivation: (motivation: Motivation) => void;
  setExperience: (experience: Experience) => void;
  toggleTool: (tool: Tool) => void;
  setCodeAgentComfort: (value: number) => void;
  setBiggestChallenge: (challenge: Challenge) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const initialState = {
  platform: 'WEB' as Platform,
  appIdea: '',
  features: [],
  logoPrompt: '',
  logoUrl: null,
  appName: '',
  motivation: null,
  experience: null,
  toolsUsed: [],
  codeAgentComfort: 5,
  biggestChallenge: null,
  currentStep: 1,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setPlatform: (platform) => set({ platform }),
  setAppIdea: (appIdea) => set({ appIdea }),
  setFeatures: (features) => set({ features }),
  toggleFeature: (featureId) => set((state) => ({
    features: state.features.map((f) =>
      f.id === featureId ? { ...f, selected: !f.selected } : f
    ),
  })),
  setLogoPrompt: (logoPrompt) => set({ logoPrompt }),
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  setAppName: (appName) => set({ appName }),
  setMotivation: (motivation) => set({ motivation }),
  setExperience: (experience) => set({ experience }),
  toggleTool: (tool) => set((state) => ({
    toolsUsed: state.toolsUsed.includes(tool)
      ? state.toolsUsed.filter((t) => t !== tool)
      : [...state.toolsUsed, tool],
  })),
  setCodeAgentComfort: (codeAgentComfort) => set({ codeAgentComfort }),
  setBiggestChallenge: (biggestChallenge) => set({ biggestChallenge }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),
  goToStep: (step) => set({ currentStep: step }),
  reset: () => set(initialState),
}));
