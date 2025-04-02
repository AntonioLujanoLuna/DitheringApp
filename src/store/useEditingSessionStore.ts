// src/store/useEditingSessionStore.ts
// Combines Editor, Region, and Preset logic into a single store
import { create } from 'zustand';
import { PatternType } from '../lib/algorithms/patternDithering';
export type { PatternType };
import { MultiToneAlgorithm, ToneDistribution } from '../lib/algorithms/multiTone';
import { 
  savePreset as savePresetToStorage, 
  getPresets as getPresetsFromStorage, 
  deletePreset as deletePresetFromStorage 
} from '../lib/storage/localStorageService';

// --- Types from EditorStore --- 
export type DitheringAlgorithm = 'ordered' | 'floydSteinberg' | 'atkinson' | 'halftone' | 
  'jarvisJudiceNinke' | 'stucki' | 'burkes' | 'sierraLite' | 'random' |
  'voidAndCluster' | 'blueNoise' | 'riemersma' | 'directBinarySearch' |
  'pattern' | 'multiTone' | 'selective';
export type ColorMode = 'bw' | 'cmyk' | 'rgb' | 'custom';

// --- Types from RegionStore --- 
export type RegionType = 'circle' | 'rectangle' | 'polygon';

export interface Region {
  id: string;
  type: RegionType;
  name: string;
  algorithm: DitheringAlgorithm;
  // Common properties
  feather: number; // Edge feathering amount
  // Circle specific
  centerX?: number; // Normalized 0-1
  centerY?: number; // Normalized 0-1
  radius?: number; // Normalized 0-1
  // Rectangle specific
  x1?: number; // Normalized 0-1
  y1?: number; // Normalized 0-1
  x2?: number; // Normalized 0-1
  y2?: number; // Normalized 0-1
  // Polygon specific
  vertices?: [number, number][]; // Array of normalized coordinates
  // Algorithm specific parameters
  dotSize?: number;
  threshold?: number;
  spacing?: number;
  angle?: number;
  // UI state
  isSelected: boolean;
}

// --- Types from PresetStore --- 
export interface Preset {
  id: string;
  name: string;
  settings: EditorSettings;
  created_at: string;
}

// Combined State Interface
interface EditingSessionState {
  // --- State from EditorStore --- 
  originalImage: HTMLImageElement | null;
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  patternType: PatternType;
  patternSize: number;
  toneLevel: number;
  toneLevels: number;
  toneDistribution: ToneDistribution;
  multiToneAlgorithm: MultiToneAlgorithm;
  brightness: number;
  gammaCorrection: number;
  hue: number;
  saturation: number;
  lightness: number;
  sharpness: number;
  blur: number;
  invert: boolean;
  isProcessing: boolean;
  
  // --- State from RegionStore --- 
  regions: Region[];
  activeRegionId: string | null;

  // --- State from PresetStore --- 
  myPresets: Preset[];
  selectedPreset: Preset | null;
  isPresetLoading: boolean; // Renamed from isLoading to avoid conflict
  presetError: string | null; // Renamed from error
  
  // Actions (will be combined)
  // --- Actions from EditorStore --- 
  setOriginalImage: (image: HTMLImageElement | null) => void;
  setAlgorithm: (algorithm: DitheringAlgorithm) => void;
  setDotSize: (size: number) => void;
  setContrast: (contrast: number) => void;
  setColorMode: (mode: ColorMode) => void;
  setSpacing: (spacing: number) => void;
  setAngle: (angle: number) => void;
  setCustomColors: (colors: string[]) => void;
  setPatternType: (type: PatternType) => void;
  setPatternSize: (size: number) => void;
  setToneLevel: (level: number) => void;
  setToneLevels: (levels: number) => void;
  setToneDistribution: (distribution: ToneDistribution) => void;
  setMultiToneAlgorithm: (algorithm: MultiToneAlgorithm) => void;
  setBrightness: (brightness: number) => void;
  setGammaCorrection: (gamma: number) => void;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setSharpness: (sharpness: number) => void;
  setBlur: (blur: number) => void;
  setInvert: (invert: boolean) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  resetSettings: () => void;
  loadSettings: (settings: Partial<EditorSettings>) => void;
  reset: () => void;

