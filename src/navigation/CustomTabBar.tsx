import React, { useState, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  SlidingTabHighlight,
  TabItemMotion,
  type TabSlotLayout,
} from '../components/navigation/SlidingTabHighlight';
import { navigationChrome } from '../theme/navigationChrome';
import { colors } from '../theme/colors';

const INACTIVE_COLOR = navigationChrome.inactiveIcon;
const ACTIVE_COLOR = navigationChrome.activeIcon;

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItem {
  name: string;
  label: string;
  iconActive: IoniconsName;
  iconInactive: IoniconsName;
  isFab?: boolean;
}

const TABS: TabItem[] = [
  { name: 'HomeStack', label: 'Comunidad', iconActive: 'people', iconInactive: 'people-outline' },
  { name: 'TrainingStack', label: 'Entreno', iconActive: 'barbell', iconInactive: 'barbell-outline' },
  { name: 'AddMenu', label: '', iconActive: 'add', iconInactive: 'add', isFab: true },
  { name: 'NutritionStack', label: 'Alimentación', iconActive: 'restaurant', iconInactive: 'restaurant-outline' },
  { name: 'ProgressStack', label: 'Progreso', iconActive: 'stats-chart', iconInactive: 'stats-chart-outline' },
];

interface CustomTabBarProps extends BottomTabBarProps {
  onAddPress?: () => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  onAddPress,
}) => {
  const paddingBottom = Platform.OS === 'ios' ? 24 : 12;
  const [barWidth, setBarWidth] = useState(0);
  const [slotLayouts, setSlotLayouts] = useState<Array<TabSlotLayout | null>>(() =>
    Array(TABS.length).fill(null),
  );

  const onSlotLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setSlotLayouts((prev) => {
      const next = [...prev];
      next[index] = { x, y, width, height };
      return next;
    });
  }, []);

  const focusedDescriptor = descriptors[state.routes[state.index]?.key];
  const tabBarStyle = focusedDescriptor?.options?.tabBarStyle as { display?: string } | undefined;
  if (tabBarStyle?.display === 'none') return null;

  return (
    <View style={[styles.shell, { paddingBottom }]}>
      <View style={styles.pillWrap}>
        <View style={styles.pillContainer}>
          <View
            style={styles.tabBarContent}
            onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          >
            <SlidingTabHighlight
              tabCount={state.routes.length}
              activeIndex={state.index}
              containerWidth={barWidth}
              slotLayouts={slotLayouts}
            />
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
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              };

              if (tab.isFab) {
                return (
                  <View
                    key={route.key}
                    style={styles.fabWrapper}
                    onLayout={(e) => onSlotLayout(index, e)}
                  >
                    <TouchableOpacity onPress={onPress} style={styles.fabButton} activeOpacity={0.8}>
                      <Ionicons name="add" size={32} color={colors.primary.text} />
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  style={styles.tabButton}
                  activeOpacity={0.85}
                  onLayout={(e) => onSlotLayout(index, e)}
                >
                  <TabItemMotion isFocused={isFocused} style={styles.tabMotionInner} variant="subtle">
                    <Ionicons
                      name={isFocused ? tab.iconActive : tab.iconInactive}
                      size={22}
                      color={isFocused ? '#FFFFFF' : INACTIVE_COLOR}
                    />
                    <Text style={[styles.tabLabel, { color: isFocused ? '#FFFFFF' : INACTIVE_COLOR }]}>
                      {tab.label}
                    </Text>
                  </TabItemMotion>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    backgroundColor: navigationChrome.shellBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: navigationChrome.shellBorderTop,
  },
  pillWrap: {
    paddingHorizontal: navigationChrome.screenEdgeInset,
    paddingTop: 6,
    paddingBottom: 4,
  },
  /** Sin overflow:hidden para no recortar el FAB que sobresale */
  pillContainer: {
    ...navigationChrome.pillContainer,
  },
  /** Highlight + ítems comparten este contenedor para que onLayout encaje con la pastilla */
  tabBarContent: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingHorizontal: navigationChrome.containerPaddingH,
    paddingVertical: navigationChrome.containerPaddingV,
    minHeight: 54,
    zIndex: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 2,
  },
  tabMotionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  fabWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
    marginTop: -18,
    zIndex: 2,
  },
  fabButton: {
    width: 52,
    height: 44,
    borderRadius: 12,
    backgroundColor: navigationChrome.activeIcon,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: navigationChrome.activeIcon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  } as ViewStyle,
});

export default CustomTabBar;
