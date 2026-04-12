import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrainingStore } from '../../store/trainingStore';
import type { TrainingPhase } from '../../types';
import { getProfile } from '../../services/profileService';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';

// Color palette
const colors = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  elevated: '#222222',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
};

interface DayCard {
  id: string;
  workoutId: string | null; // matches trainingStore workout ids
  day: number;
  dayName: string;
  title: string;
  duration: number;
  intensity: string;
  type: 'active' | 'rest' | 'normal';
}

const DAY_NAMES = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

function dayCardsFromPhase(phase: TrainingPhase): DayCard[] {
  return phase.days.map((d) => {
    const hasWorkout = !!d.workout;
    const isRest = d.type === 'descanso' || !hasWorkout;
    const workoutId = d.workout?.id ?? null;
    const duration = d.workout?.duration ?? 0;
    const intensity = isRest
      ? 'Descanso'
      : d.workout?.type === 'cardio'
        ? 'Cardio'
        : 'Alta Intensidad';
    const type: DayCard['type'] = isRest
      ? 'rest'
      : d.dayNumber === 1
        ? 'active'
        : 'normal';
    return {
      id: `d-${d.dayNumber}`,
      workoutId,
      day: d.dayNumber,
      dayName: DAY_NAMES[d.dayNumber - 1] ?? '',
      title: d.title,
      duration,
      intensity,
      type,
    };
  });
}

interface Props {
  navigation: any;
}