  // --- Actions from RegionStore --- 
  addRegion: (region: Omit<Region, 'id' | 'isSelected'>) => string;
  updateRegion: (id: string, updates: Partial<Omit<Region, 'id'>>) => void;
  deleteRegion: (id: string) => void;
  selectRegion: (id: string | null) => void;
  clearRegions: () => void;
  moveRegionUp: (id: string) => void;
  moveRegionDown: (id: string) => void;

  // --- Actions from PresetStore --- 
  fetchMyPresets: () => Promise<void>;
  createPreset: (name: string, settings: EditorSettings) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  selectPreset: (preset: Preset | null) => void;
  applySelectedPreset: () => void;
}

// Type for savable settings (used by presets)
export interface EditorSettings {
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  patternType: PatternType;
  patternSize: number;
  toneLevel: number;
  toneLevels: number;
  toneDistribution: ToneDistribution;
  multiToneAlgorithm: MultiToneAlgorithm;
  brightness: number;
  gammaCorrection: number;
  hue: number;
  saturation: number;
  lightness: number;
  sharpness: number;
  blur: number;
  invert: boolean;
}

const DEFAULT_SETTINGS: EditorSettings = {
  algorithm: 'halftone',
  dotSize: 3,
  contrast: 50,
  colorMode: 'bw',
  spacing: 5,
  angle: 45,
  customColors: ['#000000', '#ffffff'],
  patternType: 'dots',
  patternSize: 4,
  toneLevel: 4,
  toneLevels: 4,
  toneDistribution: 'linear',
  multiToneAlgorithm: 'ordered',
  brightness: 0,
  gammaCorrection: 1.0,
  hue: 0,
  saturation: 0,
  lightness: 0,
  sharpness: 0,
  blur: 0,
  invert: false,
};

