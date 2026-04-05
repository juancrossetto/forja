import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';

import HomeScreen from '../screens/home/HomeScreen';
import MetasScreen from '../screens/home/MetasScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CargarFotosScreen from '../screens/photos/CargarFotosScreen';
import PesoYMedidasScreen from '../screens/measurements/PesoYMedidasScreen';
import HidratacionScreen from '../screens/hydration/HidratacionScreen';

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
      <Stack.Screen
        name="Metas"
        component={MetasScreen}
        options={{
          headerShown: true,
          title: 'Mis Metas',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{
          headerShown: true,
          title: 'Perfil',
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="CargarFotos"
        component={CargarFotosScreen}
        options={{ presentation: 'modal', headerShown: false }}
      />
      <Stack.Group
        screenOptions={{
          presentation: 'modal',
          headerShown: true,
          headerTransparent: true,
          headerTintColor: '#D1FF26',
        }}
      >
        <Stack.Screen
          name="PesoYMedidas"
          component={PesoYMedidasScreen}
          options={{ title: 'Peso y Medidas' }}
        />
        <Stack.Screen
          name="Hidratacion"
          component={HidratacionScreen}
          options={{ title: 'Hidratación' }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default HomeStack;
