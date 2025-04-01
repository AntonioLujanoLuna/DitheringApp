import { useEditingSessionStore, DitheringAlgorithm, ColorMode, PatternType, MultiToneAlgorithm, ToneDistribution } from '../store/useEditingSessionStore';

// Define the types for the settings and setters explicitly
// This improves clarity and maintainability
interface EditorSettingsState {
  algorithm: DitheringAlgorithm;
  dotSize: number;
  contrast: number;
  colorMode: ColorMode;
  spacing: number;
  angle: number;
  customColors: string[];
  patternType: PatternType;
  patternSize: number;
  brightness: number;
  gammaCorrection: number;
  hue: number;
  saturation: number;
  lightness: number;
  sharpness: number;
  blur: number;
  toneLevels: number;
  toneLevel: number;
  toneDistribution: ToneDistribution;
  multiToneAlgorithm: MultiToneAlgorithm;
  invert: boolean;
}

interface EditorSettingsSetters {
  setAlgorithm: (algorithm: DitheringAlgorithm) => void;
  setDotSize: (dotSize: number) => void;
  setContrast: (contrast: number) => void;
  setColorMode: (colorMode: ColorMode) => void;
  setSpacing: (spacing: number) => void;
  setAngle: (angle: number) => void;
  setCustomColors: (customColors: string[]) => void;
  setPatternType: (patternType: PatternType) => void;
  setPatternSize: (patternSize: number) => void;
  setBrightness: (brightness: number) => void;
  setGammaCorrection: (gamma: number) => void;
  setHue: (hue: number) => void;
  setSaturation: (saturation: number) => void;
  setLightness: (lightness: number) => void;
  setSharpness: (sharpness: number) => void;
  setBlur: (blur: number) => void;
  setToneLevels: (levels: number) => void;
  setToneLevel: (level: number) => void;
  setToneDistribution: (distribution: ToneDistribution) => void;
  setMultiToneAlgorithm: (algorithm: MultiToneAlgorithm) => void;
  setInvert: (invert: boolean) => void;
}

interface UseEditorSettingsReturn extends EditorSettingsState, EditorSettingsSetters {}

export function useEditorSettings(): UseEditorSettingsReturn {
  const settings = useEditingSessionStore(state => ({
    // Select all settings values
    algorithm: state.algorithm,
    dotSize: state.dotSize,
    contrast: state.contrast,
    colorMode: state.colorMode,
    spacing: state.spacing,
    angle: state.angle,
    customColors: state.customColors,
    patternType: state.patternType,
    patternSize: state.patternSize,
    brightness: state.brightness,
    gammaCorrection: state.gammaCorrection,
    hue: state.hue,
    saturation: state.saturation,
    lightness: state.lightness,
    sharpness: state.sharpness,
    blur: state.blur,
    toneLevels: state.toneLevels,
    toneLevel: state.toneLevel,
    toneDistribution: state.toneDistribution,
    multiToneAlgorithm: state.multiToneAlgorithm,
    invert: state.invert,
    // Select all setter functions
    setAlgorithm: state.setAlgorithm,
    setDotSize: state.setDotSize,
    setContrast: state.setContrast,
    setColorMode: state.setColorMode,
    setSpacing: state.setSpacing,
    setAngle: state.setAngle,
    setCustomColors: state.setCustomColors,
    setPatternType: state.setPatternType,
    setPatternSize: state.setPatternSize,
    setBrightness: state.setBrightness,
    setGammaCorrection: state.setGammaCorrection,
    setHue: state.setHue,
    setSaturation: state.setSaturation,
    setLightness: state.setLightness,
    setSharpness: state.setSharpness,
    setBlur: state.setBlur,
    setToneLevels: state.setToneLevels,
    setToneLevel: state.setToneLevel,
    setToneDistribution: state.setToneDistribution,
    setMultiToneAlgorithm: state.setMultiToneAlgorithm,
    setInvert: state.setInvert,
  }));

  return settings;
} 