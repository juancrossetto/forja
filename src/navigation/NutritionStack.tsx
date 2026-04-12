import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NutritionStackParamList } from './types';

import AlimentacionScreen from '../screens/nutrition/AlimentacionScreen';

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
      <Stack.Screen name="Alimentacion" component={AlimentacionScreen} />
    </Stack.Navigator>
  );
};

export default NutritionStack;
