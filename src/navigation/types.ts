import type { NavigatorScreenParams } from '@react-navigation/native';

// Auth Stack Types
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

// Training Stack Types
export type TrainingStackParamList = {
  Entrenamientos: undefined;
  DetalleEntrenamiento: {
    trainingId: string;
    trainingName: string;
  };
  EntrenamientoEnVivo: {
    trainingId: string;
    trainingName: string;
  };
  ResumenEntrenamiento: {
    trainingId: string;
    trainingName: string;
    durationSeconds: number;
    calories: number;
    /** Ejercicios completados en esta sesión */
    exercises: number;
    /** Total de ejercicios del workout (para barra de progreso) */
    totalExercises?: number;
    /** Row created by startActiveSession; final persist updates this row once. */
    sessionLogId?: string | null;
    completedExerciseIds?: string[];
    workoutType?: string | null;
  };
};

// Progress Stack Types
export type ProgressStackParamList = {
  Progreso: undefined;
  CargarFotos: undefined;
  PesoYMedidas: undefined;
  PesoCorporalDetail: undefined;
};

// Profile Stack Types
export type ProfileStackParamList = {
  Perfil: undefined;
  Metas: undefined;
};

// Main Bottom Tabs Types
export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  TrainingStack: NavigatorScreenParams<TrainingStackParamList>;
  AddMenu: undefined;
  NutritionStack: NavigatorScreenParams<NutritionStackParamList>;
  ProgressStack: NavigatorScreenParams<ProgressStackParamList>;
};

// Home Stack Types (for Home navigation from Home tab)
export type HomeStackParamList = {
  Comunidad: undefined;
  Inicio: undefined;
  Metas: undefined;
  Perfil: undefined;
  CargarFotos: undefined;
  PesoYMedidas: undefined;
  Hidratacion: { date?: string } | undefined;
  RegistroCardio: undefined;
};

// Nutrition Stack Types
export type AlimentacionSubTab = 'lista' | 'buscar' | 'escaner' | 'voz';

export type NutritionStackParamList = {
  Alimentacion:
    | {
        initialSubTab?: AlimentacionSubTab;
        /** Prefill búsqueda (p. ej. voz → Buscar) */
        buscarQuery?: string;
      }
    | undefined;
  DetalleComida?: {
    mealId: string;
    mealName: string;
  };
};

// Root Navigator Types
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  AddMenuOverlay: undefined;
};

// Navigation prop types for screens
export type AuthScreenProps<T extends keyof AuthStackParamList> = {
  navigation: any;
  route: any;
};

export type MainScreenProps<T extends keyof MainTabParamList> = {
  navigation: any;
  route: any;
};
