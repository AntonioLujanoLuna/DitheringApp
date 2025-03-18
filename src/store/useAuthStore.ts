import { create } from 'zustand';
import { supabase } from '../lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  profile: {
    username: string | null;
    avatar_url: string | null;
    is_admin: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { username?: string; avatar_url?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  error: null,
  
  initialize: async () => {
    try {
      set({ isLoading: true });
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        set({ user: null, profile: null, isLoading: false });
        return;
      }
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, is_admin')
        .eq('id', user.id)
        .single();
      
      set({ 
        user, 
        profile: profile || { username: null, avatar_url: null, is_admin: false }, 
        isLoading: false 
      });
      
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ user: null, profile: null, isLoading: false });
    }
  },
  
  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, is_admin')
          .eq('id', data.user.id)
          .single();
        
        set({ 
          user: data.user, 
          profile: profile || { username: null, avatar_url: null, is_admin: false },
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  signup: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        // Create a profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id }]);
          
        if (profileError) throw profileError;
        
        set({ 
          user: data.user, 
          profile: { username: null, avatar_url: null, is_admin: false },
          isLoading: false 
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  logout: async () => {
    try {
      set({ isLoading: true });
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      set({ user: null, profile: null, isLoading: false });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateProfile: async (data) => {
    try {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');
      
      set({ isLoading: true });
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Get updated profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url, is_admin')
        .eq('id', user.id)
        .single();
      
      set({ 
        profile: profile || { username: null, avatar_url: null, is_admin: false },
        isLoading: false 
      });
      
    } catch (error: any) {
      console.error('Update profile error:', error);
      set({ error: error.message, isLoading: false });
    }
  },
}));