import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  // Whether the user has completed the tutorial
  hasCompletedTutorial: boolean;
  // Effect history for undo/redo functionality
  effectHistory: any[];
  currentHistoryIndex: number;
  // Actions
  setHasCompletedTutorial: (completed: boolean) => void;
  addToHistory: (effect: any) => void;
  undo: () => any | null;
  redo: () => any | null;
  clearHistory: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      hasCompletedTutorial: false,
      effectHistory: [],
      currentHistoryIndex: -1,
      
      setHasCompletedTutorial: (completed) => set({ hasCompletedTutorial: completed }),
      
      addToHistory: (effect) => set((state) => {
        const { effectHistory, currentHistoryIndex } = state;
        
        // Remove any future history if we're not at the end
        const newHistory = effectHistory.slice(0, currentHistoryIndex + 1);
        
        // Add the new effect to history
        return {
          effectHistory: [...newHistory, effect],
          currentHistoryIndex: newHistory.length
        };
      }),
      
      undo: () => {
        const { effectHistory, currentHistoryIndex } = get();
        
        if (currentHistoryIndex <= 0) {
          return null; // Nothing to undo
        }
        
        const newIndex = currentHistoryIndex - 1;
        set({ currentHistoryIndex: newIndex });
        
        return effectHistory[newIndex];
      },
      
      redo: () => {
        const { effectHistory, currentHistoryIndex } = get();
        
        if (currentHistoryIndex >= effectHistory.length - 1) {
          return null; // Nothing to redo
        }
        
        const newIndex = currentHistoryIndex + 1;
        set({ currentHistoryIndex: newIndex });
        
        return effectHistory[newIndex];
      },
      
      clearHistory: () => set({ effectHistory: [], currentHistoryIndex: -1 })
    }),
    {
      name: 'user-storage',
    }
  )
); 