import { create } from 'zustand';
import { DitheringAlgorithm } from './useEditorStore';

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

interface RegionState {
  regions: Region[];
  activeRegionId: string | null;
  // Actions
  addRegion: (region: Omit<Region, 'id'>) => string;
  updateRegion: (id: string, updates: Partial<Omit<Region, 'id'>>) => void;
  deleteRegion: (id: string) => void;
  selectRegion: (id: string | null) => void;
  clearRegions: () => void;
  moveRegionUp: (id: string) => void;
  moveRegionDown: (id: string) => void;
}

export const useRegionStore = create<RegionState>((set, get) => ({
  regions: [],
  activeRegionId: null,

  addRegion: (region) => {
    const id = `region-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    set((state) => ({
      regions: [...state.regions, { ...region, id, isSelected: true }],
      activeRegionId: id,
    }));
    
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
      const newRegions = state.regions.filter((region) => region.id !== id);
      
      // If the deleted region was active, set activeRegionId to null or the first region
      let newActiveRegionId = state.activeRegionId;
      if (state.activeRegionId === id) {
        newActiveRegionId = newRegions.length > 0 ? newRegions[0].id : null;
      }
      
      return {
        regions: newRegions,
        activeRegionId: newActiveRegionId,
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
      if (index <= 0) return state;
      
      const newRegions = [...state.regions];
      const temp = newRegions[index];
      newRegions[index] = newRegions[index - 1];
      newRegions[index - 1] = temp;
      
      return { regions: newRegions };
    });
  },
  
  moveRegionDown: (id) => {
    set((state) => {
      const index = state.regions.findIndex((region) => region.id === id);
      if (index === -1 || index >= state.regions.length - 1) return state;
      
      const newRegions = [...state.regions];
      const temp = newRegions[index];
      newRegions[index] = newRegions[index + 1];
      newRegions[index + 1] = temp;
      
      return { regions: newRegions };
    });
  },
})); 