import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Modal } from 'react-native';
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
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAddMenuVisible(false)}
      >
        <AddMenuOverlay
          visible={addMenuVisible}
          onClose={() => setAddMenuVisible(false)}
        />
      </Modal>
    </>
  );
};

export default MainTabs;
