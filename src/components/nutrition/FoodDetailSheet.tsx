import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import {
  macrosForGrams,
  setFoodFavorite,
  deleteFood,
  resolveImageUrl,
  type FoodRow,
} from '../../services/foodService';
import {
  getMealTypeLabel,
  addMealFromFoodWithPortion,
  type MealLog,
  type MealType,
} from '../../services/mealService';

const MEAL_ORDER: MealType[] = ['DES', 'ALM', 'MER', 'CEN'];

export type FoodDetailPayload =
  | {
      kind: 'food';
      food: FoodRow;
      /** Momento sugerido al abrir desde Plan / Buscar */
      mealType: MealType;
      dateISO: string;
    }
  | { kind: 'meal_log'; log: MealLog };

type Props = {
  visible: boolean;
  onClose: () => void;
  payload: FoodDetailPayload | null;
  /** Tras agregar desde catálogo */
  onAdded?: () => void;
  /** Tras cambiar favorito (para refrescar listado / payload) */
  onFoodFavoriteChange?: (food: FoodRow) => void;
  /** Tras eliminar alimento desde detalle */
  onFoodDeleted?: (foodId: string) => void;
};

function fmtG(v: number | null | undefined): string {
  if (v == null || Number.isNaN(Number(v))) return '—';
  const n = Number(v);
  return n % 1 === 0 ? String(Math.round(n)) : n.toFixed(1).replace('.', ',');
}

function macroKcalParts(p?: number | null, c?: number | null, f?: number | null) {
  const P = Math.max(0, Number(p) || 0);
  const C = Math.max(0, Number(c) || 0);
  const F = Math.max(0, Number(f) || 0);
  const kp = P * 4;
  const kc = C * 4;
  const kf = F * 9;
  const t = kp + kc + kf;
  if (t <= 0) return { pPct: 33, cPct: 34, fPct: 33, kp, kc, kf };
  return { pPct: (kp / t) * 100, cPct: (kc / t) * 100, fPct: (kf / t) * 100, kp, kc, kf };
}

/** Dark design system — coherente con el resto de la app */
const D = {
  bg:         '#111111',
  surface:    '#1a1a1a',
  surfaceHi:  '#222222',
  text:       '#FFFFFF',
  textMuted:  'rgba(255,255,255,0.62)',
  textSoft:   'rgba(255,255,255,0.36)',
  border:     'rgba(255,255,255,0.08)',
  borderMed:  'rgba(255,255,255,0.12)',
} as const;

