import { create } from 'zustand';
import { User, UserLevel, Gender } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    gender: Gender;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Mock user data
const MOCK_USER: User = {
  id: 'user_001',
  name: 'Carlos Mendez',
  email: 'carlos@metodor3set.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
  level: 'pro',
  memberSince: new Date('2023-06-15'),
  gender: 'male',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (email === 'carlos@metodor3set.com' && password === 'password') {
        set({
          user: MOCK_USER,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Credenciales inválidas');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name}`,
        level: 'beginner',
        memberSince: new Date(),
        gender: data.gender,
      };

      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrarse';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar sesión';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  updateProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 600));

      set((state) => ({
        user: state.user ? { ...state.user, ...data } : null,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar perfil';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
