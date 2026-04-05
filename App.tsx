import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import RootNavigator from './src/navigation/RootNavigator';

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
