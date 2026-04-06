import { create } from 'zustand';
import { todayISO } from '../utils/dateUtils';

interface UIStore {
  /** The date the user is viewing in HomeScreen (ISO YYYY-MM-DD) */
  activeDate: string;
  setActiveDate: (date: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeDate: todayISO(),
  setActiveDate: (date) => set({ activeDate: date }),
}));
