import React from 'react';
import { StatusBar, View, ActivityIndicator, LogBox } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import RootNavigator from './src/navigation/RootNavigator';

if (__DEV__) {
  // GoTrue hace console.error al refrescar un refresh token inválido/expirado; es esperable tras limpiar sesión o cambiar proyecto.
  LogBox.ignoreLogs([
    'Invalid Refresh Token',
    'Refresh Token Not Found',
    '[AuthApiError: Invalid Refresh Token',
  ]);
}

const DarkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#D1FF26',
    background: '#0e0e0e',
    card: '#1a1a1a',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.06)',
    notification: '#D1FF26',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({ BebasNeue_400Regular });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0e0e0e', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#D1FF26" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0e0e0e" />
      <NavigationContainer theme={DarkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </>
  );
}
