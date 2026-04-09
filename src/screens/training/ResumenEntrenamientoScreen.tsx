import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { finishActiveSession, saveWorkoutLog } from '../../services/workoutService';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const PERSIST_DELAY_MS = 2000;

const C = {
  bg: colors.background,
  surface: colors.surface.base,
  elevated: colors.surface.elevated,
  primary: colors.primary.default,
  secondary: colors.secondary.default,
  tertiary: colors.tertiary.default,
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,
};

export const ResumenEntrenamientoScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const {
    trainingName = 'Entrenamiento',
    durationSeconds = 0,
    calories = 0,
    exercises = 0,
    totalExercises: totalExercisesParam,
    sessionLogId = null,
    completedExerciseIds = [] as string[],
    workoutType = null as string | null,
  } = route.params ?? {};

  const totalSec = Math.max(0, Math.floor(durationSeconds));
  const durationMinutes = Math.floor(totalSec / 60);
  const durationSecsRemainder = totalSec % 60;
  const durationMinForDb =
    totalSec > 0 ? Math.max(1, Math.round(totalSec / 60)) : 0;

  const completedCount = Math.max(
    exercises,
    completedExerciseIds.length,
  );
  const totalExercises =
    totalExercisesParam != null && totalExercisesParam > 0
      ? totalExercisesParam
      : Math.max(completedCount, 1);

  const sessionCompletion = useMemo(() => {
    if (totalExercisesParam === 0 && completedCount === 0) return 100;
    const denom = Math.max(totalExercises, 1);
    return Math.min(100, Math.round((completedCount / denom) * 100));
  }, [completedCount, totalExercises, totalExercisesParam]);

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

  const handleDone = () => {
    navigation.popToTop();
  };

  const persistLabel =
    persistStatus === 'saving'
      ? 'Sincronizando con la nube…'
      : persistStatus === 'done'
        ? 'Sesión guardada'
        : persistStatus === 'error'
          ? 'Error al guardar'
          : null;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['rgba(209, 255, 38, 0.12)', 'transparent']}
        style={[styles.heroGlow, { paddingTop: insets.top }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: spacing.sm }]}>
          <TouchableOpacity
            onPress={handleDone}
            hitSlop={12}
            style={styles.topBarBtn}
            accessibilityRole="button"
            accessibilityLabel="Volver a entrenamientos"
          >
            <Ionicons name="close" size={22} color={C.textSecondary} />
          </TouchableOpacity>
          {persistLabel ? (
            <View
              style={[
                styles.syncPill,
                persistStatus === 'done' && styles.syncPillOk,
                persistStatus === 'error' && styles.syncPillErr,
              ]}
            >
              {persistStatus === 'saving' && (
                <Ionicons name="cloud-upload-outline" size={14} color={C.secondary} />
              )}
              {persistStatus === 'done' && (
                <Ionicons name="checkmark-circle" size={14} color={C.primary} />
              )}
              {persistStatus === 'error' && (
                <Ionicons name="alert-circle" size={14} color={C.tertiary} />
              )}
              <Text style={styles.syncPillText}>{persistLabel}</Text>
            </View>
          ) : (
            <View style={styles.topBarSpacer} />
          )}
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <LinearGradient
              colors={[colors.gradients.kinetic[0], colors.gradients.kinetic[1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIconRing}
            >
              <View style={styles.heroIconInner}>
                <Ionicons name="checkmark" size={40} color={C.bg} />
              </View>
            </LinearGradient>
          </View>
          <Text style={styles.heroKicker}>R3SET COMPLETADO</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {trainingName}
          </Text>
          <Text style={styles.heroSub}>
            Tu sesión quedó registrada. Revisá las métricas y el esfuerzo percibido.
          </Text>
        </View>

        {/* Stat strip */}
        <View style={styles.statStrip}>
          <View style={styles.statCell}>
            <LinearGradient
              colors={['rgba(209, 255, 38, 0.2)', 'rgba(14, 14, 14, 0)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            <Ionicons name="time-outline" size={20} color={C.primary} />
            <Text style={styles.statValue}>
              {String(durationMinutes).padStart(2, '0')}:
              {String(durationSecsRemainder).padStart(2, '0')}
            </Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Ionicons name="barbell-outline" size={20} color={C.secondary} />
            <Text style={styles.statValue}>
              {completedCount}
              <Text style={styles.statValueMuted}>/{totalExercises}</Text>
            </Text>
            <Text style={styles.statLabel}>Ejercicios</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Ionicons name="flame-outline" size={20} color={C.tertiary} />
            <Text style={styles.statValue}>
              {calories > 0 ? String(calories) : '—'}
            </Text>
            <Text style={styles.statLabel}>kcal est.</Text>
          </View>
        </View>

        {/* Progress card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Rendimiento de sesión</Text>
            <Text style={styles.cardPct}>{sessionCompletion}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[...colors.gradients.kinetic]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressFill, { width: `${sessionCompletion}%` }]}
            />
          </View>
          <Text style={styles.cardFoot}>
            {totalExercisesParam === 0
              ? 'Sesión sin bloques de fuerza (p. ej. cardio o movilidad).'
              : `Completaste ${completedCount} de ${totalExercises} bloques previstos para esta rutina.`}
          </Text>
        </View>

        {/* Secondary metrics */}
        <View style={styles.row2}>
          <View style={[styles.miniCard, styles.miniCardCal]}>
            <Ionicons name="watch-outline" size={18} color={C.secondary} />
            <Text style={styles.miniTitle}>Wearable</Text>
            <Text style={styles.miniValue}>
              {calories > 0 ? `${calories} kcal` : 'Sin sync'}
            </Text>
            <Text style={styles.miniHint}>Estimación del plan</Text>
          </View>
          <View style={[styles.miniCard, styles.miniCardHr]}>
            <Ionicons name="heart-outline" size={18} color={C.tertiary} />
            <Text style={styles.miniTitle}>Ritmo cardíaco</Text>
            <Text style={styles.miniValue}>—</Text>
            <Text style={styles.miniHint}>Próximamente</Text>
          </View>
        </View>

        {/* RPE */}
        <View style={styles.rpeCard}>
          <View style={styles.rpeHead}>
            <Text style={styles.rpeTitle}>Esfuerzo percibido (RPE)</Text>
            <View style={styles.rpeBadge}>
              <Text style={styles.rpeBadgeText}>{selectedRPE}</Text>
            </View>
          </View>
          <Text style={styles.rpeHint}>
            Del 1 (muy fácil) al 7 (máximo esfuerzo sostenible)
          </Text>
          <View style={styles.rpeRow}>
            {([1, 2, 3, 4, 5, 6, 7] as const).map((n) => {
              const active = selectedRPE === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.rpeChip, active && styles.rpeChipOn]}
                  onPress={() => setSelectedRPE(n)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.rpeChipTxt, active && styles.rpeChipTxtOn]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsBlock}>
          <Text style={styles.commentsTitle}>Sensaciones</Text>
          <TextInput
            style={styles.textarea}
            placeholder="¿Cómo te sentiste? Notas para tu coach…"
            placeholderTextColor={C.textTertiary}
            multiline
            value={comments}
            onChangeText={setComments}
            textAlignVertical="top"
          />
        </View>

        {/* CTAs */}
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={handleDone}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[C.primary, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.btnPrimaryGrad}
          >
            <Text style={styles.btnPrimaryTxt}>LISTO</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primary.text} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnGhost} activeOpacity={0.85}>
          <Ionicons name="share-outline" size={18} color={C.secondary} />
          <Text style={styles.btnGhostTxt}>Compartir logro</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  heroGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 280,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarSpacer: {
    width: 40,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(0, 227, 253, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 227, 253, 0.25)',
    maxWidth: '72%',
  },
  syncPillOk: {
    backgroundColor: 'rgba(209, 255, 38, 0.1)',
    borderColor: 'rgba(209, 255, 38, 0.3)',
  },
  syncPillErr: {
    backgroundColor: 'rgba(255, 115, 74, 0.12)',
    borderColor: 'rgba(255, 115, 74, 0.35)',
  },
  syncPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    flexShrink: 1,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  heroIconWrap: {
    marginBottom: spacing.xl,
  },
  heroIconRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconInner: {
    flex: 1,
    width: '100%',
    borderRadius: 50,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroKicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: C.primary,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.textPrimary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: C.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  statStrip: {
    flexDirection: 'row',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: C.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.lg,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginVertical: spacing.md,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '900',
    color: C.textPrimary,
    marginTop: spacing.sm,
  },
  statValueMuted: {
    fontSize: 14,
    fontWeight: '700',
    color: C.textTertiary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: C.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  card: {
    backgroundColor: C.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardPct: {
    fontSize: 18,
    fontWeight: '900',
    color: C.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardFoot: {
    fontSize: 13,
    lineHeight: 18,
    color: C.textTertiary,
  },
  row2: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  miniCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    minHeight: 112,
  },
  miniCardCal: {
    backgroundColor: 'rgba(0, 227, 253, 0.08)',
    borderColor: 'rgba(0, 227, 253, 0.2)',
  },
  miniCardHr: {
    backgroundColor: 'rgba(255, 115, 74, 0.08)',
    borderColor: 'rgba(255, 115, 74, 0.2)',
  },
  miniTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  miniValue: {
    fontSize: 20,
    fontWeight: '900',
    color: C.textPrimary,
  },
  miniHint: {
    fontSize: 11,
    color: C.textTertiary,
    marginTop: spacing.xs,
  },
  rpeCard: {
    backgroundColor: C.elevated,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  rpeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rpeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rpeBadge: {
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(209, 255, 38, 0.15)',
    alignItems: 'center',
  },
  rpeBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: C.primary,
  },
  rpeHint: {
    fontSize: 12,
    color: C.textTertiary,
    marginBottom: spacing.lg,
  },
  rpeRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  rpeChip: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rpeChipOn: {
    backgroundColor: 'rgba(209, 255, 38, 0.2)',
    borderColor: C.primary,
  },
  rpeChipTxt: {
    fontSize: 15,
    fontWeight: '800',
    color: C.textTertiary,
  },
  rpeChipTxtOn: {
    color: C.primary,
  },
  commentsBlock: {
    marginBottom: spacing.xl,
  },
  commentsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  textarea: {
    backgroundColor: C.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    color: C.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    padding: spacing.lg,
    minHeight: 100,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Manrope',
  },
  btnPrimary: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  btnPrimaryGrad: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  btnPrimaryTxt: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary.text,
    letterSpacing: 1,
  },
  btnGhost: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  btnGhostTxt: {
    fontSize: 14,
    fontWeight: '800',
    color: C.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default ResumenEntrenamientoScreen;
