import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Path, Circle, Rect, Polygon } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgressStore } from '../../store/progressStore';
import { useAuthStore } from '../../store/authStore';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';

const { width } = Dimensions.get('window');
const CARD_PADDING = 16;
const HALF = (width - CARD_PADDING * 2 - 8) / 2;

const C = {
  bg: '#0e0e0e',
  surface: '#161616',
  surfaceMid: '#1e1e1e',
  surfaceHigh: '#262626',
  primary: '#D1FF26',
  primaryDim: '#b8e020',
  secondary: '#00e3fd',
  orange: '#ff734a',
  text: '#ffffff',
  muted: '#888888',
  mutedLo: '#555555',
};

interface Props {
  navigation: any;
}

const ProgresoScreen: React.FC<Props> = ({ navigation }) => {
  const loadProgressData = useProgressStore((s) => s.loadProgressData);
  const measurements     = useProgressStore((s) => s.measurements);
  const todayGoals       = useProgressStore((s) => s.todayGoals);
  const isStale          = useProgressStore((s) => s.isStale);
  const watchConnected   = useAuthStore((s) => s.watchConnected);
  const steps            = useAuthStore((s) => s.steps);
  const insets           = useSafeAreaInsets();
  const scrollY          = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void loadProgressData();
  }, [loadProgressData]);

  const latestM = measurements[0] ?? null;
  const prevM = measurements[1] ?? null;

  const weight = latestM?.weight_kg ?? null;
  const prevWeight = prevM?.weight_kg ?? null;
  const weightChange =
    weight != null && prevWeight != null
      ? parseFloat((weight - prevWeight).toFixed(1))
      : null;

  // Goal percentages from daily_goals
  function goalPct(type: string): number {
    const g = todayGoals.find((g) => g.goal_type === type);
    if (!g || g.target_value === 0) return 0;
    return Math.min(100, Math.round((g.current_value / g.target_value) * 100));
  }

  const workoutPct   = goalPct('training');
  const nutritionPct = goalPct('meals');
  const hydrationPct = goalPct('hydration');

  // Steps card
  const stepsGoalEntry = todayGoals.find((g) => g.goal_type === 'steps');
  const stepsTarget    = stepsGoalEntry?.target_value ?? 10000;
  const stepsPct       = steps != null ? Math.min(100, Math.round((steps / stepsTarget) * 100)) : 0;
  const stepsDisplay   = steps != null ? steps.toLocaleString('es-AR') : '—';
  const stepsSource    = steps == null
    ? null
    : watchConnected ? 'APPLE WATCH' : 'IPHONE';

  // Sparkline – oldest to newest
  const sparklineEntries = useMemo(
    () => [...measurements].reverse().slice(-7),
    [measurements],
  );
  const sparklineWeights = sparklineEntries.map((m) => m.weight_kg ?? 0).filter((w) => w > 0);
  const sparkMin = sparklineWeights.length ? Math.min(...sparklineWeights) : 0;
  const sparkMax = sparklineWeights.length ? Math.max(...sparklineWeights) : 1;
  const sparkRange = sparkMax - sparkMin || 1;
  const sparkHeights = sparklineWeights.map(
    (w) => 20 + ((w - sparkMin) / sparkRange) * 60,
  );

  const weightDisplay = weight != null ? weight.toFixed(1) : '—';
  const weightChangeDisplay =
    weightChange != null
      ? `${weightChange > 0 ? '+' : ''}${weightChange} kg`
      : null;
  const weightChangeBg =
    weightChange == null
      ? C.mutedLo
      : weightChange < 0
        ? C.primaryDim
        : C.orange;

  return (
    <View style={s.root}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + HEADER_ROW_HEIGHT }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      >
        {/* ── Offline banner ─────────────────────────────────────── */}
        {isStale && (
          <View style={s.offlineBanner}>
            <Text style={s.offlineDot}>●</Text>
            <Text style={s.offlineText}>Sin conexión — mostrando último dato conocido</Text>
          </View>
        )}

        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={s.headerEyebrow}>
            <Text style={{ color: C.text }}>TU </Text>
            <Text style={{ color: C.primary }}>PROGRESO</Text>
          </Text>
          <Text style={s.headerSub}>SEMANA 12 · FASE DE TRANSFORMACIÓN</Text>
        </View>

        {/* ── Peso Corporal ───────────────────────────────────────── */}
        <View style={[s.card, { marginHorizontal: CARD_PADDING }]}>
          <View style={s.row}>
            <Text style={s.cardLabel}>PESO CORPORAL</Text>
            {weightChangeDisplay != null && (
              <View style={s.changeBadge}>
                <IconTrendDown color="#000" size={12} />
                <Text style={s.changeBadgeText}>{weightChangeDisplay}</Text>
              </View>
            )}
          </View>
          <View style={s.weightRow}>
            <Text style={s.weightValue}>{weightDisplay}</Text>
            <Text style={s.weightUnit}>kg</Text>
          </View>
          {/* Sparkline */}
          <View style={s.sparkline}>
            {sparkHeights.length > 0
              ? sparkHeights.map((h, i) => (
                  <View
                    key={i}
                    style={[
                      s.sparkBar,
                      {
                        height: `${Math.round(h)}%`,
                        backgroundColor:
                          i === sparkHeights.length - 1 ? C.primary : C.primaryDim,
                        opacity: i === sparkHeights.length - 1 ? 1 : 0.35,
                      },
                    ]}
                  />
                ))
              : [40, 55, 35, 60, 45, 70, 50].map((h, i) => (
                  <View
                    key={i}
                    style={[
                      s.sparkBar,
                      {
                        height: `${h}%`,
                        opacity: i === 6 ? 0.5 : 0.15,
                      },
                    ]}
                  />
                ))}
          </View>
        </View>

        {/* ── Resumen de Metas ────────────────────────────────────── */}
        <View style={[s.card, { marginHorizontal: CARD_PADDING, marginTop: 12 }]}>
          <View style={s.row}>
            <Text style={s.cardLabel}>RESUMEN DE METAS</Text>
            <View style={s.todayBadge}>
              <Text style={s.todayBadgeText}>HOY</Text>
            </View>
          </View>

          <GoalBar icon="training" label="ENTRENAMIENTO" pct={workoutPct} color={C.primary} />
          <GoalBar icon="nutrition" label="NUTRICIÓN" pct={nutritionPct} color={C.primary} />
          <GoalBar icon="hydration" label="HIDRATACIÓN" pct={hydrationPct} color={C.primary} />
        </View>

        {/* ── Pasos + Descanso ────────────────────────────────────── */}
        <View style={[s.row, { marginHorizontal: CARD_PADDING, marginTop: 12, gap: 8 }]}>

          {/* Pasos — datos reales de HealthKit */}
          <View style={[s.card, { flex: 1 }]}>
            <View style={s.row}>
              <IconSteps color={C.secondary} />
              <Text style={[s.cardLabel, { marginLeft: 6 }]}>PASOS</Text>
            </View>

            <Text style={s.halfValue}>{stepsDisplay}</Text>

            {/* Barra de progreso hacia la meta */}
            <View style={s.stepsTrack}>
              <View style={[s.stepsFill, { width: `${stepsPct}%` }]} />
            </View>

            <View style={[s.row, { justifyContent: 'space-between', marginTop: 6 }]}>
              <Text style={s.halfMeta}>META: {stepsTarget.toLocaleString('es-AR')}</Text>
              {stepsSource != null && (
                <View style={s.sourceBadge}>
                  <Text style={s.sourceText}>{stepsSource}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Descanso */}
          <View style={[s.card, { flex: 1 }]}>
            <View style={s.row}>
              <IconMoon color={C.orange} />
              <Text style={[s.cardLabel, { marginLeft: 6 }]}>DESCANSO</Text>
            </View>
            <Text style={s.halfValue}>—</Text>
            <Text style={s.halfMeta}>CALIDAD: —</Text>
          </View>
        </View>

        {/* ── Calorías ────────────────────────────────────────────── */}
        <View style={[s.card, s.caloriesCard, { marginHorizontal: CARD_PADDING, marginTop: 12 }]}>
          {/* Left */}
          <View style={s.caloriesLeft}>
            <View style={s.row}>
              <IconFire color={C.primary} size={18} />
              <Text style={[s.cardLabel, { marginLeft: 6 }]}>CALORÍAS DIARIAS</Text>
            </View>
            <View style={[s.row, { alignItems: 'baseline', marginTop: 8 }]}>
              <Text style={s.caloriesValue}>—</Text>
              <Text style={s.caloriesUnit}>kcal</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={s.caloriesDivider} />

          {/* Right */}
          <View style={s.caloriesRight}>
            <Text style={s.cardLabel}>FALTAN</Text>
            <Text style={s.caloriesRemaining}>—</Text>
          </View>
        </View>

        {/* ── Galería Evolución ───────────────────────────────────── */}
        <View style={{ marginHorizontal: CARD_PADDING, marginTop: 20 }}>
          <View style={s.galleryHeader}>
            <View>
              <Text style={s.galleryTitle}>GALERÍA EVOLUCIÓN</Text>
              <Text style={s.gallerySub}>VISUALIZA TU TRANSFORMACIÓN</Text>
            </View>
            <View style={s.row}>
              <TouchableOpacity style={s.navBtn}>
                <Text style={s.navBtnText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn}>
                <Text style={s.navBtnText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab row */}
          <View style={s.photoTabs}>
            {['FRENTE', 'PERFIL', 'ESPALDA'].map((t, i) => (
              <View key={t} style={[s.photoTab, i === 0 && s.photoTabActive]}>
                <Text style={[s.photoTabText, i === 0 && s.photoTabTextActive]}>{t}</Text>
              </View>
            ))}
          </View>

          {/* Photo placeholder */}
          <View style={s.photoPlaceholder}>
            <Text style={s.photoPlaceholderText}>SIN FOTOS</Text>
            <TouchableOpacity
              style={s.addPhotoBtn}
              onPress={() => navigation.navigate('CargarFotos')}
            >
              <Text style={s.addPhotoBtnText}>+ Agregar foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* ── FAB Registrar ───────────────────────────────────────── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation.navigate('PesoYMedidas')}
      >
        <Text style={s.fabText}>+ Registrar</Text>
      </TouchableOpacity>

      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => (navigation as any).getParent()?.navigate('HomeStack', { screen: 'Inicio' })}
        onAvatarPress={() => (navigation as any).getParent()?.navigate('HomeStack', { screen: 'Perfil' })}
      />
    </View>
  );
};

