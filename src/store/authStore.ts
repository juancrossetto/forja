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

  checkSession: async () => {
    try {
      const rememberMe = await SecureStore.getItemAsync(REMEMBER_ME_KEY);
      if (rememberMe !== 'true') {
        await supabase.auth.signOut();
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            name: session.user.user_metadata?.name ?? session.user.email ?? '',
            avatar: session.user.user_metadata?.avatar_url,
          },
          isAuthenticated: true,
        });
      }
    } catch (e) {
      // No session
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
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
