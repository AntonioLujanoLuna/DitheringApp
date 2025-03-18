import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';
import { supabase } from '../lib/supabase/client';

// Mock Supabase
vi.mock('../lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

describe('useAuthStore', () => {
  // Reset store between tests
  beforeEach(() => {
    const store = useAuthStore.getState();
    Object.assign(store, {
      user: null,
      profile: null,
      isLoading: false,
      error: null,
    });
    
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.isLoading).toBe(true);
    expect(state.error).toBeNull();
  });

  describe('initialize', () => {
    it('should set user and profile when user is logged in', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockProfile = { username: 'testuser', avatar_url: null, is_admin: false };
      
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
      
      vi.mocked(supabase.from().select().eq().single).mockResolvedValue({
        data: mockProfile,
        error: null,
      } as any);
      
      const store = useAuthStore.getState();
      await store.initialize();
      
      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
      expect(store.isLoading).toBe(false);
    });

    it('should set user to null when not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);
      
      const store = useAuthStore.getState();
      await store.initialize();
      
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.isLoading).toBe(false);
    });

    it('should handle errors', async () => {
      vi.mocked(supabase.auth.getUser).mockRejectedValue(new Error('Network error'));
      
      const store = useAuthStore.getState();
      await store.initialize();
      
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.isLoading).toBe(false);
    });
  });

  describe('login', () => {
    it('should log in successfully', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' };
      const mockProfile = { username: 'testuser', avatar_url: null, is_admin: false };
      
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
      
      vi.mocked(supabase.from().select().eq().single).mockResolvedValue({
        data: mockProfile,
        error: null,
      } as any);
      
      const store = useAuthStore.getState();
      await store.login('test@example.com', 'password');
      
      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual(mockProfile);
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle login errors', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      } as any);
      
      const store = useAuthStore.getState();
      await store.login('wrong@example.com', 'wrong');
      
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe('Invalid login credentials');
    });
  });

  describe('signup', () => {
    it('should sign up successfully', async () => {
      const mockUser = { id: 'new-user-id', email: 'new@example.com' };
      
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);
      
      vi.mocked(supabase.from().insert().select).mockResolvedValue({
        data: [{ id: mockUser.id }],
        error: null,
      } as any);
      
      const store = useAuthStore.getState();
      await store.signup('new@example.com', 'password');
      
      expect(store.user).toEqual(mockUser);
      expect(store.profile).toEqual({ username: null, avatar_url: null, is_admin: false });
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle signup errors', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      } as any);
      
      const store = useAuthStore.getState();
      await store.signup('existing@example.com', 'password');
      
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should log out successfully', async () => {
      // Set initial state to logged in
      const store = useAuthStore.getState();
      store.user = { id: 'test-user-id', email: 'test@example.com' } as any;
      store.profile = { username: 'testuser', avatar_url: null, is_admin: false };
      
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as any);
      
      await store.logout();
      
      expect(store.user).toBeNull();
      expect(store.profile).toBeNull();
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle logout errors', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: { message: 'Network error' },
      } as any);
      
      const store = useAuthStore.getState();
      await store.logout();
      
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe('Network error');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Set initial state to logged in
      const store = useAuthStore.getState();
      store.user = { id: 'test-user-id', email: 'test@example.com' } as any;
      store.profile = { username: 'oldname', avatar_url: null, is_admin: false };
      
      vi.mocked(supabase.from().update().eq).mockResolvedValue({
        error: null,
      } as any);
      
      vi.mocked(supabase.from().select().eq().single).mockResolvedValue({
        data: { username: 'newname', avatar_url: null, is_admin: false },
        error: null,
      } as any);
      
      await store.updateProfile({ username: 'newname' });
      
      expect(store.profile?.username).toBe('newname');
      expect(store.isLoading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle update profile errors', async () => {
      // Set initial state to logged in
      const store = useAuthStore.getState();
      store.user = { id: 'test-user-id', email: 'test@example.com' } as any;
      
      vi.mocked(supabase.from().update().eq).mockResolvedValue({
        error: { message: 'Database error' },
      } as any);
      
      await store.updateProfile({ username: 'newname' });
      
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe('Database error');
    });

    it('should throw error if not authenticated', async () => {
      const store = useAuthStore.getState();
      store.user = null;
      
      await store.updateProfile({ username: 'newname' });
      
      expect(store.isLoading).toBe(false);
      expect(store.error).toBe('Not authenticated');
    });
  });
});