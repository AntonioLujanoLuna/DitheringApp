import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { EditorSettings } from './useEditorStore';

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  settings: EditorSettings;
  is_public: boolean;
  created_at: string;
  username?: string | null;
}

interface PresetState {
  myPresets: Preset[];
  communityPresets: Preset[];
  selectedPreset: Preset | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  fetchMyPresets: () => Promise<void>;
  fetchCommunityPresets: () => Promise<void>;
  createPreset: (name: string, settings: EditorSettings, isPublic: boolean) => Promise<void>;
  updatePreset: (id: string, data: { name?: string; isPublic?: boolean }) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  selectPreset: (preset: Preset | null) => void;
}

export const usePresetStore = create<PresetState>((set) => ({
  myPresets: [],
  communityPresets: [],
  selectedPreset: null,
  isLoading: false,
  error: null,
  
  fetchMyPresets: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('presets')
        .select('id, user_id, name, settings, is_public, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      set({ 
        myPresets: data as Preset[], 
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Error fetching my presets:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchCommunityPresets: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('presets')
        .select(`
          id, user_id, name, settings, is_public, created_at,
          profiles(username)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      const formattedData = data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        settings: item.settings,
        is_public: item.is_public,
        created_at: item.created_at,
        username: item.profiles?.[0]?.username || null
      }));
      
      set({ 
        communityPresets: formattedData, 
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Error fetching community presets:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  createPreset: async (name, settings, isPublic) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('presets')
        .insert([
          {
            user_id: user.id,
            name,
            settings,
            is_public: isPublic
          }
        ])
        .select();
        
      if (error) throw error;
      
      // Update local state
      set(state => ({
        myPresets: [data[0] as Preset, ...state.myPresets],
        isLoading: false
      }));
      
    } catch (error: any) {
      console.error('Error creating preset:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  updatePreset: async (id, { name, isPublic }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const updates: { name?: string; is_public?: boolean } = {};
      if (name !== undefined) updates.name = name;
      if (isPublic !== undefined) updates.is_public = isPublic;
      
      const { error } = await supabase
        .from('presets')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Update local state
      set(state => ({
        myPresets: state.myPresets.map(preset => 
          preset.id === id
            ? { ...preset, ...(name ? { name } : {}), ...(isPublic !== undefined ? { is_public: isPublic } : {}) }
            : preset
        ),
        isLoading: false
      }));
      
    } catch (error: any) {
      console.error('Error updating preset:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  deletePreset: async (id) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      set({ isLoading: true, error: null });
      
      const { error } = await supabase
        .from('presets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
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