// Store creator function (implementation to be filled)
export const useEditingSessionStore = create<EditingSessionState>((set, get) => ({
  // Initial state from EditorStore
  originalImage: null,
  ...DEFAULT_SETTINGS,
  isProcessing: false,

  // --- Initial state from RegionStore --- 
  regions: [],
  activeRegionId: null,

  // --- Initial state from PresetStore --- 
  myPresets: [],
  selectedPreset: null,
  isPresetLoading: false,
  presetError: null,

  // Actions from EditorStore
  setOriginalImage: (image) => set({ originalImage: image }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setDotSize: (dotSize) => set({ dotSize }),
  setContrast: (contrast) => set({ contrast }),
  setColorMode: (colorMode) => set({ colorMode }),
  setSpacing: (spacing) => set({ spacing }),
  setAngle: (angle) => set({ angle }),
  setCustomColors: (customColors) => set({ customColors }),
  setPatternType: (patternType) => set({ patternType }),
  setPatternSize: (patternSize) => set({ patternSize }),
  setToneLevel: (toneLevel) => set({ toneLevel }),
  setToneLevels: (toneLevels) => set({ toneLevels }),
  setToneDistribution: (toneDistribution) => set({ toneDistribution }),
  setMultiToneAlgorithm: (multiToneAlgorithm) => set({ multiToneAlgorithm }),
  setBrightness: (brightness) => set({ brightness }),
  setGammaCorrection: (gammaCorrection) => set({ gammaCorrection }),
  setHue: (hue) => set({ hue }),
  setSaturation: (saturation) => set({ saturation }),
  setLightness: (lightness) => set({ lightness }),
  setSharpness: (sharpness) => set({ sharpness }),
  setBlur: (blur) => set({ blur }),
  setInvert: (invert) => set({ invert }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  resetSettings: () => {
    console.log('Resetting editor settings to default');
    set({ ...DEFAULT_SETTINGS });
  },
  loadSettings: (settings) => {
    console.log('Loading settings from preset:', settings);
    set({ ...settings });
  },
  reset: () => {
    console.log('Resetting entire editing session');
    set({
      originalImage: null,
      ...DEFAULT_SETTINGS,
      regions: [],
      activeRegionId: null,
      // Keep presets? Decide based on desired behavior
      // selectedPreset: null,
      isProcessing: false,
      presetError: null,
    });
  },

  // --- Actions from RegionStore --- 
  addRegion: (regionData) => {
    const id = `region-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newRegion: Region = { ...regionData, id, isSelected: false }; // Start deselected initially
    set((state) => ({
      // Keep other regions as they are, just add the new one
      regions: [...state.regions, newRegion],
      // Don't automatically activate here, let selectRegion handle it
    }));
    // Explicitly select the newly added region AFTER adding it
    get().selectRegion(id);
    return id;
  },
  
  updateRegion: (id, updates) => {
    set((state) => ({
      regions: state.regions.map((region) => 
        region.id === id ? { ...region, ...updates } : region
      )
    }));
  },
  
  deleteRegion: (id) => {
    set((state) => {
      const remainingRegions = state.regions.filter((region) => region.id !== id);
      let nextActiveId: string | null = null;

      if (state.activeRegionId === id) {
        // If the deleted one was active, select the first remaining one, or null
        nextActiveId = remainingRegions.length > 0 ? remainingRegions[0].id : null;
      } else {
        // Otherwise, the active region remains the same (if it exists)
        nextActiveId = state.activeRegionId;
      }
      
      // Update the isSelected status based on the final nextActiveId
      const updatedRegions = remainingRegions.map(r => ({
        ...r,
        isSelected: r.id === nextActiveId
      }));

      return {
        regions: updatedRegions, // Return the correctly updated array
        activeRegionId: nextActiveId, // Return the correctly determined active ID
      };
    });
  },
  
  selectRegion: (id) => {
    set((state) => ({
      regions: state.regions.map((region) => ({
        ...region,
        isSelected: region.id === id
      })),
      activeRegionId: id,
    }));
  },
  
  clearRegions: () => {
    set({ regions: [], activeRegionId: null });
  },
  
  moveRegionUp: (id) => {
    set((state) => {
      const index = state.regions.findIndex((region) => region.id === id);
      if (index <= 0) return {}; // No change
      const newRegions = [...state.regions];
      // Simple swap
      [newRegions[index - 1], newRegions[index]] = [newRegions[index], newRegions[index - 1]];
      return { regions: newRegions };
    });
  },
  
  moveRegionDown: (id) => {
    set((state) => {
      const index = state.regions.findIndex((region) => region.id === id);
      if (index === -1 || index >= state.regions.length - 1) return {}; // No change
      const newRegions = [...state.regions];
      // Simple swap
      [newRegions[index + 1], newRegions[index]] = [newRegions[index], newRegions[index + 1]];
      return { regions: newRegions };
    });
  },

  // --- Actions from PresetStore --- 
  fetchMyPresets: async () => {
    try {
      set({ isPresetLoading: true, presetError: null });
      const presets = await getPresetsFromStorage();
      set({ myPresets: presets, isPresetLoading: false });
    } catch (error: any) {
      console.error('Error fetching presets:', error);
      set({ presetError: error.message || 'Failed to fetch presets', isPresetLoading: false });
    }
  },
  
  createPreset: async (name, settings) => {
    if (!name || name.trim().length === 0) {
        set({ presetError: 'Preset name cannot be empty' });
        return; 
    }
    try {
      set({ isPresetLoading: true, presetError: null });
      // Ensure settings are a clean copy, not the reactive state
      const cleanSettings = { ...settings }; 
      const savedPreset = await savePresetToStorage({ name, settings: cleanSettings });
      set(state => ({
        myPresets: [savedPreset, ...state.myPresets],
        isPresetLoading: false,
        selectedPreset: savedPreset // Optionally select the newly created preset
      }));
    } catch (error: any) {
      console.error('Error creating preset:', error);
      set({ presetError: error.message || 'Failed to save preset', isPresetLoading: false });
    }
  },
  
  deletePreset: async (id) => {
    try {
      set({ isPresetLoading: true, presetError: null });
      await deletePresetFromStorage(id);
      set(state => ({
        myPresets: state.myPresets.filter(preset => preset.id !== id),
        // If the deleted preset was selected, deselect it
        selectedPreset: state.selectedPreset?.id === id ? null : state.selectedPreset,
        isPresetLoading: false
      }));
    } catch (error: any) {
      console.error('Error deleting preset:', error);
      set({ presetError: error.message || 'Failed to delete preset', isPresetLoading: false });
    }
  },
  
  selectPreset: (preset) => {
    set({ selectedPreset: preset });
    // Optionally apply the preset immediately upon selection?
    // if (preset) { get().loadSettings(preset.settings); }
  },

  applySelectedPreset: () => {
      const selected = get().selectedPreset;
      if (selected) {
          console.log('Applying settings from selected preset:', selected.name);
          get().loadSettings(selected.settings);
      } else {
          console.warn('No preset selected to apply');
      }
  },
})); 

// Export MultiToneAlgorithm and ToneDistribution
export type { MultiToneAlgorithm, ToneDistribution }; 