import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from './Icon';

const PRIMARY = '#D1FF26';
const INACTIVE_COLOR = 'rgba(255, 255, 255, 0.40)';
const ACTIVE_COLOR = PRIMARY;
const TAB_BG = 'rgba(14, 14, 14, 0.92)';

interface TabItem {
  name: string;
  label: string;
  iconName: string;
  isFab?: boolean;
}

const TABS: TabItem[] = [
  { name: 'HomeStack', label: 'Inicio', iconName: 'home' },
  { name: 'TrainingStack', label: 'Entreno', iconName: 'fitness' },
  { name: 'AddMenu', label: '', iconName: 'add', isFab: true },
  { name: 'NutritionStack', label: 'Comidas', iconName: 'restaurant' },
  { name: 'ProgressStack', label: 'Progreso', iconName: 'stats-chart' },
];

interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress?: () => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  navigation,
  onAddPress,
}) => {
  const paddingBottom = Platform.OS === 'ios' ? 24 : 12;

  return (
    <View style={[styles.container, { paddingBottom }]}>
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const tab = TABS[index];
          if (!tab) return null;

          const onPress = () => {
            if (tab.isFab) {
              onAddPress?.();
              return;
            }

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (tab.isFab) {
            return (
              <View key={route.key} style={styles.fabWrapper}>
                <TouchableOpacity
                  onPress={onPress}
                  style={styles.fabButton}
                  activeOpacity={0.8}
                >
                  <Icon name="add" size={30} color="#0e0e0e" />
                </TouchableOpacity>
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.iconName}
                size={22}
                color={isFocused ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR },
                ]}
              >
                {tab.label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: TAB_BG,
    borderTopWidth: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    height: 60,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PRIMARY,
    marginTop: 3,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  } as ViewStyle,
});

export default CustomTabBar;
