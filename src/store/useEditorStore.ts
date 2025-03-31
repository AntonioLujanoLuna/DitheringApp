import { create } from 'zustand';

export type DitheringAlgorithm = 'ordered' | 'floydSteinberg' | 'atkinson' | 'halftone' | 'jarvisJudiceNinke' | 'stucki' | 'burkes' | 'sierraLite' | 'random';
export type ColorMode = 'bw' | 'cmyk' | 'rgb' | 'custom';

interface EditorState {
  // Original image
  originalImage: HTMLImageElement | null;
  // Processing parameters
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  // UI state
  isProcessing: boolean;
  // Actions
  setOriginalImage: (image: HTMLImageElement | null) => void;
  setAlgorithm: (algorithm: DitheringAlgorithm) => void;
  setDotSize: (size: number) => void;
  setContrast: (contrast: number) => void;
  setColorMode: (mode: ColorMode) => void;
  setSpacing: (spacing: number) => void;
  setAngle: (angle: number) => void;
  setCustomColors: (colors: string[]) => void;
  setIsProcessing: (isProcessing: boolean) => void;
  resetSettings: () => void;
  loadSettings: (settings: Partial<EditorSettings>) => void;
}

export interface EditorSettings {
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
}

const DEFAULT_SETTINGS: EditorSettings = {
  algorithm: 'halftone',
  dotSize: 3,
  contrast: 50,
  colorMode: 'bw',
  spacing: 5,
  angle: 45,
  customColors: ['#000000', '#ffffff'],
};

export const useEditorStore = create<EditorState>((set) => ({
  // Initial state
  originalImage: null,
  ...DEFAULT_SETTINGS,
  isProcessing: false,
  
  // Actions
  setOriginalImage: (image) => set({ originalImage: image }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setDotSize: (dotSize) => set({ dotSize }),
  setContrast: (contrast) => set({ contrast }),
  setColorMode: (colorMode) => set({ colorMode }),
  setSpacing: (spacing) => set({ spacing }),
  setAngle: (angle) => set({ angle }),
  setCustomColors: (customColors) => set({ customColors }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  resetSettings: () => set({ ...DEFAULT_SETTINGS }),
  loadSettings: (settings) => set({ ...settings }),
}));