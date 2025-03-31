// src/store/useAuthStore.ts
import { create } from 'zustand';

interface AuthState {
  user: null;
  isLoading: boolean;
  error: string | null;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  isLoading: false,
  error: null,
}));