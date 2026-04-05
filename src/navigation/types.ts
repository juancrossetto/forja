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
    duration: number;
    calories: number;
    exercises: number;
  };
};

// Progress Stack Types
export type ProgressStackParamList = {
  Progreso: undefined;
  CargarFotos: undefined;
  PesoYMedidas: undefined;
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
  Inicio: undefined;
  Metas: undefined;
  Perfil: undefined;
  CargarFotos: undefined;
  PesoYMedidas: undefined;
  Hidratacion: undefined;
};

// Nutrition Stack Types
export type NutritionStackParamList = {
  Comidas: undefined;
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
