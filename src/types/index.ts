// User Types
export type UserLevel = 'beginner' | 'pro' | 'elite';
export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: UserLevel;
  memberSince: Date;
  gender: Gender;
}

// Body Metrics
export interface BodyMetrics {
  weight: number; // kg
  bodyFat: number; // percentage
  waist: number; // cm
  chest: number; // cm
  hips: number; // cm
  arms: number; // cm
}

// Exercise Types
export type WorkoutType = 'fuerza' | 'cardio' | 'descanso';
export type TrainingDayType = 'fuerza' | 'cardio' | 'descanso' | 'tecnica';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number | string; // Can be "8-10" or "12"
  weight: number | null; // kg, null for bodyweight exercises
  tempo: string; // e.g., "4-0-2-0"
  image: string;
  order: number;
}

export interface Workout {
  id: string;
  title: string;
  type: WorkoutType;
  duration: number; // minutes
  blocks: number;
  calories: number;
  exercises: Exercise[];
}

// Training Session
export interface WorkoutSession {
  id: string;
  workoutId: string;
  startTime: Date;
  endTime: Date | null;
  completedExercises: string[]; // exercise ids
  rpe: number | null; // Rate of Perceived Exertion (1-10)
  notes: string;
  heartRate: number | null;
  caloriesBurned: number | null;
}

// Nutrition Types
export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena';

export interface Meal {
  id: string;
  type: MealType;
  name: string;
  time: string; // HH:MM format
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fats: number; // grams
  image: string;
  completed: boolean;
}

export interface NutritionDay {
  date: Date;
  targetCalories: number;
  meals: Meal[];
  shoppingList: string[];
}

// Goals
export type GoalType = 'nutrition' | 'training' | 'hydration' | 'psychology';

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
  createdAt: Date;
}

// Progress Tracking
export interface ProgressEntry {
  date: Date;
  weight: number;
  bodyFat: number;
  photos: {
    front: string | null;
    side: string | null;
    back: string | null;
  };
  steps: number;
  sleep: number; // hours
  bloodPressure: {
    systolic: number;
    diastolic: number;
  } | null;
  leanMass: number;
}

// Training Program
export interface TrainingDay {
  dayNumber: number;
  title: string;
  type: TrainingDayType;
  workout?: Workout;
}

export interface TrainingPhase {
  id: string;
  name: string;
  number: number;
  description: string;
  progress: number; // percentage (0-100)
  days: TrainingDay[];
}