export function FoodDetailSheet({ visible, onClose, payload, onAdded, onFoodFavoriteChange, onFoodDeleted }: Props) {
  const insets = useSafeAreaInsets();
  const [gramsStr, setGramsStr] = useState('100');
  const [mealType, setMealType] = useState<MealType>('DES');
  const [infoOpen, setInfoOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [favorite, setFavorite] = useState(false);

  /** Swipe-to-close */
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 90 || g.vy > 1.4) {
          Animated.timing(translateY, {
            toValue: 600,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 300,
          }).start();
        }
      },
    }),
  ).current;

  const isFood = payload?.kind === 'food';
  const food = isFood ? payload.food : null;
  const log = payload?.kind === 'meal_log' ? payload.log : null;

  useEffect(() => {
    if (!visible || !payload) return;
    if (payload.kind === 'food') {
      const g =
        payload.food.default_serving_grams != null &&
        Number(payload.food.default_serving_grams) > 0
          ? Math.round(Number(payload.food.default_serving_grams))
          : 100;
      setGramsStr(String(g));
      setMealType(payload.mealType);
    }
    setInfoOpen(false);
    if (payload?.kind === 'food') {
      setFavorite(!!payload.food.is_favorite);
    } else {
      setFavorite(false);
    }
    translateY.setValue(0);
  }, [visible, payload]);

  const totalsFood = useMemo(() => {
    if (!food) return null;
    const parsed = parseFloat(gramsStr.replace(',', '.'));
    const g = Math.max(1, Math.round(Number.isFinite(parsed) ? parsed : 100));
    return macrosForGrams(food.kcal_100g, food.protein_g_100g, food.carbs_g_100g, food.fat_g_100g, g);
  }, [food, gramsStr]);

  const barFood = useMemo(() => {
    if (!totalsFood) return null;
    return macroKcalParts(totalsFood.protein_g, totalsFood.carbs_g, totalsFood.fat_g);
  }, [totalsFood]);

  const barLog = useMemo(() => {
    if (!log) return null;
    return macroKcalParts(log.protein_g, log.carbs_g, log.fat_g);
  }, [log]);

  const title = useMemo(() => {
    if (food) return food.name.trim();
    if (log) return log.product_display_name?.trim() || log.title?.trim() || 'Registro';
    return '';
  }, [food, log]);

  const subtitle = useMemo(() => {
    if (food) return food.brand?.trim() || 'Genérico';
    if (log) return getMealTypeLabel(log.meal_type);
    return '';
  }, [food, log]);

  const handleAdd = useCallback(async () => {
    if (!food || !payload || payload.kind !== 'food') return;
    const parsed = parseFloat(gramsStr.replace(',', '.'));
    const g = Math.max(1, Math.round(Number.isFinite(parsed) ? parsed : 100));
    setSaving(true);
    try {
      const ok = await addMealFromFoodWithPortion(food, mealType, payload.dateISO, g);
      if (ok) { onAdded?.(); onClose(); }
    } finally {
      setSaving(false);
    }
  }, [food, payload, gramsStr, mealType, onAdded, onClose]);

  const pickMeal = useCallback(() => {
    Alert.alert(
      'Momento del día',
      '¿Dónde querés registrar este alimento?',
      [
        ...MEAL_ORDER.map((mt) => ({ text: getMealTypeLabel(mt), onPress: () => setMealType(mt) })),
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }, []);

  const toggleFavorite = useCallback(async () => {
    if (!food) return;
    const next = !favorite;
    setFavorite(next);
    const updated = await setFoodFavorite(food.id, next);
    if (updated) {
      setFavorite(!!updated.is_favorite);
      onFoodFavoriteChange?.(updated);
    } else {
      setFavorite(!next);
    }
  }, [food, favorite, onFoodFavoriteChange]);

  const handleDeleteFromCatalog = useCallback(() => {
    if (!food) return;
    Alert.alert(
      'Eliminar alimento',
      `¿Querés eliminar "${food.name}" de tu lista?`,
      [
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const ok = await deleteFood(food.id);
              if (ok) {
                onFoodDeleted?.(food.id);
                onClose();
              } else {
                Alert.alert('Error', 'No se pudo eliminar el alimento. Reintentá.');
              }
            })();
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }, [food, onClose, onFoodDeleted]);

  if (!payload) return null;

  const showAdd = payload.kind === 'food';
  const heroImageUri = (food ? resolveImageUrl(food) : null) ?? log?.photo_url?.trim() ?? null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        {/* Backdrop táctil */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.backdropAndroid]} />
          )}
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY }] },
          ]}
        >
          {/* ── Handle: toca o desliza para cerrar ─────────────────── */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          {/* ── Favorito flotante (solo en modo food) ──────────────── */}
          {food ? (
            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => void toggleFavorite()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <MaterialCommunityIcons
                name={favorite ? 'heart' : 'heart-outline'}
                size={22}
                color={favorite ? colors.tertiary.default : D.textMuted}
              />
            </TouchableOpacity>
          ) : null}

          {/* ── Cuerpo scrolleable ─────────────────────────────────── */}
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero */}
            <View style={styles.heroBlock}>
              <View style={styles.heroImageWrap}>
                {heroImageUri ? (
                  <Image
                    source={{ uri: heroImageUri }}
                    style={styles.heroImage}
                  />
                ) : (
                  <View style={styles.heroPlaceholder}>
                    <MaterialCommunityIcons name="food-apple-outline" size={30} color={D.textSoft} />
                  </View>
                )}
              </View>

              {food?.source === 'openfoodfacts' ? (
                <View style={styles.offBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {showAdd && food && totalsFood ? (
              <Text style={styles.portionHint}>
                Datos según {gramsStr.trim() || '100'} g
                {food.default_serving_grams ? ` · porción típica ${food.default_serving_grams} g` : ''}
              </Text>
            ) : log ? (
              <Text style={styles.portionHint}>
                Registro del plan ·{' '}
                {log.portion_grams != null && log.portion_grams > 0
                  ? `${Math.round(Number(log.portion_grams))} g`
                  : 'porción registrada'}
              </Text>
            ) : null}

            {/* Macro cards */}
            <View style={styles.macroCards}>
              {showAdd && totalsFood ? (
                <>
                  <MacroCard label="Energía"   value={`${Math.round(totalsFood.energy_kcal)}`} unit="kcal" />
                  <MacroCard label="Proteínas" value={fmtG(totalsFood.protein_g)}              unit="g" />
                  <MacroCard label="Carbs"     value={fmtG(totalsFood.carbs_g)}                unit="g" />
                  <MacroCard label="Grasas"    value={fmtG(totalsFood.fat_g)}                  unit="g" />
                </>
              ) : log ? (
                <>
                  <MacroCard label="Energía"   value={log.energy_kcal != null ? `${Math.round(Number(log.energy_kcal))}` : '—'} unit="kcal" />
                  <MacroCard label="Proteínas" value={fmtG(log.protein_g)} unit="g" />
                  <MacroCard label="Carbs"     value={fmtG(log.carbs_g)}   unit="g" />
                  <MacroCard label="Grasas"    value={fmtG(log.fat_g)}     unit="g" />
                </>
              ) : null}
            </View>

            {/* Barra distribución */}
            {(showAdd ? barFood : barLog) ? (
              <View style={styles.barSection}>
                <View style={styles.barTrack}>
                  {showAdd && barFood ? (
                    <>
                      <View style={[styles.barSeg, { flex: barFood.pPct, backgroundColor: colors.primary.dark }]} />
                      <View style={[styles.barSeg, { flex: barFood.cPct, backgroundColor: colors.secondary.dark }]} />
                      <View style={[styles.barSeg, { flex: barFood.fPct, backgroundColor: colors.tertiary.dark }]} />
                    </>
                  ) : barLog ? (
                    <>
                      <View style={[styles.barSeg, { flex: barLog.pPct, backgroundColor: colors.primary.dark }]} />
                      <View style={[styles.barSeg, { flex: barLog.cPct, backgroundColor: colors.secondary.dark }]} />
                      <View style={[styles.barSeg, { flex: barLog.fPct, backgroundColor: colors.tertiary.dark }]} />
                    </>
                  ) : null}
                </View>
                <View style={styles.legendRow}>
                  <LegendDot color={colors.primary.default}   label={`Prot. ${Math.round((showAdd ? barFood : barLog)?.pPct ?? 0)}%`} />
                  <LegendDot color={colors.secondary.default} label={`Carbs ${Math.round((showAdd ? barFood : barLog)?.cPct ?? 0)}%`} />
                  <LegendDot color={colors.tertiary.default}  label={`Grasas ${Math.round((showAdd ? barFood : barLog)?.fPct ?? 0)}%`} />
                </View>
              </View>
            ) : null}

            {/* Info expandible */}
            <TouchableOpacity
              style={styles.infoToggle}
              onPress={() => setInfoOpen((v) => !v)}
              activeOpacity={0.85}
            >
              <Text style={styles.infoToggleText}>Información nutricional</Text>
              <MaterialCommunityIcons
                name={infoOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={D.textSoft}
              />
            </TouchableOpacity>
            {infoOpen ? (
              <View style={styles.infoPanel}>
                {showAdd && food ? (
                  <>
                    <InfoRow label="Por 100 g — Energía"        value={`${food.kcal_100g ?? '—'} kcal`} />
                    <InfoRow label="Por 100 g — Proteínas"      value={`${fmtG(food.protein_g_100g)} g`} />
                    <InfoRow label="Por 100 g — Carbohidratos"  value={`${fmtG(food.carbs_g_100g)} g`} />
                    <InfoRow label="Por 100 g — Grasas"         value={`${fmtG(food.fat_g_100g)} g`} />
                  </>
                ) : log ? (
                  <>
                    <InfoRow label="Momento"   value={getMealTypeLabel(log.meal_type)} />
                    <InfoRow label="Origen"    value={log.macro_source ?? '—'} />
                    <InfoRow label="Registrado" value={new Date(log.created_at).toLocaleString('es-AR')} />
                  </>
                ) : null}
              </View>
            ) : null}

            {/* Inputs gramos / porción */}
            {showAdd && food ? (
              <View style={styles.inputsRow}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Gramos</Text>
                  <TextInput
                    style={styles.inputField}
                    keyboardType="number-pad"
                    value={gramsStr}
                    onChangeText={setGramsStr}
                    placeholder="100"
                    placeholderTextColor={D.textSoft}
                  />
                </View>
                <View style={[styles.inputBox, { flex: 1.4 }]}>
                  <Text style={styles.inputLabel}>Porción</Text>
                  <Text style={styles.inputStatic} numberOfLines={2}>
                    {food.default_serving_grams
                      ? `Referencia ${food.default_serving_grams} g`
                      : 'Ajustá los gramos'}
                  </Text>
                </View>
              </View>
            ) : null}

            {food?.openfoodfacts_code ? (
              <Text style={styles.offAttr}>
                Datos nutricionales: Open Food Facts (ODbL) · {food.openfoodfacts_code}
              </Text>
            ) : null}
          </ScrollView>

          {/* ── Footer acción ──────────────────────────────────────── */}
          <View style={styles.sheetFooter}>
            {showAdd ? (
              <>
                <View style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}>
                  {saving ? (
                    <ActivityIndicator color={colors.primary.text} style={{ paddingVertical: 14 }} />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.primaryBtnMain}
                        onPress={() => void handleAdd()}
                        activeOpacity={0.92}
                      >
                        <Text style={styles.primaryBtnText}>
                          Agregar a {getMealTypeLabel(mealType)}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickMeal} style={styles.primaryBtnChevron} hitSlop={8} activeOpacity={0.85}>
                        <View style={styles.primaryBtnDivider} />
                        <MaterialCommunityIcons name="chevron-down" size={22} color={colors.primary.text} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteFromCatalog} activeOpacity={0.88}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#f08a8a" />
                  <Text style={styles.deleteBtnText}>Eliminar de mi lista</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.9}>
                <Text style={styles.secondaryBtnText}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MacroCard({ label, value, unit }: { label: string; value: string; unit: string; accent?: string }) {
  return (
    <View style={styles.macroCard}>
      <Text style={styles.macroCardValue}>
        {value}<Text style={styles.macroCardUnit}> {unit}</Text>
      </Text>
      <Text style={styles.macroCardLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoRowLabel}>{label}</Text>
      <Text style={styles.infoRowVal}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdropWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropAndroid: {
    backgroundColor: 'rgba(0,0,0,0.78)',
  },

  /** Sheet principal — overflow visible para que el picker overlay no quede clipeado */
  sheet: {
    backgroundColor: D.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.borderMed,
    maxHeight: '92%',
  },

  /** Handle area — captura el gesto de deslizar */
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  /** Favorito — esquina superior derecha, flotante sobre el scroll */
  favBtn: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: D.surfaceHi,
    borderWidth: 1,
    borderColor: D.borderMed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },

  heroBlock: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  heroImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: D.surface,
  },
  heroPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 16,
    backgroundColor: D.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: D.border,
  },
  offBadge: {
    marginTop: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: D.borderMed,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: D.text,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: D.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  portionHint: {
    fontSize: 12,
    color: D.textSoft,
    marginTop: 10,
    lineHeight: 17,
    textAlign: 'center',
  },

  macroCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  macroCard: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '25%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.surface,
  },
  macroCardValue: {
    fontSize: 16,
    fontWeight: '800',
    color: D.text,
  },
  macroCardUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: D.textSoft,
  },
  macroCardLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: D.textMuted,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },

  barSection: { marginTop: 20 },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  barSeg: { minWidth: 2, height: '100%' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:  { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: D.textMuted, fontWeight: '600' },

  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.surface,
  },
  infoToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: D.text,
  },
  infoPanel: {
    paddingBottom: 8,
    gap: 0,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: D.border,
  },
  infoRowLabel: { fontSize: 13, color: D.textMuted },
  infoRowVal: {
    fontSize: 13,
    fontWeight: '600',
    color: D.text,
    flexShrink: 1,
    textAlign: 'right',
  },

  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  inputBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: D.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: D.surface,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: D.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  inputField: {
    fontSize: 18,
    fontWeight: '700',
    color: D.text,
    padding: 0,
  },
  inputStatic: {
    fontSize: 13,
    fontWeight: '600',
    color: D.textMuted,
  },
  offAttr: {
    fontSize: 10,
    color: D.textSoft,
    marginTop: 14,
    lineHeight: 14,
    textAlign: 'center',
  },

  sheetFooter: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.primary.default,
    borderRadius: 14,
    minHeight: 52,
    overflow: 'hidden',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnMain: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary.text,
    letterSpacing: 0.2,
  },
  primaryBtnChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 4,
  },
  primaryBtnDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(14,14,14,0.22)',
    marginRight: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: D.borderMed,
    backgroundColor: D.surface,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: D.text,
  },
  deleteBtn: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(240,138,138,0.35)',
    backgroundColor: 'rgba(126,30,30,0.2)',
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f08a8a',
  },
});
