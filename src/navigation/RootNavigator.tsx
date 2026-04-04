import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkSession = useAuthStore((state) => state.checkSession);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Restaura la sesión desde secure storage al iniciar la app
    checkSession().finally(() => setIsReady(true));
  }, []);

  // Mientras verifica la sesión, muestra un spinner en pantalla negra
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0e0e0e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#D1FF26" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0e0e0e' },
        animation: 'fade',
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={AuthStack} />
      ) : (
        <Stack.Screen name="Main" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
