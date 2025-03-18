import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore } from './useEditorStore';

describe('useEditorStore', () => {
  // Reset store between tests
  beforeEach(() => {
    const store = useEditorStore.getState();
    store.setOriginalImage(null);
    store.setAlgorithm('ordered');
    store.setDotSize(3);
    store.setContrast(50);
    store.setColorMode('bw');
    store.setSpacing(5);
    store.setAngle(45);
    store.setCustomColors(['#000000', '#ffffff']);
    store.setIsProcessing(false);
  });

  it('should initialize with default values', () => {
    const state = useEditorStore.getState();
    
    expect(state.originalImage).toBeNull();
    expect(state.algorithm).toEqual('halftone');
    expect(state.dotSize).toEqual(3);
    expect(state.contrast).toEqual(50);
    expect(state.colorMode).toEqual('bw');
    expect(state.spacing).toEqual(5);
    expect(state.angle).toEqual(45);
    expect(state.customColors).toEqual(['#000000', '#ffffff']);
    expect(state.isProcessing).toEqual(false);
  });

  it('should set original image', () => {
    const store = useEditorStore.getState();
    const mockImage = { src: 'test.png' } as HTMLImageElement;
    
    store.setOriginalImage(mockImage);
    
    expect(store.originalImage).toEqual(mockImage);
  });

  it('should set algorithm', () => {
    const store = useEditorStore.getState();
    
    store.setAlgorithm('floydSteinberg');
    
    expect(store.algorithm).toEqual('floydSteinberg');
  });

  it('should set dot size', () => {
    const store = useEditorStore.getState();
    
    store.setDotSize(5);
    
    expect(store.dotSize).toEqual(5);
  });

  it('should set contrast', () => {
    const store = useEditorStore.getState();
    
    store.setContrast(75);
    
    expect(store.contrast).toEqual(75);
  });

  it('should set color mode', () => {
    const store = useEditorStore.getState();
    
    store.setColorMode('rgb');
    
    expect(store.colorMode).toEqual('rgb');
  });

  it('should set spacing', () => {
    const store = useEditorStore.getState();
    
    store.setSpacing(10);
    
    expect(store.spacing).toEqual(10);
  });

  it('should set angle', () => {
    const store = useEditorStore.getState();
    
    store.setAngle(30);
    
    expect(store.angle).toEqual(30);
  });

  it('should set custom colors', () => {
    const store = useEditorStore.getState();
    const newColors = ['#FF0000', '#00FF00', '#0000FF'];
    
    store.setCustomColors(newColors);
    
    expect(store.customColors).toEqual(newColors);
  });

  it('should set processing state', () => {
    const store = useEditorStore.getState();
    
    store.setIsProcessing(true);
    
    expect(store.isProcessing).toEqual(true);
  });

  it('should reset settings to defaults', () => {
    const store = useEditorStore.getState();
    
    // Change some settings
    store.setAlgorithm('floydSteinberg');
    store.setDotSize(7);
    store.setContrast(80);
    
    // Reset settings
    store.resetSettings();
    
    // Check that settings are reset
    expect(store.algorithm).toEqual('halftone');
    expect(store.dotSize).toEqual(3);
    expect(store.contrast).toEqual(50);
    
    // Original image should not be affected by reset
    expect(store.originalImage).toBeNull();
  });

  it('should load settings', () => {
    const store = useEditorStore.getState();
    
    const newSettings = {
      algorithm: 'atkinson',
      dotSize: 4,
      contrast: 60,
      colorMode: 'rgb',
      spacing: 8,
      angle: 20,
      customColors: ['#FF0000', '#0000FF'],
    };
    
    store.loadSettings(newSettings);
    
    expect(store.algorithm).toEqual(newSettings.algorithm);
    expect(store.dotSize).toEqual(newSettings.dotSize);
    expect(store.contrast).toEqual(newSettings.contrast);
    expect(store.colorMode).toEqual(newSettings.colorMode);
    expect(store.spacing).toEqual(newSettings.spacing);
    expect(store.angle).toEqual(newSettings.angle);
    expect(store.customColors).toEqual(newSettings.customColors);
  });

  it('should partially load settings', () => {
    const store = useEditorStore.getState();
    
    // Initialize with custom values
    store.setAlgorithm('floydSteinberg');
    store.setDotSize(7);
    store.setContrast(80);
    
    // Partially update
    const partialSettings = {
      algorithm: 'atkinson',
      dotSize: 4,
    };
    
    store.loadSettings(partialSettings);
    
    // Updated values
    expect(store.algorithm).toEqual('atkinson');
    expect(store.dotSize).toEqual(4);
    
    // Unchanged values
    expect(store.contrast).toEqual(80);
  });
});