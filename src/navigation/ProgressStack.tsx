import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from './types';

import ProgresoScreen from '../screens/progress/ProgresoScreen';
import CargarFotosScreen from '../screens/photos/CargarFotosScreen';
import PesoYMedidasScreen from '../screens/measurements/PesoYMedidasScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export const ProgressStack: React.FC = () => {
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
      <Stack.Screen name="Progreso" component={ProgresoScreen} />
      <Stack.Screen
        name="CargarFotos"
        component={CargarFotosScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Screen
        name="PesoYMedidas"
        component={PesoYMedidasScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default ProgressStack;
