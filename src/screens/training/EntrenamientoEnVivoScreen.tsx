import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTrainingStore } from '../../store/trainingStore';

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

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?q=80&w=600';

interface Props {
  navigation: any;
  route: any;
}

export const EntrenamientoEnVivoScreen: React.FC<Props> = ({ navigation, route }) => {
  const { trainingId, trainingName } = route.params ?? {};

  const {
    activeSession,
    sessionLogId,
    getCurrentWorkout,
    completeExercise,
    cancelWorkout,
    clearSession,
    initActiveSession,
    elapsedSeconds,
    isWorkoutTimerPaused,
    setWorkoutTimerPaused,
  } = useTrainingStore();

  const workout = getCurrentWorkout();
  const exercises = workout?.exercises ?? [];
  const completedCount = activeSession?.completedExercises.length ?? 0;
  const currentExercise = exercises[completedCount] ?? null;
  const nextExercise = exercises[completedCount + 1] ?? null;
  const completionPercent =
    exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;
  const allDone = exercises.length > 0 && completedCount >= exercises.length;

  // Stable ref used by intervals to always read the latest values
  const stateRef = useRef({
    sessionLogId,
    elapsed: elapsedSeconds,
    completed: activeSession?.completedExercises ?? [] as string[],
  });
  stateRef.current = {
    sessionLogId,
    elapsed: elapsedSeconds,
    completed: activeSession?.completedExercises ?? [],
  };

  // Restore session from Supabase if there is none in memory
  useEffect(() => {
    if (!activeSession) {
      initActiveSession();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const formatTime = (s: number): string => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleCompleteExercise = useCallback(() => {
    if (!currentExercise || allDone) return;
    completeExercise(currentExercise.id);
  }, [currentExercise, allDone, completeExercise]);

  // Finish workout → save final state → clear store → navigate to summary
  const handleFinish = useCallback(() => {
    setWorkoutTimerPaused(true);
    const { elapsed, completed } = stateRef.current;
    const sid = stateRef.current.sessionLogId;
    clearSession();
    navigation.replace('ResumenEntrenamiento', {
      trainingId: trainingId ?? '',
      trainingName: trainingName ?? workout?.title ?? '',
      durationSeconds: Math.max(0, elapsed),
      calories: workout?.calories ?? 0,
      exercises: completed.length,
      totalExercises: exercises.length,
      sessionLogId: sid,
      completedExerciseIds: [...completed],
      workoutType: workout?.type ?? null,
    });
  }, [navigation, trainingId, trainingName, workout, clearSession, setWorkoutTimerPaused]);

  // Abandon workout with confirmation
  const handleCancel = useCallback(() => {
    Alert.alert(
      'Abandonar entrenamiento',
      '¿Querés cancelar la sesión? El progreso no se guardará.',
      [
        { text: 'Continuar', style: 'cancel' },
        {
          text: 'Abandonar',
          style: 'destructive',
          onPress: async () => {
            setWorkoutTimerPaused(true);
            await cancelWorkout();
            navigation.goBack();
          },
        },
      ]
    );
  }, [cancelWorkout, navigation, setWorkoutTimerPaused]);

  return (
    <View style={styles.container}>
      {/* Hero image / exercise visual */}
      <ImageBackground
        source={{ uri: currentExercise?.image ?? FALLBACK_IMAGE }}
        style={styles.videoCanvas}
        imageStyle={styles.videoImage}
      >
        <LinearGradient
          colors={['transparent', colors.bg]}
          style={styles.videoGradient}
        />

        <View style={styles.exerciseLabel}>
          <Text style={styles.exerciseLabelText}>Ejercicio actual</Text>
          <Text style={styles.exerciseName} numberOfLines={2}>
            {currentExercise?.name ?? (allDone ? '¡Completado!' : 'Iniciando...')}
          </Text>
          <View style={styles.exerciseTags}>
            {currentExercise?.weight != null && (
              <View style={styles.exerciseTag}>
                <Text style={styles.exerciseTagText}>{currentExercise.weight} KG</Text>
              </View>
            )}
            {currentExercise && (
              <View style={styles.roundTag}>
                <Text style={styles.roundTagText}>
                  {currentExercise.sets} series · {currentExercise.reps} reps
                </Text>
              </View>
            )}
          </View>
          <View style={styles.countTag}>
            <Text style={styles.countTagText}>
              {completedCount}/{exercises.length} ejercicios
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Metrics panel */}
      <View style={styles.metricsContainer}>
        {/* Overall progress bar */}
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${completionPercent}%` }]}
            />
          </View>
        </View>

        {/* Elapsed timer */}
        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {!isWorkoutTimerPaused ? 'Tiempo activo' : '— Pausado —'}
          </Text>
          <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
          <View style={styles.timeline}>
            <Text style={styles.timelineStart}>00:00</Text>
            <View style={styles.timelineBar}>
              <View
                style={[
                  styles.timelinePointer,
                  { left: `${Math.min(completionPercent, 96)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.timelineEnd}>{exercises.length} ej.</Text>
          </View>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Completados</Text>
            <Text style={styles.metricValue}>{completedCount}</Text>
            <Text style={styles.metricFooterText}>EJERCICIOS</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Progreso</Text>
            <Text style={styles.metricValue}>{Math.round(completionPercent)}%</Text>
            <Text style={styles.metricFooterText}>COMPLETADO</Text>
          </View>
        </View>

        {/* Next exercise or done banner */}
        {allDone ? (
          <View style={[styles.nextExercise, styles.doneBanner]}>
            <Text style={styles.doneBannerText}>🎯 ¡Todos los ejercicios completados!</Text>
          </View>
        ) : nextExercise ? (
          <View style={styles.nextExercise}>
            <View style={styles.nextExerciseImage}>
              <Image
                source={{ uri: nextExercise.image }}
                style={styles.nextImage}
              />
            </View>
            <View style={styles.nextExerciseInfo}>
              <Text style={styles.nextLabel}>Siguiente</Text>
              <Text style={styles.nextExerciseName}>{nextExercise.name}</Text>
            </View>
            <Text style={styles.nextArrow}>›</Text>
          </View>
        ) : null}
      </View>

      {/* Control bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.controlButton} onPress={handleCancel} activeOpacity={0.7}>
          <View style={styles.controlIconWrap}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </View>
          <Text style={styles.controlLabel}>SALIR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleCompleteExercise}
          disabled={allDone}
          activeOpacity={0.7}
        >
          <View style={styles.controlIconWrap}>
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={allDone ? 'rgba(255,255,255,0.2)' : colors.textSecondary}
            />
          </View>
          <Text style={[styles.controlLabel, allDone && styles.disabledLabel]}>HECHO</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => setWorkoutTimerPaused(!isWorkoutTimerPaused)}
          activeOpacity={0.85}
        >
          <Ionicons
            name={isWorkoutTimerPaused ? 'play' : 'pause'}
            size={28}
            color="#000"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={handleFinish} activeOpacity={0.7}>
          <View style={styles.controlIconWrap}>
            <Ionicons name="flag" size={22} color={colors.primary} />
          </View>
          <Text style={[styles.controlLabel, { color: colors.primary }]}>FINALIZAR</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} activeOpacity={0.7}>
          <View style={styles.controlIconWrap}>
            <Ionicons name="lock-closed" size={22} color={colors.textSecondary} />
          </View>
          <Text style={styles.controlLabel}>LOCK</Text>
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
  videoCanvas: {
    flex: 1,
    backgroundColor: colors.elevated,
  },
  videoImage: {
    backgroundColor: colors.elevated,
  },
  videoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  exerciseLabel: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    zIndex: 10,
  },
  exerciseLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: 30,
    marginBottom: 8,
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  exerciseTag: {
    backgroundColor: 'rgba(0, 227, 253, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  exerciseTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  roundTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roundTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  countTag: {
    backgroundColor: 'rgba(209, 255, 38, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  metricsContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },
  progressBarWrapper: {},
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  timerCard: {
    backgroundColor: colors.elevated,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '900',
    color: colors.primary,
    lineHeight: 72,
    marginBottom: 16,
    letterSpacing: -2,
    textShadowColor: `${colors.primary}40`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  timeline: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineStart: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  timelineBar: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    position: 'relative',
  },
  timelinePointer: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    position: 'absolute',
    top: -3,
  },
  timelineEnd: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  metricFooterText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  nextExercise: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  nextExerciseImage: {
    width: 56,
    height: 56,
    backgroundColor: colors.bg,
    borderRadius: 6,
    overflow: 'hidden',
  },
  nextImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.elevated,
  },
  nextExerciseInfo: {
    flex: 1,
  },
  nextLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nextExerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  nextArrow: {
    fontSize: 20,
    color: colors.textSecondary,
  },
  doneBanner: {
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  doneBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 20,
    backgroundColor: 'rgba(14, 14, 14, 0.92)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.07)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  disabledIcon: {
    color: 'rgba(255,255,255,0.2)',
  },
  disabledLabel: {
    color: 'rgba(255,255,255,0.2)',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default EntrenamientoEnVivoScreen;
