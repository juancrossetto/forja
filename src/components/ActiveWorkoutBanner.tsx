import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrainingStore } from '../store/trainingStore';
import { colors } from '../theme/colors';

const PRIMARY = colors.primary.default;
const TAB_BAR_CONTENT_HEIGHT = 60;
/** Extra gap above tab bar so it reads as “floating” */
const FLOAT_ABOVE_TAB = 10;
/** Minimum horizontal inset from screen edges (avoids crowding back / nav areas) */
const EDGE_INSET_MIN = 10;

function getDeepFocusedRoute(state: any): string | undefined {
  if (!state) return undefined;
  const route = state.routes[state.index];
  if (route?.state) return getDeepFocusedRoute(route.state);
  return route?.name;
}

const HIDDEN_ON = new Set(['EntrenamientoEnVivo', 'ResumenEntrenamiento']);

export const ActiveWorkoutBanner: React.FC = () => {
  const { activeSession, elapsedSeconds, getCurrentWorkout } = useTrainingStore();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const focusedRoute = useNavigationState(getDeepFocusedRoute);
  const isVisible = !!activeSession && !HIDDEN_ON.has(focusedRoute ?? '');

  if (!isVisible) return null;

  const workout = getCurrentWorkout();
  const paddingBottom = Platform.OS === 'ios' ? insets.bottom + 20 : insets.bottom + 10;
  const bannerBottom =
    paddingBottom + TAB_BAR_CONTENT_HEIGHT + FLOAT_ABOVE_TAB;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handlePress = () => {
    navigation.navigate('Main' as any, {
      screen: 'TrainingStack',
      params: {
        screen: 'EntrenamientoEnVivo',
        params: {
          trainingId: activeSession.workoutId,
          trainingName: workout?.title ?? 'Entrenamiento',
        },
      },
    });
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.floatShell,
        {
          bottom: bannerBottom,
          left: Math.max(EDGE_INSET_MIN, insets.left + 6),
          right: Math.max(EDGE_INSET_MIN, insets.right + 6),
        },
      ]}
    >
      <TouchableOpacity
        style={styles.banner}
        onPress={handlePress}
        activeOpacity={0.88}
      >
        <View style={styles.rim} />
        <View style={styles.left}>
          <View style={styles.pulseWrap}>
            <View style={styles.pulseDot} />
          </View>
          <View style={styles.textBlock}>
            <Text style={styles.label}>EN CURSO</Text>
            <Text style={styles.name} numberOfLines={1}>
              {workout?.title ?? 'Entrenamiento'}
            </Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={12} color={colors.primary.text} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatShell: {
    position: 'absolute',
    zIndex: 50,
  },
  banner: {
    height: 42,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
    // Separación del fondo oscuro
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 14,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    pointerEvents: 'none',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  pulseWrap: {
    width: 8,
    height: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary.text,
    opacity: 0.55,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 7,
    fontWeight: '800',
    color: 'rgba(0,0,0,0.48)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary.text,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  timer: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.primary.text,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  chevronWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ActiveWorkoutBanner;
