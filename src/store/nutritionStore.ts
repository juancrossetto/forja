import { create } from 'zustand';
import { Meal, NutritionDay, MealType } from '../types';

interface NutritionState {
  currentDay: NutritionDay;
  meals: Meal[];
  shoppingList: string[];
  targetCalories: number;
  toggleMealComplete: (id: string) => void;
  addMeal: (meal: Meal) => void;
  removeMeal: (id: string) => void;
  getWeekDays: () => NutritionDay[];
  getTotalCalories: () => number;
  getTotalProtein: () => number;
  getTotalCarbs: () => number;
  getTotalFats: () => number;
  getCompletionPercentage: () => number;
}

// Mock meals for the day
const MOCK_MEALS: Meal[] = [
  {
    id: 'meal_001',
    type: 'desayuno',
    name: 'Avena con frutas',
    time: '07:00',
    calories: 420,
    protein: 15,
    carbs: 65,
    fats: 8,
    image: 'https://images.unsplash.com/photo-1495214521206-1742f15f60f9?w=400',
    completed: true,
  },
  {
    id: 'meal_002',
    type: 'almuerzo',
    name: 'Pollo grillado con arroz integral',
    time: '12:30',
    calories: 680,
    protein: 65,
    carbs: 58,
    fats: 12,
    image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400',
    completed: true,
  },
  {
    id: 'meal_003',
    type: 'merienda',
    name: 'Yogurt griego con granola',
    time: '16:00',
    calories: 280,
    protein: 20,
    carbs: 35,
    fats: 6,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291840?w=400',
    completed: false,
  },
  {
    id: 'meal_004',
    type: 'cena',
    name: 'Salmón a la mantequilla con brócoli',
    time: '19:30',
    calories: 550,
    protein: 58,
    carbs: 25,
    fats: 20,
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    completed: false,
  },
];

// Mock shopping list
const MOCK_SHOPPING_LIST: string[] = [
  'Avena (1kg)',
  'Plátanos (6 unidades)',
  'Fresas (500g)',
  'Pollo pechuga (1.5kg)',
  'Arroz integral (1kg)',
  'Yogurt griego (1L)',
  'Granola (500g)',
  'Salmón fresco (400g)',
  'Brócoli (2 cabezas)',
  'Aceite de oliva',
  'Limones (4 unidades)',
  'Ajo (1 cabeza)',
  'Huevos (12 unidades)',
  'Leche descremada (1L)',
  'Pan integral (1 pan)',
];

// Create today's nutrition day
const createTodayNutritionDay = (): NutritionDay => ({
  date: new Date(),
  targetCalories: 2400,
  meals: MOCK_MEALS,
  shoppingList: MOCK_SHOPPING_LIST,
});

export const useNutritionStore = create<NutritionState>((set, get) => ({
  currentDay: createTodayNutritionDay(),
  meals: MOCK_MEALS,
  shoppingList: MOCK_SHOPPING_LIST,
  targetCalories: 2400,

  toggleMealComplete: (id: string) => {
    set((state) => ({
      meals: state.meals.map((meal) =>
        meal.id === id ? { ...meal, completed: !meal.completed } : meal
      ),
      currentDay: {
        ...state.currentDay,
        meals: state.currentDay.meals.map((meal) =>
          meal.id === id ? { ...meal, completed: !meal.completed } : meal
        ),
      },
    }));
  },

  addMeal: (meal: Meal) => {
    set((state) => ({
      meals: [...state.meals, meal],
      currentDay: {
        ...state.currentDay,
        meals: [...state.currentDay.meals, meal],
      },
    }));
  },

  removeMeal: (id: string) => {
    set((state) => ({
      meals: state.meals.filter((meal) => meal.id !== id),
      currentDay: {
        ...state.currentDay,
        meals: state.currentDay.meals.filter((meal) => meal.id !== id),
      },
    }));
  },

  getWeekDays: () => {
    const weekDays: NutritionDay[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      weekDays.push({
        date,
        targetCalories: 2400,
        meals: i === 0 ? MOCK_MEALS : [], // Today has meals, others are empty for mock
        shoppingList: i === 0 ? MOCK_SHOPPING_LIST : [],
      });
    }

    return weekDays;
  },

  getTotalCalories: () => {
    return get().meals.reduce((total, meal) => total + meal.calories, 0);
  },

  getTotalProtein: () => {
    return get().meals.reduce((total, meal) => total + meal.protein, 0);
  },

  getTotalCarbs: () => {
    return get().meals.reduce((total, meal) => total + meal.carbs, 0);
  },

  getTotalFats: () => {
    return get().meals.reduce((total, meal) => total + meal.fats, 0);
  },

  getCompletionPercentage: () => {
    const { meals } = get();
    if (meals.length === 0) return 0;

    const completedCount = meals.filter((meal) => meal.completed).length;
    return Math.round((completedCount / meals.length) * 100);
  },
}));
