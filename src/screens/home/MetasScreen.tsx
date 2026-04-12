import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import {
  getGoalsForDate,
  getGoalDisplayText,
  updateDailyGoalTarget,
  addGoal,
  deleteGoal,
  toggleGoal,
  type DailyGoal,
  type GoalType,
} from '../../services/goalsService';
import { useAuthStore } from '../../store/authStore';
import { getHydrationForDate } from '../../services/hydrationService';
import { getMealsForDate } from '../../services/mealService';
import { getMeasurementHistory } from '../../services/measurementsService';
import { useProgressStore } from '../../store/progressStore';
import { todayISO } from '../../utils/dateUtils';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  textPrimary: '#FFF',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary: 'rgba(255,255,255,0.45)',
  borderLight: 'rgba(255,255,255,0.05)',
};

function pct(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

/** Máximo de metas propias (custom) por día */
const MAX_CUSTOM_GOALS = 8;

const MetasScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const loadProgressData = useProgressStore((s) => s.loadProgressData);
  const stepsLive = useAuthStore((s) => s.steps);

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [mealCount, setMealCount] = useState(0);
  const [hydrationMl, setHydrationMl] = useState<number | null>(null);
  const [weightSeries, setWeightSeries] = useState<number[]>([]);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);

  const [targetModal, setTargetModal] = useState<{
    goal: DailyGoal;
    draft: string;
    label: string;
    suffix: string;
    parse: (s: string) => number | null;
    formatSave: (n: number) => number;
    keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  } | null>(null);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newGoalDraft, setNewGoalDraft] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      const dateStr = todayISO();
      const [g, meals, hyd, meas] = await Promise.all([
        getGoalsForDate(today),
        getMealsForDate(dateStr),
        getHydrationForDate(dateStr),
        getMeasurementHistory(14),
      ]);
      setGoals(g);
      setMealCount(meals.length);
      setHydrationMl(hyd?.total_ml ?? 0);
      const withW = meas.filter((m) => m.weight_kg != null && m.weight_kg > 0);
      const last7 = [...withW].reverse().slice(-7);
      setWeightSeries(last7.map((m) => m.weight_kg!));
      setCurrentWeight(withW[0]?.weight_kg ?? null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const sortedGoals = React.useMemo(
    () => [...goals].sort((a, b) => a.sort_order - b.sort_order),
    [goals],
  );

  const systemGoals = React.useMemo(
    () => sortedGoals.filter((g) => g.goal_type !== 'custom'),
    [sortedGoals],
  );

  const customGoals = React.useMemo(
    () => sortedGoals.filter((g) => g.goal_type === 'custom'),
    [sortedGoals],
  );

  const canAddCustomGoal = customGoals.length < MAX_CUSTOM_GOALS;

  const chartHeights = React.useMemo(() => {
    if (weightSeries.length === 0) return [];
    const min = Math.min(...weightSeries);
    const max = Math.max(...weightSeries);
    const r = max - min || 1;
    return weightSeries.map((w) => 0.3 + ((w - min) / r) * 0.7);
  }, [weightSeries]);

  const goHydration = useCallback(() => {
    void Haptics.selectionAsync();
    navigation.navigate('Hidratacion');
  }, [navigation]);

  const goWeightDetail = useCallback(() => {
    void Haptics.selectionAsync();
    navigation.dispatch(
      CommonActions.navigate({
        name: 'ProgressStack',
        params: { screen: 'PesoCorporalDetail' },
      }),
    );
  }, [navigation]);

  const openEditGoal = (goal: DailyGoal) => {
    void Haptics.selectionAsync();
    const tgt = Number(goal.target_value ?? 1);
    const gt = goal.goal_type as GoalType;

    if (gt === 'meals') {
      setTargetModal({
        goal,
        draft: String(Math.round(tgt)),
        label: 'Meta de comidas (por día)',
        suffix: 'comidas',
        keyboardType: 'number-pad',
        parse: (s) => {
          const n = parseInt(s.replace(/\D/g, ''), 10);
          if (!Number.isFinite(n) || n < 1 || n > 12) return null;
          return n;
        },
        formatSave: (n) => n,
      });
      return;
    }
    if (gt === 'hydration') {
      const lit = tgt / 1000;
      setTargetModal({
        goal,
        draft: lit.toFixed(1).replace('.', ','),
        label: 'Meta de agua (litros / día)',
        suffix: 'L',
        keyboardType: 'decimal-pad',
        parse: (s) => {
          const t = s.replace(',', '.').trim();
          const n = parseFloat(t);
          if (!Number.isFinite(n) || n < 0.5 || n > 8) return null;
          return Math.round(n * 1000);
        },
        formatSave: (n) => n,
      });
      return;
    }
    if (gt === 'steps') {
      setTargetModal({
        goal,
        draft: String(Math.round(tgt)),
        label: 'Meta de pasos (por día)',
        suffix: 'pasos',
        keyboardType: 'number-pad',
        parse: (s) => {
          const n = parseInt(s.replace(/\D/g, ''), 10);
          if (!Number.isFinite(n) || n < 1000 || n > 100000) return null;
          return n;
        },
        formatSave: (n) => n,
      });
      return;
    }
    if (gt === 'training') {
      setTargetModal({
        goal,
        draft: String(Math.max(1, Math.round(tgt))),
        label: 'Meta de entrenamiento (sesiones / día)',
        suffix: 'sesiones',
        keyboardType: 'number-pad',
        parse: (s) => {
          const n = parseInt(s.replace(/\D/g, ''), 10);
          if (!Number.isFinite(n) || n < 1 || n > 3) return null;
          return n;
        },
        formatSave: (n) => n,
      });
      return;
    }
    if (gt === 'custom') {
      if (goal.target_unit === 'boolean') {
        Alert.alert('Meta manual', 'Esta meta se completa desde la lista en inicio.');
        return;
      }
      setTargetModal({
        goal,
        draft: String(Math.round(tgt)),
        label: 'Valor objetivo',
        suffix: goal.target_unit,
        keyboardType: 'number-pad',
        parse: (s) => {
          const n = parseInt(s.replace(/\D/g, ''), 10);
          if (!Number.isFinite(n) || n < 1) return null;
          return n;
        },
        formatSave: (n) => n,
      });
    }
  };

  const renderGoalBody = (goal: DailyGoal) => {
    const gt = goal.goal_type as GoalType;
    const target = Number(goal.target_value ?? 1);
    const cur = Number(goal.current_value ?? 0);

    if (gt === 'meals') {
      const p = pct(mealCount, target);
      return (
        <>
          <Text style={styles.cardEyebrow}>NUTRICIÓN</Text>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getGoalDisplayText(goal)}
            </Text>
            <View style={styles.cardValueCol}>
              <Text style={styles.cardValueMain}>{mealCount}</Text>
              <Text style={styles.cardValueSub}>/ {Math.round(target)}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={[COLORS.primaryDim, COLORS.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressBarFill, { width: `${p}%` }]}
            />
          </View>
        </>
      );
    }

    if (gt === 'hydration') {
      const ml = hydrationMl ?? 0;
      const p = pct(ml, target);
      const lit = ml / 1000;
      const tL = target / 1000;
      return (
        <>
          <Text style={styles.cardEyebrow}>HIDRATACIÓN</Text>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getGoalDisplayText(goal)}
            </Text>
            <View style={styles.cardValueCol}>
              <Text style={styles.cardValueMain}>{lit.toFixed(1)}</Text>
              <Text style={styles.cardValueSub}>/ {tL.toFixed(1)} L</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFillSolid, { width: `${p}%` }]} />
          </View>
          <View style={styles.waterGlasses}>
            {Array.from({ length: 5 }).map((_, i) => {
              const blockPct = (i + 1) * 20;
              const filled = p >= blockPct - 1;
              return (
                <View key={i} style={[styles.waterGlass, { opacity: filled ? 1 : 0.2 }]} />
              );
            })}
          </View>
          <TouchableOpacity style={styles.cardCta} onPress={goHydration} activeOpacity={0.9}>
            <Text style={styles.cardCtaText}>+ Registrar agua</Text>
          </TouchableOpacity>
        </>
      );
    }

    if (gt === 'steps') {
      const steps = stepsLive ?? 0;
      const p = pct(steps, target);
      return (
        <>
          <Text style={styles.cardEyebrow}>PASOS</Text>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {getGoalDisplayText(goal)}
            </Text>
            <View style={styles.cardValueCol}>
              <Text style={styles.cardValueMain}>{steps.toLocaleString('es-AR')}</Text>
              <Text style={styles.cardValueSub}>/ {Math.round(target).toLocaleString('es-AR')}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <LinearGradient
              colors={[COLORS.primaryDim, COLORS.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.progressBarFill, { width: `${p}%` }]}
            />
          </View>
        </>
      );
    }

    if (gt === 'training') {
      const p = target > 0 ? pct(cur, target) : 0;
      return (
        <>
          <Text style={styles.cardEyebrow}>ENTRENAMIENTO</Text>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {goal.text}
            </Text>
            <View style={styles.cardValueCol}>
              <Text style={styles.cardValueMain}>{Math.min(cur, target)}</Text>
              <Text style={styles.cardValueSub}>/ {Math.round(target)}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFillSolid, styles.trainingBarFill, { width: `${p}%` }]} />
          </View>
          <Text style={styles.cardFoot}>Según entrenamientos registrados hoy.</Text>
        </>
      );
    }

    if (gt === 'custom') {
      return (
        <>
          <Text style={styles.cardEyebrow}>META</Text>
          <View style={styles.cardTopRow}>
            <Text style={styles.cardTitle} numberOfLines={3}>
              {goal.text}
            </Text>
            <Text style={styles.cardValueInline}>{goal.completed ? '✓' : '—'}</Text>
          </View>
        </>
      );
    }

    return null;
  };

  const toggleCustomGoal = async (goal: DailyGoal) => {
    if (goal.goal_type !== 'custom' || goal.target_unit !== 'boolean') return;
    void Haptics.selectionAsync();
    const ok = await toggleGoal(goal.id, !goal.completed);
    if (!ok) {
      Alert.alert('No se pudo actualizar', 'Intentá de nuevo.');
      return;
    }
    await load();
    void loadProgressData();
  };

  const confirmDeleteCustom = (goalId: string) => {
    void Haptics.selectionAsync();
    Alert.alert('Eliminar meta', '¿Quitar esta meta de tu lista de hoy?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const ok = await deleteGoal(goalId);
          if (!ok) {
            Alert.alert('No se pudo eliminar', 'Intentá de nuevo.');
            return;
          }
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await load();
          void loadProgressData();
        },
      },
    ]);
  };

  const saveNewGoal = async () => {
    const t = newGoalDraft.trim();
    if (t.length < 2) {
      Alert.alert('Texto corto', 'Escribí al menos 2 caracteres.');
      return;
    }
    if (t.length > 120) {
      Alert.alert('Texto largo', 'Máximo 120 caracteres.');
      return;
    }
    const created = await addGoal(new Date(), t);
    if (!created) {
      Alert.alert('No se pudo crear', 'Revisá el texto o intentá de nuevo.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setAddModalVisible(false);
    setNewGoalDraft('');
    await load();
    void loadProgressData();
  };

  const saveTarget = async () => {
    if (!targetModal) return;
    const v = targetModal.parse(targetModal.draft);
    if (v == null) {
      Alert.alert('Revisá el valor', 'Ingresá un número válido.');
      return;
    }
    const ok = await updateDailyGoalTarget(targetModal.goal.id, targetModal.formatSave(v));
    if (!ok) {
      Alert.alert('No se pudo guardar', 'Intentá de nuevo.');
      return;
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTargetModal(null);
    await load();
    void loadProgressData();
  };

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityLabel="Volver"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TUS METAS</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} accessibilityLabel="Cerrar">
          <MaterialCommunityIcons name="close" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        >
          <View style={styles.heroSection}>
            <Text style={styles.heroTitle}>
              TUS <Text style={styles.heroMetas}>METAS</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Ajustá el motor. Visualizá el cambio. Ejecutá con precisión.
            </Text>
          </View>

          <View style={styles.mindset}>
            <Text style={styles.mindsetLabel}>MINDSET</Text>
            <Text style={styles.mindsetQuote}>
              LA META NO ES EL FIN, <Text style={styles.mindsetAccent}>ES EL PROCESO</Text>
            </Text>
          </View>

          {systemGoals.map((goal) => (
            <View key={goal.id} style={styles.metaCard}>
              <TouchableOpacity
                style={styles.editCorner}
                onPress={() => openEditGoal(goal)}
                accessibilityLabel="Editar objetivo"
              >
                <MaterialCommunityIcons name="tune-variant" size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
              {renderGoalBody(goal)}
            </View>
          ))}

          <View style={styles.customSection}>
            <View style={styles.customSectionHeader}>
              <Text style={styles.customSectionTitle}>METAS PROPIAS</Text>
              <Text style={styles.customSectionHint}>
                Tocá una meta para marcarla hecha o pendiente. Deslizá para eliminar.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.addMetaBtn, !canAddCustomGoal && styles.addMetaBtnDisabled]}
              onPress={() => {
                if (!canAddCustomGoal) return;
                void Haptics.selectionAsync();
                setNewGoalDraft('');
                setAddModalVisible(true);
              }}
              disabled={!canAddCustomGoal}
              activeOpacity={0.85}
              accessibilityLabel="Agregar meta propia"
            >
              <MaterialCommunityIcons
                name="plus-circle-outline"
                size={20}
                color={canAddCustomGoal ? COLORS.primary : COLORS.textTertiary}
              />
              <Text style={[styles.addMetaBtnText, !canAddCustomGoal && styles.addMetaBtnTextDisabled]}>
                Agregar meta
              </Text>
            </TouchableOpacity>
            {!canAddCustomGoal && (
              <Text style={styles.customLimitHint}>Llegaste al máximo de {MAX_CUSTOM_GOALS} metas propias por hoy.</Text>
            )}
            {customGoals.length === 0 ? (
              <Text style={styles.customEmpty}>Todavía no agregaste metas propias para hoy.</Text>
            ) : null}
            {customGoals.map((goal) => (
              <View key={goal.id} style={styles.customSwipeWrap}>
                <Swipeable
                  overshootRight={false}
                  renderRightActions={() => (
                    <TouchableOpacity
                      style={styles.swipeDelete}
                      onPress={() => confirmDeleteCustom(goal.id)}
                      accessibilityLabel="Eliminar meta"
                      activeOpacity={0.9}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                  )}
                >
                  <View style={[styles.metaCard, styles.metaCardInSwipe]}>
                    {goal.target_unit !== 'boolean' && (
                      <TouchableOpacity
                        style={styles.editCorner}
                        onPress={() => openEditGoal(goal)}
                        accessibilityLabel="Editar objetivo"
                      >
                        <MaterialCommunityIcons name="tune-variant" size={16} color={COLORS.textTertiary} />
                      </TouchableOpacity>
                    )}
                    <Pressable
                      onPress={() => {
                        if (goal.target_unit === 'boolean') void toggleCustomGoal(goal);
                      }}
                      style={({ pressed }) => [
                        goal.target_unit === 'boolean' && pressed && styles.customMetaPressed,
                      ]}
                    >
                      {renderGoalBody(goal)}
                    </Pressable>
                  </View>
                </Swipeable>
              </View>
            ))}
          </View>

          <View style={[styles.metaCard, styles.metaCardExtra]}>
            <Text style={styles.cardEyebrow}>COMPOSICIÓN</Text>
            <View style={styles.cardTopRow}>
              <Text style={styles.cardTitle}>Peso corporal</Text>
              <View style={styles.cardValueCol}>
                <Text style={styles.cardValueMainSm}>
                  {currentWeight != null ? currentWeight.toFixed(1) : '—'}
                </Text>
                <Text style={styles.cardValueSub}>kg</Text>
              </View>
            </View>
            <Text style={styles.cardFoot}>No es una meta diaria en el sistema; seguimiento en medidas.</Text>
            <View style={styles.chartContainer}>
              {chartHeights.length === 0 ? (
                <Text style={styles.emptyChart}>Sin datos de peso aún.</Text>
              ) : (
                <View style={styles.chartBars}>
                  {chartHeights.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.chartBar,
                        {
                          height: `${Math.round(h * 100)}%`,
                          backgroundColor:
                            i === chartHeights.length - 1 ? COLORS.tertiary : COLORS.surfaceHighest,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
            <View style={styles.chartLegend}>
              <Text style={styles.legendText} numberOfLines={1}>
                Últimos registros
              </Text>
              <TouchableOpacity style={styles.detailsButton} onPress={goWeightDetail}>
                <Text style={styles.detailsButtonText}>Detalle</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setAddModalVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva meta propia</Text>
            <Text style={styles.modalSubtitle}>2–120 caracteres. La completás vos durante el día.</Text>
            <TextInput
              style={styles.modalInputMultiline}
              value={newGoalDraft}
              onChangeText={setNewGoalDraft}
              placeholder="Ej: Meditar 10 min · Caminar el perro"
              placeholderTextColor={COLORS.textTertiary}
              maxLength={120}
              autoFocus
              multiline
            />
            <Text style={styles.charCount}>{newGoalDraft.trim().length}/120</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={() => void saveNewGoal()}>
                <Text style={styles.modalBtnText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!targetModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalWrap}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setTargetModal(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{targetModal?.label}</Text>
            <TextInput
              style={styles.modalInput}
              value={targetModal?.draft ?? ''}
              onChangeText={(t) => setTargetModal((m) => (m ? { ...m, draft: t } : m))}
              keyboardType={targetModal?.keyboardType ?? 'decimal-pad'}
              placeholderTextColor={COLORS.textTertiary}
              autoFocus
            />
            <Text style={styles.modalSuffix}>{targetModal?.suffix}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnGhost} onPress={() => setTargetModal(null)}>
                <Text style={styles.modalBtnGhostText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtn} onPress={() => void saveTarget()}>
                <Text style={styles.modalBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 18,
    letterSpacing: 1,
    color: COLORS.textPrimary,
  },
  scroll: {
    paddingTop: 8,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  heroTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 36,
    lineHeight: 38,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  heroMetas: {
    color: COLORS.primaryDim,
  },
  heroSubtitle: {
    fontSize: 10,
    color: COLORS.textTertiary,
    letterSpacing: 1.8,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  mindset: {
    marginHorizontal: 24,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryDim,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 8,
  },
  mindsetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  mindsetQuote: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mindsetAccent: {
    color: COLORS.primaryDim,
  },
  metaCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingRight: 36,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryDim,
    position: 'relative',
  },
  metaCardExtra: {
    marginBottom: 24,
    opacity: 0.95,
  },
  metaCardInSwipe: {
    marginHorizontal: 0,
    marginBottom: 0,
  },
  customSection: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  customSectionHeader: {
    marginBottom: 12,
  },
  customSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 2,
  },
  customSectionHint: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.textTertiary,
    lineHeight: 15,
  },
  addMetaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(209,255,38,0.35)',
    backgroundColor: COLORS.surfaceLow,
    marginBottom: 12,
  },
  addMetaBtnDisabled: {
    opacity: 0.55,
    borderColor: COLORS.borderLight,
  },
  addMetaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  addMetaBtnTextDisabled: {
    color: COLORS.textTertiary,
  },
  customLimitHint: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginBottom: 10,
  },
  customEmpty: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  customSwipeWrap: {
    marginBottom: 16,
  },
  swipeDelete: {
    backgroundColor: '#9e2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    width: 76,
    borderRadius: 8,
    marginLeft: 10,
  },
  customMetaPressed: {
    opacity: 0.88,
  },
  editCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
    padding: 4,
  },
  cardEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 1.6,
    marginBottom: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  cardValueCol: {
    alignItems: 'flex-end',
  },
  cardValueMain: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardValueMainSm: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardValueSub: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  cardValueInline: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  cardHint: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginBottom: 8,
  },
  cardFoot: {
    marginTop: 8,
    fontSize: 9,
    color: COLORS.textTertiary,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressBarFillSolid: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },
  trainingBarFill: {
    backgroundColor: COLORS.primaryDim,
  },
  progressBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  sessionBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  waterGlasses: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    marginBottom: 10,
  },
  waterGlass: {
    flex: 1,
    height: 6,
    borderRadius: 2,
    backgroundColor: COLORS.secondary,
  },
  cardCta: {
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceHighest,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardCtaText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.secondary,
    letterSpacing: 1,
  },
  chartContainer: {
    height: 72,
    marginBottom: 8,
    justifyContent: 'flex-end',
  },
  emptyChart: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textAlign: 'center',
    paddingVertical: 22,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 2,
  },
  chartBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textTertiary,
    flex: 1,
    marginRight: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsButtonText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  modalWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginBottom: 12,
    lineHeight: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.surfaceHighest,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalInputMultiline: {
    borderWidth: 1,
    borderColor: COLORS.surfaceHighest,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  modalSuffix: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  modalBtnGhost: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalBtnGhostText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalBtnText: {
    color: '#0e0e0e',
    fontWeight: '800',
  },
});

export default MetasScreen;
