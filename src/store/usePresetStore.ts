// src/store/usePresetStore.ts
import { create } from 'zustand';
import { 
  savePreset, 
  getPresets, 
  deletePreset as deleteLocalPreset 
} from '../lib/storage/localStorageService';
import { EditorSettings } from './useEditorStore';

export interface Preset {
  id: string;
  name: string;
  settings: EditorSettings;
  created_at: string;
}

interface PresetState {
  myPresets: Preset[];
  selectedPreset: Preset | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchMyPresets: () => Promise<void>;
  createPreset: (name: string, settings: EditorSettings) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  selectPreset: (preset: Preset | null) => void;
}

export const usePresetStore = create<PresetState>((set) => ({
  myPresets: [],
  selectedPreset: null,
  isLoading: false,
  error: null,
  
  fetchMyPresets: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const presets = await getPresets();
      
      set({ 
        myPresets: presets, 
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Error fetching my presets:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  createPreset: async (name, settings) => {
    try {
      set({ isLoading: true, error: null });
      
      const newPreset = {
        name,
        settings
      };
      
      const savedPreset = await savePreset(newPreset);
      
      // Update local state
      set(state => ({
        myPresets: [savedPreset, ...state.myPresets],
        isLoading: false
      }));
      
    } catch (error: any) {
      console.error('Error creating preset:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  deletePreset: async (id) => {
    try {
      set({ isLoading: true, error: null });
      
      await deleteLocalPreset(id);
      
      // Update local state
      set(state => ({
        myPresets: state.myPresets.filter(preset => preset.id !== id),
        selectedPreset: state.selectedPreset?.id === id ? null : state.selectedPreset,
        isLoading: false
      }));
      
    } catch (error: any) {
      console.error('Error deleting preset:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  selectPreset: (preset) => {
    set({ selectedPreset: preset });
  }
}));