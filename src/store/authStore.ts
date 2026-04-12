import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';

const REMEMBER_ME_KEY = 'auth_remember_me';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  /** Cached avatar URL from user_profiles — shared across all screens */
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  /** Whether Apple Watch / HealthKit permission is granted */
  watchConnected: boolean;
  setWatchConnected: (val: boolean) => void;
  /** Live step count — updated by the global health sync in MainTabs */
  steps: number | null;
  setSteps: (steps: number | null) => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithApple: (identityToken: string, email?: string | null, fullName?: string | null) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  avatarUrl: null,
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  watchConnected: false,
  setWatchConnected: (val) => set({ watchConnected: val }),
  steps: null,
  setSteps: (steps) => set({ steps }),

  checkSession: async () => {
    try {
      const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      if (rememberMe !== 'true') {
        await supabase.auth.signOut();
        return;
      }
      // refreshSession validates the token with Supabase — fails fast if invalid
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session?.user) {
        // Token inválido o expirado — limpiar y pedir login de nuevo
        await supabase.auth.signOut();
        await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
        return;
      }
      set({
        user: {
          id: data.session.user.id,
          email: data.session.user.email ?? '',
          name: data.session.user.user_metadata?.name ?? data.session.user.email ?? '',
          avatar: data.session.user.user_metadata?.avatar_url,
        },
        isAuthenticated: true,
      });
    } catch (e) {
      // Sin sesión — no hacer nada, el usuario verá el login
      await supabase.auth.signOut().catch(() => {});
      await SecureStore.deleteItemAsync(REMEMBER_ME_KEY).catch(() => {});
    }
  },

  login: async (email: string, password: string, rememberMe = false) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
        set({
          user: {
            id: data.user.id,
            email: data.user.email ?? '',
            name: data.user.user_metadata?.name ?? data.user.email ?? '',
            avatar: data.user.user_metadata?.avatar_url,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message ?? 'Error al iniciar sesión', isLoading: false });
    }
  },

  loginWithGoogle: async (idToken: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) throw error;
      if (data.user) {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
        set({
          user: {
            id: data.user.id,
            email: data.user.email ?? '',
            name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email ?? '',
            avatar: data.user.user_metadata?.avatar_url,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message ?? 'Error al iniciar sesión con Google', isLoading: false });
    }
  },

  loginWithApple: async (identityToken: string, email?: string | null, fullName?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });
      if (error) throw error;
      if (data.user) {
        await SecureStore.setItemAsync(REMEMBER_ME_KEY, 'true');
        set({
          user: {
            id: data.user.id,
            email: email ?? data.user.email ?? '',
            name: fullName ?? data.user.user_metadata?.full_name ?? data.user.email ?? '',
            avatar: data.user.user_metadata?.avatar_url,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message ?? 'Error al iniciar sesión con Apple', isLoading: false });
    }
  },

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      if (data.user) {
        set({
          user: { id: data.user.id, email: data.user.email ?? '', name },
          isAuthenticated: true,
          isLoading: false,
        });
      }
    } catch (error: any) {
      set({ error: error.message ?? 'Error al registrarse', isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(REMEMBER_ME_KEY);
    set({ user: null, isAuthenticated: false, error: null, avatarUrl: null, watchConnected: false, steps: null });
  },

  clearError: () => set({ error: null }),
}));
