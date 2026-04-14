import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Pressable,
  Animated,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
  TouchableOpacity as GHTouchableOpacity,
} from 'react-native-gesture-handler';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';
import {
  getMealsForDate,
  getMealTypeLabel,
  deleteMealLog,
  restoreMealLog,
  type MealLog,
  type MealType,
} from '../../services/mealService';
import { useUIStore } from '../../store/uiStore';
import { useNutritionStore } from '../../store/nutritionStore';
import { toLocalISODate } from '../../utils/dateUtils';
import { colors as themeColors } from '../../theme/colors';
import { EMBEDDED_SNACK_BOTTOM_INSET } from './alimentacionSnackLayout';

const PLACEHOLDER_MEAL_IMAGE = 'https://via.placeholder.com/100';

/** 7 días centrados en la fecha activa (incluye cualquier día que venga del Home). */
const SHORT_DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function buildWeekAround(anchorISO: string): { iso: string; day: string; dateNum: number }[] {
  const anchor = new Date(`${anchorISO}T12:00:00`);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - 3);
  const out: { iso: string; day: string; dateNum: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push({
      iso: toLocalISODate(d),
      day: SHORT_DAY_LABELS[d.getDay()],
      dateNum: d.getDate(),
    });
  }
  return out;
}

function formatMealTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/** Objetivos por defecto a partir de la meta calórica (reparto típico; configurable luego desde perfil). */
function defaultMacroTargetsFromKcal(kcal: number) {
  const safe = Math.max(0, kcal);
  return {
    protein: Math.round((safe * 0.28) / 4),
    carbs: Math.round((safe * 0.42) / 4),
    fat: Math.round((safe * 0.3) / 9),
  };
}

const MEAL_SLOT_ORDER: MealType[] = ['DES', 'ALM', 'MER', 'CEN'];