/* ── SVG Icon components ─────────────────────────────────────────── */
const IconLightning: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="13,2 5,14 11,14 9,22 19,9 13,9" fill={color} />
  </Svg>
);

const IconFork: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 2v6c0 1.66 1.34 3 3 3v9a1 1 0 002 0v-9c1.66 0 3-1.34 3-3V2h-2v5H9V2H6zm9 0v20a1 1 0 002 0V14h2V2h-4z"
      fill={color}
    />
  </Svg>
);

const IconDrop: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L6 10.5C6 13.538 8.686 16 12 16s6-2.462 6-5.5L12 2z" fill={color} />
  </Svg>
);

const IconFire: React.FC<{ color: string; size?: number }> = ({ color, size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C10 6 7 8 7 12c0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.5-.5-2.8-1.3-3.9C14.5 9.5 13 11 12 11c1-2.5.5-6 0-9z"
      fill={color}
    />
  </Svg>
);

const IconSteps: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4.5 8.75l-1.8-1.8a1 1 0 00-.7-.3H10l-.95-4.4C8.84 6.8 8 6 7 6H4v2h3l2.6 11H12l-.95-4.25 2.45 2.5V22h2v-5.5l-2.5-2.5.5-2.5 1.5 1.5H20v-2h-2z"
      fill={color}
    />
  </Svg>
);

