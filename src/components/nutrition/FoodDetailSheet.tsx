import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { macrosForGrams, type FoodRow } from '../../services/foodService';
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
  return {
    pPct: (kp / t) * 100,
    cPct: (kc / t) * 100,
    fPct: (kf / t) * 100,
    kp,
    kc,
    kf,
  };
}

export function FoodDetailSheet({ visible, onClose, payload, onAdded }: Props) {
  const insets = useSafeAreaInsets();
  const [gramsStr, setGramsStr] = useState('100');
  const [mealType, setMealType] = useState<MealType>('DES');
  const [infoOpen, setInfoOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
  }, [visible, payload]);

  const totalsFood = useMemo(() => {
    if (!food) return null;
    const parsed = parseFloat(gramsStr.replace(',', '.'));
    const g = Math.max(1, Math.round(Number.isFinite(parsed) ? parsed : 100));
    return macrosForGrams(
      food.kcal_100g,
      food.protein_g_100g,
      food.carbs_g_100g,
      food.fat_g_100g,
      g,
    );
  }, [food, gramsStr]);

  const barFood = useMemo(() => {
    if (!totalsFood) return null;
    return macroKcalParts(
      totalsFood.protein_g,
      totalsFood.carbs_g,
      totalsFood.fat_g,
    );
  }, [totalsFood]);

  const barLog = useMemo(() => {
    if (!log) return null;
    return macroKcalParts(log.protein_g, log.carbs_g, log.fat_g);
  }, [log]);

  const title = useMemo(() => {
    if (food) return food.name.trim();
    if (log) {
      return (
        (log.product_display_name?.trim()) ||
        (log.title?.trim()) ||
        'Registro'
      );
    }
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
      if (ok) {
        onAdded?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }, [food, payload, gramsStr, mealType, onAdded, onClose]);

  const pickMeal = useCallback(() => {
    Alert.alert(
      'Momento del día',
      '¿Dónde querés registrar este alimento?',
      [
        ...MEAL_ORDER.map((mt) => ({
          text: getMealTypeLabel(mt),
          onPress: () => setMealType(mt),
        })),
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  }, []);

  if (!payload) return null;

  const showAdd = payload.kind === 'food';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdropWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.backdropAndroid]} />
          )}
        </Pressable>

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 12), maxHeight: '92%' },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.headerIconBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn} hitSlop={8}>
                <MaterialCommunityIcons name="heart-outline" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} hitSlop={8}>
                <MaterialCommunityIcons name="share-variant-outline" size={21} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} hitSlop={8}>
                <MaterialCommunityIcons name="dots-horizontal" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.heroImageWrap}>
              {log?.photo_url?.trim() ? (
                <Image source={{ uri: log.photo_url }} style={styles.heroImage} />
              ) : (
                <View style={styles.heroPlaceholder}>
                  <MaterialCommunityIcons name="food-apple-outline" size={48} color={colors.text.tertiary} />
                </View>
              )}
              {food?.source === 'openfoodfacts' ? (
                <View style={styles.offBadge}>
                  <MaterialCommunityIcons name="check-decagram" size={14} color={colors.secondary.default} />
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

            {/* Tarjetas macros */}
            <View style={styles.macroCards}>
              {showAdd && totalsFood ? (
                <>
                  <MacroCard label="Energía" value={`${Math.round(totalsFood.energy_kcal)}`} unit="kcal" accent="kcal" />
                  <MacroCard label="Proteínas" value={fmtG(totalsFood.protein_g)} unit="g" accent="p" />
                  <MacroCard label="Carbs" value={fmtG(totalsFood.carbs_g)} unit="g" accent="c" />
                  <MacroCard label="Grasas" value={fmtG(totalsFood.fat_g)} unit="g" accent="f" />
                </>
              ) : log ? (
                <>
                  <MacroCard
                    label="Energía"
                    value={log.energy_kcal != null ? `${Math.round(Number(log.energy_kcal))}` : '—'}
                    unit="kcal"
                    accent="kcal"
                  />
                  <MacroCard label="Proteínas" value={fmtG(log.protein_g)} unit="g" accent="p" />
                  <MacroCard label="Carbs" value={fmtG(log.carbs_g)} unit="g" accent="c" />
                  <MacroCard label="Grasas" value={fmtG(log.fat_g)} unit="g" accent="f" />
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
                  <LegendDot
                    color={colors.primary.default}
                    label={`Prot. ${Math.round((showAdd ? barFood : barLog)?.pPct ?? 0)}%`}
                  />
                  <LegendDot
                    color={colors.secondary.default}
                    label={`Carbs ${Math.round((showAdd ? barFood : barLog)?.cPct ?? 0)}%`}
                  />
                  <LegendDot
                    color={colors.tertiary.default}
                    label={`Grasas ${Math.round((showAdd ? barFood : barLog)?.fPct ?? 0)}%`}
                  />
                </View>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.infoToggle}
              onPress={() => setInfoOpen((v) => !v)}
              activeOpacity={0.85}
            >
              <Text style={styles.infoToggleText}>Información nutricional</Text>
              <MaterialCommunityIcons
                name={infoOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.text.tertiary}
              />
            </TouchableOpacity>
            {infoOpen ? (
              <View style={styles.infoPanel}>
                {showAdd && food ? (
                  <>
                    <InfoRow label="Por 100 g — Energía" value={`${food.kcal_100g ?? '—'} kcal`} />
                    <InfoRow label="Por 100 g — Proteínas" value={`${fmtG(food.protein_g_100g)} g`} />
                    <InfoRow label="Por 100 g — Carbohidratos" value={`${fmtG(food.carbs_g_100g)} g`} />
                    <InfoRow label="Por 100 g — Grasas" value={`${fmtG(food.fat_g_100g)} g`} />
                  </>
                ) : log ? (
                  <>
                    <InfoRow label="Momento" value={getMealTypeLabel(log.meal_type)} />
                    <InfoRow label="Origen" value={log.macro_source ?? '—'} />
                    <InfoRow label="Registrado" value={new Date(log.created_at).toLocaleString('es-AR')} />
                  </>
                ) : null}
              </View>
            ) : null}

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
                    placeholderTextColor={colors.text.disabled}
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

          {showAdd ? (
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
          ) : (
            <TouchableOpacity style={styles.secondaryBtn} onPress={onClose} activeOpacity={0.9}>
              <Text style={styles.secondaryBtnText}>Cerrar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

function MacroCard({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent: 'kcal' | 'p' | 'c' | 'f';
}) {
  const border =
    accent === 'kcal'
      ? colors.primary.muted
      : accent === 'p'
        ? colors.primary.muted
        : accent === 'c'
          ? colors.secondary.muted
          : colors.tertiary.muted;
  return (
    <View style={[styles.macroCard, { borderColor: border }]}>
      <Text style={styles.macroCardValue}>
        {value}
        <Text style={styles.macroCardUnit}> {unit}</Text>
      </Text>
      <Text style={styles.macroCardLabel} numberOfLines={2}>
        {label}
      </Text>
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
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    backgroundColor: colors.surface.elevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  heroImageWrap: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  heroImage: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.surface.base,
  },
  heroPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.surface.base,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  offBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(14,14,14,0.85)',
    borderRadius: 12,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  portionHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 10,
    lineHeight: 17,
  },
  macroCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  macroCard: {
    flex: 1,
    minWidth: '22%',
    maxWidth: '25%',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface.base,
  },
  macroCardValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.primary,
  },
  macroCardUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  macroCardLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  barSection: {
    marginTop: 18,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  barSeg: {
    minWidth: 2,
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: colors.text.tertiary, fontWeight: '600' },
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.subtle,
  },
  infoToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  infoPanel: {
    paddingBottom: 8,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 6,
  },
  infoRowLabel: { fontSize: 13, color: colors.text.tertiary },
  infoRowVal: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, flexShrink: 1, textAlign: 'right' },
  inputsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  inputBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  inputField: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  inputStatic: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  offAttr: {
    fontSize: 10,
    color: colors.text.disabled,
    marginTop: 14,
    lineHeight: 14,
  },
  primaryBtn: {
    marginTop: 8,
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
    backgroundColor: 'rgba(14,14,14,0.2)',
    marginRight: 8,
  },
  secondaryBtn: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border.strong,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text.primary,
  },
});
