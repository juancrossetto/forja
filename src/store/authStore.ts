import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  login: (email: string, password: string) => Promise<void>;
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

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user) {
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
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
