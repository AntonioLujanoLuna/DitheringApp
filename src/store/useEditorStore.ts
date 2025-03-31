import { create } from 'zustand';
import { PatternType } from '../lib/algorithms/patternDithering';
import { MultiToneAlgorithm } from '../lib/algorithms/multiTone';

export type DitheringAlgorithm = 'ordered' | 'floydSteinberg' | 'atkinson' | 'halftone' | 
  'jarvisJudiceNinke' | 'stucki' | 'burkes' | 'sierraLite' | 'random' |
  'voidAndCluster' | 'blueNoise' | 'riemersma' | 'directBinarySearch' |
  'pattern' | 'multiTone' | 'selective';
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
  // Pattern dithering parameters
  patternType: PatternType;
  patternSize: number;
  // Multi-tone parameters
  toneLevel: number;
  multiToneAlgorithm: MultiToneAlgorithm;
  // Image processing parameters
  brightness: number;
  gammaCorrection: number;
  hue: number;
  saturation: number;
  lightness: number;
  sharpness: number;
  blur: number;
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
  setPatternType: (type: PatternType) => void;
  setPatternSize: (size: number) => void;
  setToneLevel: (level: number) => void;
  setMultiToneAlgorithm: (algorithm: MultiToneAlgorithm) => void;
  setBrightness: (brightness: number) => void;
  setGammaCorrection: (gamma: number) => void;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setSharpness: (sharpness: number) => void;
  setBlur: (blur: number) => void;
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
  patternType: PatternType;
  patternSize: number;
  toneLevel: number;
  multiToneAlgorithm: MultiToneAlgorithm;
  brightness: number;
  gammaCorrection: number;
  hue: number;
  saturation: number;
  lightness: number;
  sharpness: number;
  blur: number;
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
  multiToneAlgorithm: 'ordered',
  brightness: 0,
  gammaCorrection: 1.0,
  hue: 0,
  saturation: 0,
  lightness: 0,
  sharpness: 0,
  blur: 0,
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
  setPatternType: (patternType) => set({ patternType }),
  setPatternSize: (patternSize) => set({ patternSize }),
  setToneLevel: (toneLevel) => set({ toneLevel }),
  setMultiToneAlgorithm: (multiToneAlgorithm) => set({ multiToneAlgorithm }),
  setBrightness: (brightness) => set({ brightness }),
  setGammaCorrection: (gammaCorrection) => set({ gammaCorrection }),
  setHue: (hue) => set({ hue }),
  setSaturation: (saturation) => set({ saturation }),
  setLightness: (lightness) => set({ lightness }),
  setSharpness: (sharpness) => set({ sharpness }),
  setBlur: (blur) => set({ blur }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  resetSettings: () => set({ ...DEFAULT_SETTINGS }),
  loadSettings: (settings) => set({ ...settings }),
}));