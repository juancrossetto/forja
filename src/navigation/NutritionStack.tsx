import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NutritionStackParamList } from './types';

import ComidasScreen from '../screens/nutrition/ComidasScreen';

const Stack = createNativeStackNavigator<NutritionStackParamList>();

export const NutritionStack: React.FC = () => {
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
      <Stack.Screen name="Comidas" component={ComidasScreen} />
    </Stack.Navigator>
  );
};

export default NutritionStack;