export const EntrenamientosScreen: React.FC<Props> = ({ navigation }) => {
  const currentPhase = useTrainingStore((s) => s.currentPhase);
  const loadTrainingCatalog = useTrainingStore((s) => s.loadTrainingCatalog);
  const isLoading = useTrainingStore((s) => s.isLoading);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    loadTrainingCatalog();
  }, [loadTrainingCatalog]);

  useEffect(() => {
    getProfile().then((p) => { if (p?.avatar_url) setAvatarUrl(p.avatar_url); });
  }, []);

  const scheduleDays = useMemo(() => {
    if (currentPhase?.days?.length) {
      return dayCardsFromPhase(currentPhase);
    }
    return [];
  }, [currentPhase]);

  const phaseTag = currentPhase
    ? `Fase ${String(currentPhase.number).padStart(2, '0')}`
    : '—';

  const renderDayCard = ({ item }: { item: DayCard }) => {
    const isActive = item.type === 'active';
    const isRest = item.type === 'rest';

    return (
      <View
        style={[
          styles.dayCard,
          isActive && styles.dayCardActive,
          isRest && styles.dayCardRest,
        ]}
      >
        <View
          style={[
            styles.dayNumber,
            isActive && styles.dayNumberActive,
            isRest && styles.dayNumberRest,
          ]}
        >
          <Text
            style={[
              styles.dayNumberText,
              isRest && { color: colors.tertiary },
            ]}
          >
            {String(item.day).padStart(2, '0')}
          </Text>
          <Text
            style={[
              styles.dayNameText,
              isRest && { color: colors.tertiary },
            ]}
          >
            {item.dayName}
          </Text>
        </View>

        <View style={styles.dayContent}>
          <View style={styles.dayTextBlock}>
            <Text style={styles.dayTitle} numberOfLines={1} ellipsizeMode="tail">
              {item.title}
            </Text>
            <View style={styles.dayMeta}>
              <Text style={styles.dayMetaText}>
                {item.duration} MIN
              </Text>
              {!isRest && (
                <Text style={styles.dayIntensity}>{item.intensity}</Text>
              )}
              {isRest && (
                <Text style={[styles.dayIntensity, { color: colors.tertiary }]}>
                  {item.intensity}
                </Text>
              )}
            </View>
          </View>

          {!isRest ? (
            <TouchableOpacity
              style={[styles.dayButton, isActive && styles.dayButtonActive]}
              onPress={() =>
                navigation.navigate('DetalleEntrenamiento', {
                  trainingId: item.workoutId ?? item.id,
                  trainingName: item.title,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.dayButtonText, isActive && styles.dayButtonTextActive]}>
                {isActive ? 'Iniciar' : 'Ver Rutina'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.restIcon}>ZZZ</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + HEADER_ROW_HEIGHT }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={3}>
            {currentPhase
              ? currentPhase.name.toUpperCase()
              : isLoading
                ? 'CARGANDO…'
                : 'PLAN DE ENTRENAMIENTO'}
          </Text>
          <View style={styles.headerTags}>
            <View style={styles.phaseTag}>
              <Text style={styles.phaseTagText}>{phaseTag}</Text>
            </View>
            <Text style={styles.phaseDescription} numberOfLines={2}>
              {currentPhase?.description ??
                (isLoading
                  ? 'Sincronizando con Supabase…'
                  : 'Configurá fase y días en Supabase (training_phases, training_days).')}
            </Text>
          </View>
        </View>

        {/* Phase Progress Card */}
        <View style={styles.progressSection}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressTitle}>
                  Fase de Reconstrucción
                </Text>
                <Text style={styles.progressDate}>01 OCT — 28 OCT</Text>
              </View>
              <Text style={styles.progressPercent}>25%</Text>
            </View>

            <Text style={styles.progressDescription}>
              Enfoque en la densidad muscular y estabilización de cadenas
              cinéticas. Priorizamos el tiempo bajo tensión y la recuperación
              activa entre bloques de alta intensidad.
            </Text>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <LinearGradient
                  colors={[colors.secondary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressBar}
                />
              </View>
            </View>
          </View>

          <View style={styles.sideCards}>
            <View style={styles.goalCard}>
              <Text style={styles.goalLabel}>Meta de la Semana</Text>
              <Text style={styles.goalValue}>Sobrecarga Progresiva +2kg</Text>
            </View>
            <View style={styles.quoteCard}>
              <Text style={styles.quoteLabel}>Recordatorio R3SET</Text>
              <Text style={styles.quoteText}>
                "La consistencia vence a la intensidad pura en el largo plazo."
              </Text>
            </View>
          </View>
        </View>

        {/* Workouts Schedule */}
        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleTitle}>Cronograma Semanal</Text>
          <Text style={styles.scheduleSubtitle}>
            {scheduleDays.length > 0
              ? 'Desliza para explorar'
              : 'Sin sesiones cargadas'}
          </Text>

          {scheduleDays.length === 0 && !isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No hay plan activo</Text>
              <Text style={styles.emptyBody}>
                Ejecutá el seed SQL (013_seed_training_catalog) o cargá training_phases /
                training_days en el dashboard de Supabase. Los ejercicios vienen de la tabla
                exercises enlazada por workout_exercises.
              </Text>
            </View>
          ) : (
            <FlatList
              data={scheduleDays}
              renderItem={renderDayCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.daysList}
            />
          )}
        </View>
      </Animated.ScrollView>

      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => (navigation as any).getParent()?.navigate('HomeStack', { screen: 'Inicio' })}
        onAvatarPress={() => (navigation as any).getParent()?.navigate('HomeStack', { screen: 'Perfil' })}
        avatarUrl={avatarUrl}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    marginBottom: 48,
  },
  headerTitle: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 56,
    letterSpacing: -1.5,
    marginBottom: 16,
  },
  headerTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phaseTag: {
    backgroundColor: '#006875',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  phaseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phaseDescription: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
    gap: 16,
  },
  progressCard: {
    backgroundColor: colors.elevated,
    padding: 24,
    borderRadius: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  progressDate: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressPercent: {
    fontSize: 32,
    fontWeight: '900',
    color: 'rgba(72, 72, 71, 0.3)',
    fontStyle: 'italic',
  },
  progressDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  progressBarContainer: {
    gap: 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    width: '25%',
    height: '100%',
  },
  sideCards: {
    gap: 12,
  },
  goalCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  quoteCard: {
    backgroundColor: colors.elevated,
    padding: 16,
    borderRadius: 8,
  },
  quoteLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scheduleSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  scheduleTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  scheduleSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  emptyBox: {
    backgroundColor: colors.elevated,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  daysList: {
    gap: 16,
  },
  dayCard: {
    backgroundColor: colors.elevated,
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  dayCardActive: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  dayCardRest: {
    borderLeftWidth: 4,
    borderLeftColor: colors.tertiary,
    opacity: 0.8,
  },
  dayNumber: {
    backgroundColor: '#262626',
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '28%',
    justifyContent: 'space-between',
  },
  dayNumberActive: {
    backgroundColor: colors.primary,
  },
  dayNumberRest: {
    backgroundColor: colors.tertiary,
    opacity: 0.2,
  },
  dayNumberText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textTertiary,
    lineHeight: 32,
  },
  dayNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  dayContent: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayTextBlock: {
    flex: 1,
    flexShrink: 1,
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dayMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  dayMetaText: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayIntensity: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.5)',
    borderRadius: 4,
    flexShrink: 0,
  },
  dayButtonActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  dayButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayButtonTextActive: {
    color: '#000',
  },
  restIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.tertiary,
    opacity: 0.4,
  },
});
export default EntrenamientosScreen;
