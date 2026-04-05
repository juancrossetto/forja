import React, { useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList } from './types';

import HomeStack from './HomeStack';
import TrainingStack from './TrainingStack';
import NutritionStack from './NutritionStack';
import ProgressStack from './ProgressStack';
import CustomTabBar from './CustomTabBar';
import { AddMenuOverlay } from '../screens/home/AddMenuOverlay';

// Empty placeholder screen for the Add tab (the actual UI is a modal)
const EmptyScreen = () => null;

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs: React.FC = () => {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const navigation = useNavigation<any>();

  const closeMenu = useCallback(() => setAddMenuVisible(false), []);

  const navigateFromMenu = useCallback((stack: string, screen: string) => {
    setAddMenuVisible(false);
    setTimeout(() => {
      navigation.navigate(stack, { screen });
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
          options={{ title: 'Entreno' }}
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
          onSelectFood={() => navigateFromMenu('NutritionStack', 'Comidas')}
          onSelectWater={() => navigateFromMenu('HomeStack', 'Hidratacion')}
          onSelectPhotos={() => navigateFromMenu('HomeStack', 'CargarFotos')}
          onSelectMeasurements={() => navigateFromMenu('HomeStack', 'PesoYMedidas')}
        />
      </Modal>
    </>
  );
};

export default MainTabs;
