import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTrainingStore } from '../../store/trainingStore';
import { radius } from '../../theme/radius';

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

interface ExerciseRow {
  id: string;
  number: string;
  name: string;
  sets: number;
  reps: string;
  image: string;
}

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1574680178050-55a41cebbe7f?q=80&w=400';

interface Props {
  navigation: any;
  route: any;
}

export const DetalleEntrenamientoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { trainingId, trainingName } = route.params ?? {};
  const startWorkout = useTrainingStore((s) => s.startWorkout);
  const hydrateWorkoutExercisesFromCatalog = useTrainingStore(
    (s) => s.hydrateWorkoutExercisesFromCatalog,
  );
  const workout = useTrainingStore((s) =>
    trainingId ? s.workouts.find((w) => w.id === trainingId) : undefined,
  );
  const insets = useSafeAreaInsets();
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (trainingId) {
      void hydrateWorkoutExercisesFromCatalog(trainingId);
    }
  }, [trainingId, hydrateWorkoutExercisesFromCatalog]);

  const exerciseRows = useMemo((): ExerciseRow[] => {
    const list = workout?.exercises ?? [];
    if (!list.length) {
      return [
        {
          id: 'empty',
          number: '—',
          name: 'Sin bloques en esta sesión',
          sets: 0,
          reps: '—',
          image: HERO_IMAGE,
        },
      ];
    }
    const total = list.length;
    return list.map((ex, i) => ({
      id: ex.id,
      number: `${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`,
      name: ex.name,
      sets: ex.sets,
      reps: String(ex.reps),
      image: ex.image || HERO_IMAGE,
    }));
  }, [workout]);

  const typeLabel =
    workout?.type === 'cardio'
      ? 'Cardio'
      : workout?.type === 'descanso'
        ? 'Descanso'
        : 'Fuerza';

  const heroUri =
    exerciseRows.find((r) => r.id !== 'empty')?.image ?? HERO_IMAGE;

  // Tab bar height: 60px items + 24px paddingBottom (iOS) or 12px (Android)
  const TAB_BAR_HEIGHT = 60 + (Platform.OS === 'ios' ? 24 : 12);
  const buttonBottom = insets.bottom + TAB_BAR_HEIGHT;

  const handleIniciar = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      await startWorkout(trainingId);
    } catch (e) {
      console.error('handleIniciar:', e);
    }
    navigation.navigate('EntrenamientoEnVivo', {
      trainingId: trainingId ?? '',
      trainingName: trainingName ?? workout?.title ?? 'Entrenamiento',
    });
    setIsStarting(false);
  };

  const renderExerciseCard = ({ item }: { item: ExerciseRow }) => {
    if (item.id === 'empty') {
      return (
        <View style={styles.exercisePlaceholder}>
          <Text style={styles.placeholderText}>{item.name}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.exerciseThumbnail}
          contentFit="cover"
          transition={150}
        />
        <View style={styles.exerciseOverlay}>
          <Text style={styles.playIcon}>▶</Text>
        </View>

        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseNumber}>{item.number}</Text>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseMeta}>
            {item.sets} series × {item.reps} reps
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: heroUri }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', colors.bg]}
            style={styles.heroGradient}
          />

          <View style={styles.heroContent}>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{typeLabel}</Text>
              </View>
              <View style={styles.tagSecondary}>
                <Text style={styles.tagTextSecondary}>Plan activo</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              {(trainingName ?? workout?.title ?? 'Entrenamiento').toUpperCase()}
            </Text>

            <View style={styles.heroMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Duración</Text>
                <Text style={styles.metaValue}>
                  {workout?.duration ?? 45} MIN
                </Text>
              </View>
              <View style={styles.metaDivider} />
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Ejercicios</Text>
                <Text style={styles.metaValue}>
                  {workout?.exercises?.length ?? 0} BLOQUES
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsSection}>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionLabel}>Instrucciones de Sesión</Text>
            <Text style={styles.instructionText}>
              Mantén el foco en el <Text style={styles.instructionHighlight}>
                tempo controlada (3-1-1)
              </Text>
              . Descansa 60 segundos entre series. La hidratación debe ser
              constante pero en sorbos pequeños. Recuerda: la técnica precede a
              la carga.
            </Text>
          </View>
        </View>

        {/* Exercise List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Contenido del Entrenamiento</Text>

          <FlatList
            data={exerciseRows}
            renderItem={renderExerciseCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.exercisesList}
          />
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{workout?.calories ?? '—'}</Text>
            <Text style={styles.statLabel}>Kcal est.</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>❤️</Text>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>BPM</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={styles.statValue}>{workout?.blocks ?? '—'}</Text>
            <Text style={styles.statLabel}>Bloques</Text>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Button */}
      <View style={[styles.fixedButtonContainer, { bottom: buttonBottom }]}>
        <TouchableOpacity
          style={[styles.startButton, isStarting && styles.startButtonLoading]}
          onPress={handleIniciar}
          disabled={isStarting}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>
            {isStarting ? 'Preparando...' : 'Iniciar Entrenamiento'}
          </Text>
          <Text style={styles.playArrow}>{isStarting ? '⏳' : '▶'}</Text>
        </TouchableOpacity>
      </View>
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
  heroContainer: {
    position: 'relative',
    height: 397,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevated,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#006875',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tagSecondary: {
    backgroundColor: colors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.xs,
  },
  tagTextSecondary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.primary,
    textTransform: 'uppercase',
    lineHeight: 48,
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  metaDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(72, 72, 71, 0.3)',
  },
  instructionsSection: {
    paddingHorizontal: 24,
    marginTop: 32,
    marginBottom: 48,
  },
  instructionCard: {
    backgroundColor: colors.elevated,
    borderLeftWidth: 2,
    borderLeftColor: colors.primary,
    padding: 24,
    borderRadius: radius.sm,
  },
  instructionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  instructionHighlight: {
    color: colors.secondary,
    fontWeight: '700',
  },
  exercisesSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 32,
  },
  exercisesList: {
    gap: 16,
  },
  exerciseCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  exerciseThumbnail: {
    width: 128,
    height: 96,
    backgroundColor: colors.elevated,
  },
  exerciseOverlay: {
    position: 'absolute',
    width: 128,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playIcon: {
    fontSize: 28,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  exerciseInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  exerciseNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 4,
    lineHeight: 20,
    flexShrink: 1,
  },
  exerciseMeta: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  exercisePlaceholder: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(72, 72, 71, 0.3)',
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 96,
  },
  placeholderText: {
    fontSize: 10,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.sm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '400',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  bottomPadding: {
    height: 120,
  },
  fixedButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.bg,
  },
  startButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  startButtonLoading: {
    opacity: 0.65,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  playArrow: {
    fontSize: 18,
    color: '#000',
    fontWeight: 'bold',
  },
});
export default DetalleEntrenamientoScreen;
