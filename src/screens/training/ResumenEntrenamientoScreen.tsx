import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import { finishActiveSession, saveWorkoutLog } from '../../services/workoutService';

const PERSIST_DELAY_MS = 2000;

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

export const ResumenEntrenamientoScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const {
    trainingName = 'Entrenamiento',
    durationSeconds = 0,
    calories = 0,
    exercises = 0,
    sessionLogId = null,
    completedExerciseIds = [] as string[],
    workoutType = null as string | null,
  } = route.params ?? {};

  const totalSec = Math.max(0, Math.floor(durationSeconds));
  const durationMinutes = Math.floor(totalSec / 60);
  const durationSecsRemainder = totalSec % 60;
  const durationMinForDb =
    totalSec > 0 ? Math.max(1, Math.round(totalSec / 60)) : 0;

  const [selectedRPE, setSelectedRPE] = useState<number>(5);
  const [comments, setComments] = useState<string>('');
  const [persistStatus, setPersistStatus] = useState<
    'idle' | 'saving' | 'done' | 'error'
  >('idle');

  const rpeRef = useRef(selectedRPE);
  const commentsRef = useRef(comments);
  rpeRef.current = selectedRPE;
  commentsRef.current = comments;

  const completedKey = completedExerciseIds.join(',');

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      setPersistStatus('saving');

      const rpe = rpeRef.current;
      const c = commentsRef.current.trim() || null;

      if (sessionLogId) {
        const ok = await finishActiveSession(sessionLogId, {
          duration_min: durationMinForDb,
          rpe,
          comments: c,
          elapsed_seconds: totalSec,
          completed_exercises: completedExerciseIds,
        });
        if (!cancelled) setPersistStatus(ok ? 'done' : 'error');
      } else {
        const ok = await saveWorkoutLog({
          workout_name: trainingName,
          workout_type: workoutType ?? undefined,
          duration_min: durationMinForDb > 0 ? durationMinForDb : null,
          rpe,
          comments: c,
        });
        if (!cancelled) setPersistStatus(ok ? 'done' : 'error');
      }
    }, PERSIST_DELAY_MS);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    sessionLogId,
    totalSec,
    durationMinForDb,
    trainingName,
    workoutType,
    completedKey,
  ]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Header */}
        <View style={styles.successSection}>
          <View style={styles.checkmarkContainer}>
            <View style={styles.checkmarkOuter}>
              <Text style={styles.checkmark}>✓</Text>
            </View>
          </View>

          <Text style={styles.completedTitle}>ENTRENO COMPLETADO</Text>
          <Text style={styles.completedSubtitle}>R3SET ALCANZADO</Text>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsSection}>
          {/* Duration */}
          <View style={[styles.metricCard, styles.metricCardWide]}>
            <View style={styles.metricHeader}>
              <View>
                <Text style={styles.metricLabel}>Duración Total</Text>
                <Text style={styles.metricValueLarge}>
                  {durationMinutes}
                  <Text style={styles.metricUnit}> min </Text>
                  {String(durationSecsRemainder).padStart(2, '0')}
                  <Text style={styles.metricUnit}> seg</Text>
                </Text>
              </View>
              <Text style={styles.metricIcon}>⏱</Text>
            </View>
          </View>

          {/* Calories */}
          <View style={[styles.metricCard, styles.calorieCard]}>
            <Text style={styles.metricLabel}>Calorías (Smartwatch)</Text>
            <Text style={styles.metricValue}>
              {calories > 0 ? calories : '—'}<Text style={styles.metricUnitSmall}>{calories > 0 ? 'kcal' : ''}</Text>
            </Text>
            <View style={styles.syncBadge}>
              <Text style={styles.syncIcon}>⌚</Text>
              <Text style={styles.syncText}>{calories > 0 ? 'Estimado' : 'Sin datos'}</Text>
            </View>
          </View>

          {/* Heart Rate */}
          <View style={[styles.metricCard, styles.hrCard]}>
            <Text style={styles.metricLabel}>Frecuencia Media</Text>
            <Text style={styles.metricValue}>
              142<Text style={styles.metricUnitSmall}>bpm</Text>
            </Text>
            <View style={styles.hrBars}>
              <View style={[styles.hrBar, { height: '50%', opacity: 0.2 }]} />
              <View style={[styles.hrBar, { height: '75%', opacity: 0.4 }]} />
              <View style={[styles.hrBar, { height: '100%' }]} />
              <View style={[styles.hrBar, { height: '60%', opacity: 0.6 }]} />
              <View style={[styles.hrBar, { height: '30%', opacity: 0.3 }]} />
            </View>
          </View>
        </View>

        {/* RPE Scale */}
        <View style={styles.rpeSection}>
          <Text style={styles.rpeTitle}>Escala de Esfuerzo (RPE)</Text>

          <View style={styles.rpeScale}>
            {[1, 2, 3, 4, 5, 6, 7].map((rpe) => (
              <TouchableOpacity
                key={rpe}
                style={[
                  styles.rpeButton,
                  selectedRPE === rpe && styles.rpeButtonSelected,
                ]}
                onPress={() => setSelectedRPE(rpe)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.rpeBar,
                    {
                      height: `${rpe * 14}%`,
                      minHeight: 8,
                    },
                    selectedRPE === rpe && styles.rpeBarSelected,
                  ]}
                />
                <Text
                  style={[
                    styles.rpeLabel,
                    selectedRPE === rpe && styles.rpeLabelSelected,
                  ]}
                >
                  {rpe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.rpeQuestion}>
            Cómo de intenso ha sido el entreno hoy?
          </Text>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsLabel}>Comentarios y Sensaciones</Text>

          <View style={styles.textareaContainer}>
            <TextInput
              style={styles.textarea}
              placeholder="Escribe cómo te has sentido..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              value={comments}
              onChangeText={setComments}
            />

            <View style={styles.textareaIcons}>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Text style={styles.iconEmoji}>😊</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
                <Text style={styles.iconEmoji}>📸</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsSection}>
          {persistStatus === 'saving' && (
            <Text style={styles.persistHint}>Guardando entrenamiento…</Text>
          )}
          {persistStatus === 'done' && (
            <Text style={styles.persistHint}>Entrenamiento registrado</Text>
          )}
          {persistStatus === 'error' && (
            <Text style={styles.persistError}>
              No se pudo guardar. Reintentá más tarde.
            </Text>
          )}

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>COMPARTIR LOGRO</Text>
            <Text style={styles.buttonIcon}>📤</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  successSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  checkmarkContainer: {
    marginBottom: 24,
  },
  checkmarkOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 48,
    color: colors.primary,
    fontWeight: '900',
  },
  completedTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 8,
    textAlign: 'center',
    textShadowColor: `${colors.primary}30`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  completedSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  metricsSection: {
    paddingHorizontal: 24,
    marginBottom: 48,
    gap: 16,
  },
  metricCard: {
    backgroundColor: colors.elevated,
    borderRadius: 8,
    padding: 24,
  },
  metricCardWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  metricValueLarge: {
    fontSize: 40,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  metricUnit: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  metricIcon: {
    fontSize: 28,
    opacity: 0.4,
  },
  calorieCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.secondary,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metricUnitSmall: {
    fontSize: 12,
    color: colors.secondary,
    marginLeft: 4,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  syncIcon: {
    fontSize: 14,
  },
  syncText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  hrCard: {
    borderLeftWidth: 2,
    borderLeftColor: colors.tertiary,
  },
  hrBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 12,
    height: 32,
  },
  hrBar: {
    flex: 1,
    backgroundColor: colors.tertiary,
    borderRadius: 2,
  },
  rpeSection: {
    paddingHorizontal: 24,
    backgroundColor: colors.elevated,
    marginHorizontal: 24,
    borderRadius: 12,
    paddingVertical: 32,
    marginBottom: 32,
  },
  rpeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  rpeScale: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    marginBottom: 16,
    gap: 4,
  },
  rpeButton: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  rpeButtonSelected: {
    // Selected state styles applied through rpeBarSelected
  },
  rpeBar: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
  },
  rpeBarSelected: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  rpeLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.3)',
  },
  rpeLabelSelected: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  rpeQuestion: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  commentsSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  commentsLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  textareaContainer: {
    position: 'relative',
  },
  textarea: {
    backgroundColor: colors.surface,
    borderWidth: 0,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
    borderRadius: 8,
    textAlignVertical: 'top',
    fontFamily: 'Manrope',
  },
  textareaIcons: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconEmoji: {
    fontSize: 18,
    opacity: 0.4,
  },
  buttonsSection: {
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 40,
  },
  persistHint: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  persistError: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.tertiary,
    textAlign: 'center',
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(72, 72, 71, 0.3)',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    fontSize: 16,
  },
  bottomPadding: {
    height: 20,
  },
});
export default ResumenEntrenamientoScreen;