const IconMoon: React.FC<{ color: string; size?: number }> = ({ color, size = 14 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"
      fill={color}
    />
  </Svg>
);

const IconTrendDown: React.FC<{ color: string; size?: number }> = ({ color, size = 12 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 7l6 6 4-4 8 8" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M17 21h4v-4" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const IconGear: React.FC<{ color: string; size?: number }> = ({ color, size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19.14 12.94c.04-.3.06-.61.06-.94s-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.488.488 0 00-.59-.22l-2.39.96a6.97 6.97 0 00-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.04.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.57 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
      fill={color}
    />
  </Svg>
);

type GoalIconType = 'training' | 'nutrition' | 'hydration';

/* ── Goal bar sub-component ──────────────────────────────────────── */
const GoalBar: React.FC<{
  icon: GoalIconType;
  label: string;
  pct: number;
  color: string;
}> = ({ icon, label, pct, color }) => {
  const IconComp =
    icon === 'training'
      ? IconLightning
      : icon === 'nutrition'
        ? IconFork
        : IconDrop;

  return (
    <View style={gb.row}>
      <View style={[gb.iconWrap, { backgroundColor: `${color}18` }]}>
        <IconComp color={color} size={14} />
      </View>
      <View style={gb.body}>
        <View style={gb.labelRow}>
          <Text style={gb.label}>{label}</Text>
          <Text style={[gb.pct, { color }]}>{pct}%</Text>
        </View>
        <View style={gb.track}>
          <View style={[gb.fill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
};

const gb = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 10,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
  },
  pct: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  track: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});

/* ── Styles ──────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    paddingTop: 48,
  },

  // Header
  header: {
    paddingHorizontal: CARD_PADDING,
    marginBottom: 20,
  },
  headerEyebrow: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 46,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 0.8,
    marginTop: 6,
  },
  // Shared
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
    flex: 1,
  },

  // Weight card
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: C.primary,
  },
  changeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
    gap: 6,
  },
  weightValue: {
    fontSize: 64,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -2,
    lineHeight: 68,
  },
  weightUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 4,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 64,
    marginTop: 12,
  },
  sparkBar: {
    flex: 1,
    backgroundColor: C.primaryDim,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  // Goals card
  todayBadge: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  todayBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.8,
  },

  // Half cards
  halfValue: {
    fontSize: 36,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1,
    marginTop: 8,
  },
  halfMeta: {
    fontSize: 10,
    fontWeight: '600',
    color: C.mutedLo,
    letterSpacing: 0.5,
    marginTop: 4,
  },

  // Steps progress
  stepsTrack: {
    height: 3,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  stepsFill: {
    height: '100%',
    backgroundColor: C.secondary,
    borderRadius: 2,
  },

  // Source badge
  sourceBadge: {
    backgroundColor: 'rgba(0,227,253,0.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceBadgeDim: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  sourceText: {
    fontSize: 8,
    fontWeight: '700',
    color: C.secondary,
    letterSpacing: 0.8,
  },
  sourceTextDim: {
    color: C.mutedLo,
  },

  // Calories card
  caloriesCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: 0,
    overflow: 'hidden',
    minHeight: 88,
  },
  caloriesLeft: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  caloriesDivider: {
    width: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 14,
  },
  caloriesRight: {
    width: 90,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  caloriesValue: {
    fontSize: 36,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -1.5,
  },
  caloriesUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: C.muted,
    marginLeft: 4,
    marginBottom: 2,
  },
  caloriesRemaining: {
    fontSize: 36,
    fontWeight: '900',
    color: C.primary,
    letterSpacing: -1.5,
    marginTop: 8,
  },

  // Gallery
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -0.5,
  },
  gallerySub: {
    fontSize: 9,
    fontWeight: '600',
    color: C.muted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  navBtnText: {
    fontSize: 20,
    color: C.text,
    lineHeight: 24,
  },
  photoTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  photoTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
  },
  photoTabActive: {
    backgroundColor: C.primary,
  },
  photoTabText: {
    fontSize: 10,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 0.6,
  },
  photoTabTextActive: {
    color: '#000',
  },
  photoPlaceholder: {
    height: 260,
    backgroundColor: C.surface,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  photoPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.mutedLo,
    letterSpacing: 1,
  },
  addPhotoBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: C.surfaceHigh,
  },
  addPhotoBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.text,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 12,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 0.3,
  },

  // Offline
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: CARD_PADDING,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#1a1400',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3a3000',
  },
  offlineDot: {
    fontSize: 7,
    color: C.orange,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.orange,
    letterSpacing: 0.3,
  },
});

export default ProgresoScreen;
