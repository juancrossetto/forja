import React, { useState, useCallback, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Modal } from 'react-native';
import { useNavigation, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { MainTabParamList } from './types';

import HomeStack from './HomeStack';
import TrainingStack from './TrainingStack';
import NutritionStack from './NutritionStack';
import ProgressStack from './ProgressStack';
import CustomTabBar from './CustomTabBar';
import { AddMenuOverlay } from '../screens/home/AddMenuOverlay';
import { ActiveWorkoutBanner } from '../components/ActiveWorkoutBanner';
import { WorkoutLiveTimer } from '../components/WorkoutLiveTimer';
import { useTrainingStore } from '../store/trainingStore';
import { useAuthStore } from '../store/authStore';
import { startHealthSync, stopHealthSync } from '../services/healthService';

// Empty placeholder screen for the Add tab (the actual UI is a modal)
const EmptyScreen = () => null;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const navigation = useNavigation<any>();
  const loadTrainingCatalog = useTrainingStore((s) => s.loadTrainingCatalog);
  const setSteps        = useAuthStore((s) => s.setSteps);
  const setWatchConnected = useAuthStore((s) => s.setWatchConnected);

  useEffect(() => {
    void loadTrainingCatalog();
  }, [loadTrainingCatalog]);

  // Global health sync — single Pedometer subscription for the whole app lifetime
  useEffect(() => {
    startHealthSync((partial) => {
      if (partial.steps != null) setSteps(partial.steps);
    }).then((started) => {
      if (started) setWatchConnected(true);
    });
    return () => stopHealthSync();
  }, [setSteps, setWatchConnected]);

  const closeMenu = useCallback(() => setAddMenuVisible(false), []);

  const navigateFromMenu = useCallback((stack: string, screen: string) => {
    setAddMenuVisible(false);
    setTimeout(() => {
      // Navegar a través del root → Main → stack → screen
      navigation.navigate('Main' as any, { screen: stack, params: { screen } });
    }, 100);
  }, [navigation]);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            onAddPress={() => setAddMenuVisible(true)}
          />
        )}
      >
        <Tab.Screen
          name="HomeStack"
          component={HomeStack}
          options={{ title: 'Inicio' }}
        />
        <Tab.Screen
          name="TrainingStack"
          component={TrainingStack}
          options={({ route }) => {
            const screen = getFocusedRouteNameFromRoute(route);
            const hideTabBar = screen === 'EntrenamientoEnVivo' || screen === 'ResumenEntrenamiento';
            return {
              title: 'Entreno',
              tabBarStyle: hideTabBar ? { display: 'none' } : undefined,
            };
          }}
        />
        <Tab.Screen
          name="AddMenu"
          component={EmptyScreen}
          options={{ title: '' }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setAddMenuVisible(true);
            },
          }}
        />
        <Tab.Screen
          name="NutritionStack"
          component={NutritionStack}
          options={{ title: 'Comidas' }}
        />
        <Tab.Screen
          name="ProgressStack"
          component={ProgressStack}
          options={{ title: 'Progreso' }}
        />
      </Tab.Navigator>

      <WorkoutLiveTimer />
      <ActiveWorkoutBanner />

      <Modal
        visible={addMenuVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <AddMenuOverlay
          visible={addMenuVisible}
          onClose={closeMenu}
          onSelectTraining={() => navigateFromMenu('TrainingStack', 'Entrenamientos')}
          onSelectFood={() => navigateFromMenu('NutritionStack', 'RegistrarComida')}
          onSelectWater={() => navigateFromMenu('HomeStack', 'Hidratacion')}
          onSelectPhotos={() => navigateFromMenu('HomeStack', 'CargarFotos')}
          onSelectMeasurements={() => navigateFromMenu('HomeStack', 'PesoYMedidas')}
          onSelectCardio={() => navigateFromMenu('HomeStack', 'RegistroCardio')}
        />
      </Modal>
    </>
  );
};

export default MainTabs;
