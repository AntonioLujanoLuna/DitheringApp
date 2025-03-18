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

export interface PresetState {
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

export const usePresetStore: () => PresetState; 