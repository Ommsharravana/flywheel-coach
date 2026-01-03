import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalkthroughState {
  // Track which walkthroughs user has completed
  completedWalkthroughs: string[];

  // Current active walkthrough
  activeWalkthrough: string | null;
  currentStep: number;

  // Actions
  startWalkthrough: (id: string) => void;
  nextStep: () => void;
  previousStep: () => void;
  completeWalkthrough: (id: string) => void;
  skipWalkthrough: (id: string) => void;
  resetWalkthrough: (id: string) => void;
  hasCompletedWalkthrough: (id: string) => boolean;
}

export const useWalkthroughStore = create<WalkthroughState>()(
  persist(
    (set, get) => ({
      completedWalkthroughs: [],
      activeWalkthrough: null,
      currentStep: 0,

      startWalkthrough: (id) => {
        set({ activeWalkthrough: id, currentStep: 0 });
      },

      nextStep: () => {
        set((state) => ({ currentStep: state.currentStep + 1 }));
      },

      previousStep: () => {
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
        }));
      },

      completeWalkthrough: (id) => {
        set((state) => ({
          completedWalkthroughs: [...new Set([...state.completedWalkthroughs, id])],
          activeWalkthrough: null,
          currentStep: 0,
        }));
      },

      skipWalkthrough: (id) => {
        set((state) => ({
          completedWalkthroughs: [...new Set([...state.completedWalkthroughs, id])],
          activeWalkthrough: null,
          currentStep: 0,
        }));
      },

      resetWalkthrough: (id) => {
        set((state) => ({
          completedWalkthroughs: state.completedWalkthroughs.filter((w) => w !== id),
        }));
      },

      hasCompletedWalkthrough: (id) => {
        return get().completedWalkthroughs.includes(id);
      },
    }),
    {
      name: 'walkthrough-storage',
    }
  )
);