function sumLogs(logs: MealLog[]) {
  return logs.reduce(
    (a, m) => ({
      kcal: a.kcal + (Number(m.energy_kcal) || 0),
      p: a.p + (Number(m.protein_g) || 0),
      c: a.c + (Number(m.carbs_g) || 0),
      f: a.f + (Number(m.fat_g) || 0),
    }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

/** Texto de porción tipo referencia: "1 porción (50 g)" */
function formatPortionLine(item: MealLog): string {
  const g = item.portion_grams;
  if (g != null && Number(g) > 0) {
    return `1 porción (${Math.round(Number(g))} g)`;
  }
  return 'Porción registrada';
}

/** Unidad corta para la columna derecha del ítem: "200 g", "Porción". */
function formatPortionUnit(item: MealLog): string {
  const g = item.portion_grams;
  if (g != null && Number(g) > 0) {
    return `${Math.round(Number(g))} g`;
  }
  return 'Porción';
}

const PREP_RE = /\(\s*(peso\s+)?(cocido|cruda?|hervido|asado)\s*\)/i;
const PREP_TRAILING_RE = /\b(peso\s+cocido|peso\s+crudo|cocido|cruda?|hervido|asado)\b/i;

/**
 * Extrae una nota de preparación del nombre del alimento.
 * Ej: "Arroz cocido" → { clean: "Arroz", note: "(cocido)" }
 *     "Pollo (peso crudo)" → { clean: "Pollo", note: "(peso crudo)" }
 */
function extractPrepNote(name: string): { clean: string; note: string | null } {
  const parenMatch = name.match(PREP_RE);
  if (parenMatch) {
    const inner = parenMatch[0].replace(/[()]/g, '').trim();
    const clean = name.replace(parenMatch[0], '').replace(/\s{2,}/g, ' ').trim();
    return { clean: clean || name, note: `(${inner})` };
  }
  const trailingMatch = name.match(PREP_TRAILING_RE);
  if (trailingMatch) {
    const kw = trailingMatch[0];
    const clean = name.replace(new RegExp(`\\b${kw}\\b`, 'i'), '').replace(/[,\s]+$/, '').replace(/\s{2,}/g, ' ').trim();
    return { clean: clean || name, note: `(${kw.toLowerCase()})` };
  }
  return { clean: name, note: null };
}

interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  icon: string;
}

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  elevated: '#262626',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

const SHOPPING_ITEMS: ShoppingItem[] = [
  { id: '1', name: 'Salmón Fresco', quantity: '500g', category: 'Pescadería', icon: '🐟' },
  { id: '2', name: 'Espárragos Verdes', quantity: '2 manojos', category: 'Verdulería', icon: '🥦' },
  { id: '3', name: 'Yogurt Griego 0%', quantity: '1kg', category: 'Lácteos', icon: '🥛' },
  { id: '4', name: 'Nueces de California', quantity: '200g', category: 'Frutos Secos', icon: '🥜' },
];

type ComidasScreenProps = {
  embedded?: boolean;
  /** Desde Plan: abre Buscar en Alimentación en lugar de ir directo a Registrar comida */
  onRequestAddForSlot?: (mealType: MealType) => void;
  /** Tocar una fila del plan: abre detalle del registro */
  onEmbeddedMealPress?: (log: MealLog) => void;
  /** Mensaje tras agregar alimento (desde Alimentación); se muestra encima del submenú */
  mealAddedFeedback?: string | null;
  onMealAddedFeedbackClear?: () => void;
};

const UNDO_SNACK_MS = 5000;
const ADDED_SNACK_MS = 3800;

const ComidasScreen: React.FC<ComidasScreenProps> = ({
  embedded = false,
  onRequestAddForSlot,
  onEmbeddedMealPress,
  mealAddedFeedback = null,
  onMealAddedFeedbackClear,
}) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const snackOpacity = useRef(new Animated.Value(0)).current;
  const snackTranslate = useRef(new Animated.Value(16)).current;
  const addedOpacity = useRef(new Animated.Value(0)).current;
  const addedTranslate = useRef(new Animated.Value(12)).current;
  const addedClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDate = useUIStore((s) => s.activeDate);
  const setActiveDate = useUIStore((s) => s.setActiveDate);
  const targetCalories = useNutritionStore((s) => s.targetCalories);

  const weekDays = useMemo(() => buildWeekAround(activeDate), [activeDate]);

  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  /** Snapshot del último ítem borrado (para Deshacer). */
  const [undoSnapshot, setUndoSnapshot] = useState<MealLog | null>(null);

  const consumedKcal = useMemo(
    () => meals.reduce((sum, m) => sum + (Number(m.energy_kcal) || 0), 0),
    [meals],
  );
  const hasKcalTotals = consumedKcal > 0;
  const remainingKcal = Math.max(0, Math.round(targetCalories - consumedKcal));

  const loadMeals = useCallback(async () => {
    setLoadingMeals(true);
    try {
      const data = await getMealsForDate(activeDate);
      setMeals(data);
    } finally {
      setLoadingMeals(false);
    }
  }, [activeDate]);

  useEffect(() => {
    void loadMeals();
  }, [loadMeals]);

  useFocusEffect(
    useCallback(() => {
      void loadMeals();
    }, [loadMeals]),
  );

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(
    () => () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    },
    [],
  );

  const clearUndoTimer = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }, []);

  const runLayoutAnim = useCallback(() => {
    if (Platform.OS === 'web') return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, []);

  useEffect(() => {
    if (!undoSnapshot) return;
    snackTranslate.setValue(16);
    snackOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(snackOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(snackTranslate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
    ]).start();
  }, [undoSnapshot, snackOpacity, snackTranslate]);

  useEffect(() => {
    if (!mealAddedFeedback) {
      addedOpacity.setValue(0);
      addedTranslate.setValue(12);
      return;
    }
    if (addedClearTimerRef.current) {
      clearTimeout(addedClearTimerRef.current);
      addedClearTimerRef.current = null;
    }
    addedTranslate.setValue(12);
    addedOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(addedOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(addedTranslate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
    ]).start();
    addedClearTimerRef.current = setTimeout(() => {
      addedClearTimerRef.current = null;
      onMealAddedFeedbackClear?.();
    }, ADDED_SNACK_MS);
    return () => {
      if (addedClearTimerRef.current) {
        clearTimeout(addedClearTimerRef.current);
        addedClearTimerRef.current = null;
      }
    };
  }, [mealAddedFeedback, addedOpacity, addedTranslate, onMealAddedFeedbackClear]);

  const snackBottomOffset = useMemo(
    () =>
      embedded
        ? EMBEDDED_SNACK_BOTTOM_INSET
        : Math.max(
            tabBarHeight + 4,
            tabBarHeight + Math.max(insets.bottom, 8) - 10,
          ),
    [embedded, tabBarHeight, insets.bottom],
  );

  const undoBottomOffset = snackBottomOffset;
  const addedBottomOffset =
    snackBottomOffset + (undoSnapshot && mealAddedFeedback ? 54 : 0);

  const macroTargets = useMemo(
    () => defaultMacroTargetsFromKcal(targetCalories),
    [targetCalories],
  );

  const consumedMacros = useMemo(
    () =>
      meals.reduce(
        (a, m) => ({
          p: a.p + (Number(m.protein_g) || 0),
          c: a.c + (Number(m.carbs_g) || 0),
          f: a.f + (Number(m.fat_g) || 0),
        }),
        { p: 0, c: 0, f: 0 },
      ),
    [meals],
  );

  const mealsByType = useMemo(() => {
    const acc: Record<MealType, MealLog[]> = { DES: [], ALM: [], MER: [], CEN: [] };
    for (const m of meals) {
      if (acc[m.meal_type]) acc[m.meal_type].push(m);
    }
    return acc;
  }, [meals]);

  const kcalBarPct =
    targetCalories > 0 ? Math.min(100, (consumedKcal / targetCalories) * 100) : 0;
  const kcalBandLow = Math.round(targetCalories * 0.9);
  const kcalBandHigh = Math.round(targetCalories * 1.1);

  const macroPct = (cur: number, goal: number) =>
    goal > 0 ? Math.min(100, (cur / goal) * 100) : 0;

  const renderDayButton = ({ item }: { item: (typeof weekDays)[number] }) => {
    const selected = item.iso === activeDate;
    if (embedded) {
      const hasData = selected && meals.length > 0;
      return (
        <TouchableOpacity
          style={[styles.dayBtnEmb, selected && styles.dayBtnEmbActive]}
          onPress={() => setActiveDate(item.iso)}
          activeOpacity={0.75}
        >
          <Text style={[styles.dayBtnEmbLabel, selected && styles.dayBtnEmbLabelActive]}>
            {item.day.slice(0, 2)}
          </Text>
          <Text style={[styles.dayBtnEmbNum, selected && styles.dayBtnEmbNumActive]}>
            {item.dateNum}
          </Text>
          <View style={[styles.dayDot, hasData && styles.dayDotOn]} />
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity
        style={[styles.dayButton, selected && styles.dayButtonActive]}
        onPress={() => setActiveDate(item.iso)}
        activeOpacity={0.75}
      >
        <Text style={[styles.dayButtonLabel, selected && styles.dayButtonLabelActive]}>
          {item.day}
        </Text>
        <Text style={[styles.dayButtonDate, selected && styles.dayButtonDateActive]}>
          {item.dateNum}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleUndoDelete = useCallback(async () => {
    if (!undoSnapshot) return;
    const snap = undoSnapshot;
    clearUndoTimer();
    setUndoSnapshot(null);
    const restored = await restoreMealLog(snap);
    if (restored) {
      runLayoutAnim();
      setMeals((prev) => {
        const next = [...prev, restored];
        next.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        return next;
      });
    }
  }, [undoSnapshot, clearUndoTimer, runLayoutAnim]);

  const handleDeleteMeal = useCallback(
    async (item: MealLog) => {
      const snapshot: MealLog = { ...item };
      runLayoutAnim();
      setMeals((prev) => prev.filter((m) => m.id !== item.id));
      const ok = await deleteMealLog(item.id, item.date);
      if (!ok) {
        runLayoutAnim();
        setMeals((prev) => {
          const next = [...prev, snapshot];
          next.sort(
            (a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
          return next;
        });
        return;
      }
      clearUndoTimer();
      setUndoSnapshot(snapshot);
      undoTimerRef.current = setTimeout(() => {
        setUndoSnapshot(null);
        undoTimerRef.current = null;
      }, UNDO_SNACK_MS);
    },
    [runLayoutAnim, clearUndoTimer],
  );

  const renderEmbeddedMealLine = (item: MealLog, index: number, total: number) => {
    const rawTitle =
      (item.product_display_name?.trim()) ||
      (item.title && item.title.trim()) ||
      getMealTypeLabel(item.meal_type);
    const { clean: title, note: prepNote } = extractPrepNote(rawTitle);
    const uri = item.photo_url?.trim() ? item.photo_url : null;
    const k = item.energy_kcal != null && item.energy_kcal > 0 ? Math.round(item.energy_kcal) : null;
    const isLast = index === total - 1;
    return (
      <Swipeable
        key={item.id}
        friction={2}
        overshootRight={false}
        renderRightActions={() => (
          <View style={styles.swipeDeleteActionsWrap}>
            <GHTouchableOpacity
              style={styles.swipeDeleteReveal}
              onPress={() => handleDeleteMeal(item)}
              activeOpacity={0.9}
            >
              <MaterialCommunityIcons name="close" size={10} color="#FFFFFF" />
            </GHTouchableOpacity>
          </View>
        )}
      >
        <Pressable
          onPress={() => onEmbeddedMealPress?.(item)}
          style={({ pressed }) => [
            styles.embeddedRowFront,
            pressed && styles.embeddedRowPressed,
            !isLast && styles.embeddedRowDivider,
          ]}
        >
          {uri ? (
            <Image source={{ uri }} style={styles.embeddedThumb} />
          ) : (
            <View style={styles.embeddedThumbPlaceholder}>
              <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={COLORS.textVariant} />
            </View>
          )}
          <View style={styles.embeddedLineBody}>
            <Text style={styles.embeddedLineTitle} numberOfLines={2}>
              {title}
            </Text>
            {prepNote ? (
              <Text style={styles.embeddedLinePrepNote}>{prepNote}</Text>
            ) : null}
          </View>
          <View style={styles.embeddedRightCol}>
            <Text style={styles.embeddedLinePortion} numberOfLines={1}>
              {formatPortionUnit(item)}
            </Text>
            {k != null ? (
              <Text style={styles.embeddedKcal}>{k} kcal</Text>
            ) : (
              <Text style={styles.embeddedKcalMuted}>—</Text>
            )}
          </View>
          <View style={styles.embeddedCheckWrap}>
            <MaterialCommunityIcons name="check" size={9} color="#FFFFFF" />
          </View>
        </Pressable>
      </Swipeable>
    );
  };

  const renderMealCard = ({ item }: { item: MealLog }) => {
    const title =
      (item.product_display_name?.trim()) ||
      (item.title && item.title.trim()) ||
      getMealTypeLabel(item.meal_type);
    const uri = item.photo_url?.trim() ? item.photo_url : PLACEHOLDER_MEAL_IMAGE;
    const typeLabel = getMealTypeLabel(item.meal_type);

    return (
      <View style={styles.mealCard}>
        <Image source={{ uri }} style={styles.mealImage} />
        <View style={styles.mealContent}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleSection}>
              <Text style={styles.mealTime}>
                {formatMealTime(item.created_at)} · {typeLabel}
              </Text>
              <Text style={styles.mealName}>{title}</Text>
              {item.energy_kcal != null && item.energy_kcal > 0 ? (
                <Text style={styles.mealKcal}>{Math.round(item.energy_kcal)} kcal</Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderShoppingItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity style={styles.shoppingItemCard}>
      <Text style={styles.shoppingIcon}>{item.icon}</Text>
      <View style={styles.shoppingItemContent}>
        <Text style={styles.shoppingItemName}>{item.name}</Text>
        <Text style={styles.shoppingItemCategory}>{item.quantity} - {item.category}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={
          embedded
            ? undefined
            : Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true },
              )
        }
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: embedded ? 6 : insets.top + HEADER_ROW_HEIGHT,
          paddingBottom: embedded ? 16 : 0,
        }}
      >
        {embedded ? (
          <>
            <View style={styles.dayScrollerEmb}>
              <FlatList
                data={weekDays}
                renderItem={renderDayButton}
                keyExtractor={(item) => item.iso}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>

            {loadingMeals ? (
              <View style={styles.embeddedLoading}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : (
              <>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryKcalMain}>
                    {Math.round(consumedKcal).toLocaleString('es-AR')} /{' '}
                    {targetCalories.toLocaleString('es-AR')}{' '}
                    <Text style={styles.summaryKcalUnit}>kcal</Text>
                  </Text>
                  <View style={styles.summaryBarTrack}>
                    <View style={[styles.summaryBarFill, { width: `${kcalBarPct}%` }]} />
                  </View>
                  <Text style={styles.summaryBand}>
                    Banda orientativa ~{kcalBandLow.toLocaleString('es-AR')}–
                    {kcalBandHigh.toLocaleString('es-AR')} kcal
                  </Text>
                  <View style={styles.summaryMacroGrid}>
                    <View style={styles.summaryMacroCol}>
                      <Text style={styles.summaryMacroLabel}>Proteína</Text>
                      <Text style={styles.summaryMacroVal}>
                        {Math.round(consumedMacros.p)} / {macroTargets.protein} g
                      </Text>
                      <View style={styles.summaryMacroBarBg}>
                        <View
                          style={[
                            styles.summaryMacroBarFill,
                            {
                              width: `${macroPct(consumedMacros.p, macroTargets.protein)}%`,
                              backgroundColor: themeColors.primary.default,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.summaryMacroCol}>
                      <Text style={styles.summaryMacroLabel}>Carbs</Text>
                      <Text style={styles.summaryMacroVal}>
                        {Math.round(consumedMacros.c)} / {macroTargets.carbs} g
                      </Text>
                      <View style={styles.summaryMacroBarBg}>
                        <View
                          style={[
                            styles.summaryMacroBarFill,
                            {
                              width: `${macroPct(consumedMacros.c, macroTargets.carbs)}%`,
                              backgroundColor: themeColors.secondary.default,
                            },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.summaryMacroCol}>
                      <Text style={styles.summaryMacroLabel}>Grasas</Text>
                      <Text style={styles.summaryMacroVal}>
                        {Math.round(consumedMacros.f)} / {macroTargets.fat} g
                      </Text>
                      <View style={styles.summaryMacroBarBg}>
                        <View
                          style={[
                            styles.summaryMacroBarFill,
                            {
                              width: `${macroPct(consumedMacros.f, macroTargets.fat)}%`,
                              backgroundColor: themeColors.tertiary.default,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.embeddedSlots}>
                  {MEAL_SLOT_ORDER.map((slot) => {
                    const logs = mealsByType[slot];
                    const t = sumLogs(logs);
                    const label = getMealTypeLabel(slot);
                    return (
                      <View key={slot} style={styles.slotCardEmbedded}>
                        <Text style={styles.slotTitleEmbedded}>{label}</Text>
                        <View style={styles.slotStatsRow}>
                          <MaterialCommunityIcons name="fire" size={15} color="#F97316" />
                          <Text style={styles.slotStatsText}>
                            {Math.round(t.kcal)} kcal · {Math.round(t.p)} P | {Math.round(t.c)} C |{' '}
                            {Math.round(t.f)} G
                          </Text>
                        </View>
                        {logs.length > 0 ? (
                          <View style={styles.slotLines}>
                            {logs.map((m, idx) => renderEmbeddedMealLine(m, idx, logs.length))}
                          </View>
                        ) : (
                          <Text style={styles.slotEmptyEmbedded}>Sin registros en este momento.</Text>
                        )}
                        <TouchableOpacity
                          style={styles.slotAdd}
                          onPress={() => onRequestAddForSlot?.(slot)}
                          activeOpacity={0.85}
                        >
                          <MaterialCommunityIcons name="plus" size={22} color={COLORS.textVariant} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <View style={styles.dayScrollerContainer}>
              <FlatList
                data={weekDays}
                renderItem={renderDayButton}
                keyExtractor={(item) => item.iso}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
              />
            </View>

            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.headerTitle}>NUTRICIÓN</Text>
                <Text style={[styles.headerTitle, { color: COLORS.primary }]}>CONSCIENTE</Text>
                <View style={styles.headerMeta}>
                  <Text style={styles.headerMetaLabel}>
                    {targetCalories.toLocaleString('es-AR')} kcal
                  </Text>
                  <Text style={[styles.headerMetaLabel, { color: COLORS.textVariant }]}>Meta diaria</Text>
                </View>
              </View>
              <View style={styles.calorieRemaining}>
                <Text style={styles.remainingLabel}>Restantes (kcal)</Text>
                {hasKcalTotals ? (
                  <>
                    <Text style={styles.remainingValue}>{remainingKcal}</Text>
                    <Text style={styles.remainingHint}>
                      Consumidas {Math.round(consumedKcal)} kcal
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={[styles.remainingValue, styles.remainingDash]}>—</Text>
                    <Text style={styles.remainingHint}>Registrá porciones con kcal</Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.mealsContainer}>
              {loadingMeals ? (
                <View style={styles.mealsLoading}>
                  <ActivityIndicator color={COLORS.primary} />
                </View>
              ) : meals.length === 0 ? (
                <Text style={styles.emptyMeals}>
                  No hay comidas registradas para este día. Usá el botón + para cargar una comida.
                </Text>
              ) : (
                <FlatList
                  data={meals}
                  renderItem={renderMealCard}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={styles.mealSpacer} />}
                />
              )}
            </View>
          </>
        )}

        {!embedded ? (
          <>
            <View style={styles.shoppingSection}>
              <View style={styles.shoppingHeader}>
                <Text style={styles.shoppingTitle}>LISTA DE COMPRAS</Text>
                <View style={styles.itemsCount}>
                  <Text style={styles.itemsCountText}>{SHOPPING_ITEMS.length} items</Text>
                </View>
              </View>
              <View style={styles.shoppingGrid}>
                <FlatList
                  data={SHOPPING_ITEMS}
                  renderItem={renderShoppingItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  columnWrapperStyle={styles.shoppingGridRow}
                />
              </View>
              <TouchableOpacity style={styles.manageListButton}>
                <Text style={styles.manageListButtonText}>Gestionar Lista Completa</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {!embedded ? (
        <AppProgressiveHeader
          scrollY={scrollY}
          topInset={insets.top}
          onHomePress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Inicio' })}
          onAvatarPress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Perfil' })}
        />
      ) : null}
    </View>

      {undoSnapshot ? (
        <View
          pointerEvents="box-none"
          style={[styles.undoSnackbarOverlay, { bottom: undoBottomOffset }]}
        >
          <Animated.View
            style={[
              styles.undoSnackbar,
              {
                opacity: snackOpacity,
                transform: [{ translateY: snackTranslate }],
              },
            ]}
          >
            <Text style={styles.undoSnackbarText}>Ítem eliminado</Text>
            <TouchableOpacity
              onPress={() => void handleUndoDelete()}
              activeOpacity={0.85}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.undoSnackbarAction}>Deshacer</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      ) : null}

      {mealAddedFeedback ? (
        <View
          pointerEvents="box-none"
          style={[styles.undoSnackbarOverlay, { bottom: addedBottomOffset, zIndex: 3 }]}
        >
          <Animated.View
            style={[
              styles.addedSnackbar,
              {
                opacity: addedOpacity,
                transform: [{ translateY: addedTranslate }],
              },
            ]}
          >
            <Text style={styles.addedSnackbarText}>{mealAddedFeedback}</Text>
          </Animated.View>
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  undoSnackbarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  undoSnackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: `${COLORS.text}14`,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  undoSnackbarText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  undoSnackbarAction: {
    color: themeColors.primary.default,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
  },
  addedSnackbar: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: `${COLORS.text}14`,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  addedSnackbarText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  dayScrollerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.text}15`,
  },
  dayButton: {
    width: 56,
    height: 80,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${COLORS.text}0A`,
  },
  dayButtonActive: {
    backgroundColor: COLORS.primary,
  },
  dayButtonLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: `${COLORS.text}66`,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dayButtonLabelActive: {
    color: '#000000',
  },
  dayButtonDate: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayButtonDateActive: {
    color: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
    lineHeight: 40,
  },
  headerMeta: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 16,
  },
  headerMetaLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },
  headerLeft: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  calorieRemaining: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  remainingLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  remainingDash: {
    fontSize: 22,
    color: COLORS.textVariant,
  },
  remainingHint: {
    fontSize: 9,
    fontWeight: '500',
    color: `${COLORS.textVariant}99`,
    marginTop: 4,
    maxWidth: 120,
    textAlign: 'right',
  },
  mealsContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  mealsLoading: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMeals: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textVariant,
    lineHeight: 20,
    paddingVertical: 8,
  },
  mealCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 16,
    gap: 16,
  },
  mealImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
  },
  mealContent: {
    flex: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealTitleSection: {
    flex: 1,
  },
  mealTime: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.secondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  mealKcal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    marginTop: 6,
  },
  mealSpacer: {
    height: 12,
  },
  shoppingSection: {
    marginTop: 32,
    marginHorizontal: 16,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
  },
  shoppingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shoppingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  itemsCount: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemsCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  shoppingGrid: {
    marginBottom: 20,
  },
  shoppingGridRow: {
    gap: 12,
    marginBottom: 12,
  },
  shoppingItemCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 12,
  },
  shoppingIcon: {
    fontSize: 24,
  },
  shoppingItemContent: {
    flex: 1,
  },
  shoppingItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  shoppingItemCategory: {
    fontSize: 10,
    fontWeight: '500',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  manageListButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${COLORS.text}1A`,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageListButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  bottomSpacer: {
    height: 32,
  },

  /* —— Lista embebida (Alimentación): compacto, tema oscuro —— */
  dayScrollerEmb: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${COLORS.text}12`,
  },
  dayBtnEmb: {
    width: 44,
    alignItems: 'center',
    marginRight: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayBtnEmbActive: {
    borderColor: `${COLORS.primary}66`,
    backgroundColor: 'rgba(209, 255, 38, 0.1)',
  },
  dayBtnEmbLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: `${COLORS.text}55`,
    letterSpacing: 0.2,
  },
  dayBtnEmbLabelActive: {
    color: COLORS.primary,
  },
  dayBtnEmbNum: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  dayBtnEmbNumActive: {
    color: COLORS.text,
  },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  dayDotOn: {
    backgroundColor: COLORS.secondary,
  },
  embeddedLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 14,
    marginTop: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: `${COLORS.text}10`,
  },
  summaryKcalMain: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  summaryKcalUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textVariant,
  },
  summaryBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: `${COLORS.text}12`,
    marginTop: 12,
    overflow: 'hidden',
  },
  summaryBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  summaryBand: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  summaryMacroGrid: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  summaryMacroCol: {
    flex: 1,
  },
  summaryMacroLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: `${COLORS.text}88`,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryMacroVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  summaryMacroBarBg: {
    height: 3,
    borderRadius: 2,
    backgroundColor: `${COLORS.text}10`,
    marginTop: 6,
    overflow: 'hidden',
  },
  summaryMacroBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  embeddedSlots: {
    marginTop: 12,
    paddingHorizontal: 14,
    gap: 12,
    paddingBottom: 8,
  },
  slotCardEmbedded: {
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: `${COLORS.text}0D`,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  slotTitleEmbedded: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.35,
    marginBottom: 5,
  },
  slotStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  slotStatsText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textVariant,
    flex: 1,
    flexWrap: 'wrap',
  },
  slotLines: {
    marginBottom: 4,
  },
  slotEmptyEmbedded: {
    fontSize: 11,
    color: `${COLORS.text}66`,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  slotAdd: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: `${COLORS.text}06`,
    borderWidth: 1,
    borderColor: `${COLORS.text}14`,
  },
  embeddedRowFront: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  embeddedRowPressed: {
    opacity: 0.88,
  },
  embeddedRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: `${COLORS.text}12`,
  },
  embeddedThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHigh,
  },
  embeddedThumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  embeddedLineBody: {
    flex: 1,
    minWidth: 0,
  },
  embeddedLineTitle: {
    fontSize: 13,
    fontWeight: '400',
    color: COLORS.text,
    lineHeight: 17,
  },
  embeddedLinePrepNote: {
    fontSize: 11,
    fontWeight: '400',
    color: COLORS.textVariant,
    marginTop: 1,
  },
  embeddedLinePortion: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
  },
  embeddedRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    maxWidth: 90,
    gap: 2,
  },
  embeddedKcal: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textVariant,
    textAlign: 'right',
  },
  embeddedKcalMuted: {
    fontSize: 11,
    fontWeight: '500',
    color: `${COLORS.text}40`,
  },
  swipeDeleteActionsWrap: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  swipeDeleteReveal: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF1744',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#FF1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 4,
    elevation: 3,
  },
  embeddedCheckWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: themeColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: themeColors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default ComidasScreen;
