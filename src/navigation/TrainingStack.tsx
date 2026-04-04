import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrainingStackParamList } from './types';

import EntrenamientosScreen from '../screens/training/EntrenamientosScreen';
import DetalleEntrenamientoScreen from '../screens/training/DetalleEntrenamientoScreen';
import EntrenamientoEnVivoScreen from '../screens/training/EntrenamientoEnVivoScreen';
import ResumenEntrenamientoScreen from '../screens/training/ResumenEntrenamientoScreen';

const Stack = createNativeStackNavigator<TrainingStackParamList>();

export const TrainingStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0e0e0e' },
        headerTintColor: '#D1FF26',
        headerShadowVisible: false,
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="Entrenamientos"
        component={EntrenamientosScreen}
      />
      <Stack.Screen
        name="DetalleEntrenamiento"
        component={DetalleEntrenamientoScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          title: '',
        }}
      />
      <Stack.Screen
        name="EntrenamientoEnVivo"
        component={EntrenamientoEnVivoScreen}
        options={{
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="ResumenEntrenamiento"
        component={ResumenEntrenamientoScreen}
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack.Navigator>
  );
};

export default TrainingStack;
