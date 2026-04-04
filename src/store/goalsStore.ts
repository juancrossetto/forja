import { create } from 'zustand';
import { Goal, GoalType } from '../types';

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Goal) => void;
  removeGoal: (id: string) => void;
  completeGoal: (id: string) => void;
  updateGoalProgress: (id: string, current: number) => void;
  getDailyProgress: () => { goalId: string; title: string; progress: number }[];
  getGoalsByType: (type: GoalType) => Goal[];
  getCompletionPercentage: () => number;
}

// Mock goals matching the designs
const MOCK_GOALS: Goal[] = [
  {
    id: 'goal_001',
    title: 'Consumo de calorías',
    type: 'nutrition',
    current: 1840,
    target: 2400,
    unit: 'kcal',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_002',
    title: 'Sesiones de entrenamiento semanales',
    type: 'training',
    current: 4,
    target: 6,
    unit: 'sesiones',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_003',
    title: 'Ingesta diaria de agua',
    type: 'hydration',
    current: 2.2,
    target: 3.5,
    unit: 'litros',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_004',
    title: 'Horas de sueño',
    type: 'psychology',
    current: 7,
    target: 8,
    unit: 'horas',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_005',
    title: 'Pérdida de peso',
    type: 'nutrition',
    current: 2.5,
    target: 5,
    unit: 'kg',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_006',
    title: 'Pasos diarios',
    type: 'training',
    current: 8500,
    target: 10000,
    unit: 'pasos',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_007',
    title: 'Flexibilidad y movilidad',
    type: 'psychology',
    current: 3,
    target: 5,
    unit: 'sesiones/semana',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
  {
    id: 'goal_008',
    title: 'Aumento de fuerza - Press de Banca',
    type: 'training',
    current: 80,
    target: 100,
    unit: 'kg',
    completed: false,
    createdAt: new Date('2024-02-01'),
  },
];

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: MOCK_GOALS,

  addGoal: (goal: Goal) => {
    set((state) => ({
      goals: [...state.goals, goal],
    }));
  },

  removeGoal: (id: string) => {
    set((state) => ({
      goals: state.goals.filter((goal) => goal.id !== id),
    }));
  },

  completeGoal: (id: string) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id
          ? {
              ...goal,
              completed: true,
              current: goal.target,
            }
          : goal
      ),
    }));
  },

  updateGoalProgress: (id: string, current: number) => {
    set((state) => ({
      goals: state.goals.map((goal) => {
        if (goal.id === id) {
          return {
            ...goal,
            current,
            completed: current >= goal.target,
          };
        }
        return goal;
      }),
    }));
  },

  getDailyProgress: () => {
    return get().goals.map((goal) => ({
      goalId: goal.id,
      title: goal.title,
      progress: Math.min((goal.current / goal.target) * 100, 100),
    }));
  },

  getGoalsByType: (type: GoalType) => {
    return get().goals.filter((goal) => goal.type === type);
  },

  getCompletionPercentage: () => {
    const goals = get().goals;
    if (goals.length === 0) return 0;

    const completedCount = goals.filter((goal) => goal.completed).length;
    return Math.round((completedCount / goals.length) * 100);
  },
}));
