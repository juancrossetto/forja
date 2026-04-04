import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

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

/**
 * Load custom fonts for The Kinetic Monolith design system
 * Space Grotesk (Display), Manrope (Body), Lexend (Labels)
 *
 * NOTE: Download fonts from Google Fonts and place .ttf files in /assets/fonts/
 * For development, the app will fall back to system fonts if custom fonts are missing.
 */
const loadFonts = async () => {
  try {
    await Font.loadAsync({
      'SpaceGrotesk': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
      'SpaceGrotesk-Bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
      'SpaceGrotesk-Medium': require('./assets/fonts/SpaceGrotesk-Medium.ttf'),
      'Manrope': require('./assets/fonts/Manrope-Regular.ttf'),
      'Manrope-Medium': require('./assets/fonts/Manrope-Medium.ttf'),
      'Manrope-SemiBold': require('./assets/fonts/Manrope-SemiBold.ttf'),
      'Manrope-Bold': require('./assets/fonts/Manrope-Bold.ttf'),
      'Lexend': require('./assets/fonts/Lexend-Regular.ttf'),
      'Lexend-Medium': require('./assets/fonts/Lexend-Medium.ttf'),
      'Lexend-SemiBold': require('./assets/fonts/Lexend-SemiBold.ttf'),
    });
  } catch (e) {
    // In development, we can continue without custom fonts
    console.warn('Custom fonts not found. Using system fonts as fallback:', e);
  }
};

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const prepare = async () => {
      try {
        await loadFonts();
      } catch (e) {
        console.warn('Error preparing app:', e);
      } finally {
        setAppIsReady(true);
      }
    };

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <View style={styles.container} onLayout={onLayoutRootView}>
      <StatusBar barStyle="light-content" backgroundColor="#0e0e0e" />
      <NavigationContainer theme={DarkTheme}>
        <RootNavigator />
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
});
