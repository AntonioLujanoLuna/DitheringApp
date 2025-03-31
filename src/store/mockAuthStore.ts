// src/store/mockAuthStore.ts
import { create } from 'zustand';

interface UserProfile {
  username: string | null;
  avatar_url: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  // Simple mock actions
  login: () => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}

export const useMockAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  profile: null,
  isLoading: false,
  error: null,
  
  login: () => {
    set({ 
      isAuthenticated: true, 
      profile: { username: 'LocalUser', avatar_url: null },
      error: null 
    });
  },
  
  logout: () => {
    set({ 
      isAuthenticated: false, 
      profile: null,
      error: null 
    });
  },
  
  updateProfile: (data) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...data } : null
    }));
  }
}));