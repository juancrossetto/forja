import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';

import HomeScreen from '../screens/home/HomeScreen';
import MetasScreen from '../screens/home/MetasScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CargarFotosScreen from '../screens/photos/CargarFotosScreen';
import PesoYMedidasScreen from '../screens/measurements/PesoYMedidasScreen';
import HidratacionScreen from '../screens/hydration/HidratacionScreen';
import RegistroCardioScreen from '../screens/cardio/RegistroCardioScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStack: React.FC = () => {
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
      <Stack.Screen name="Inicio" component={HomeScreen} />
      <Stack.Screen name="Metas" component={MetasScreen} />
      <Stack.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CargarFotos"
        component={CargarFotosScreen}
        options={{ presentation: 'fullScreenModal', headerShown: false }}
      />
      <Stack.Group
        screenOptions={{
          presentation: 'fullScreenModal',
          headerShown: false,
        }}
      >
        <Stack.Screen name="PesoYMedidas" component={PesoYMedidasScreen} />
        <Stack.Screen name="Hidratacion" component={HidratacionScreen} />
        <Stack.Screen name="RegistroCardio" component={RegistroCardioScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default HomeStack;
