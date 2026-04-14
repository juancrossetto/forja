import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  getMeasurementHistory,
  type BodyMeasurement,
} from '../../services/measurementsService';
import { radius } from '../../theme/radius';

const { width } = Dimensions.get('window');
const H_PAD = 24;
const CHART_W = width - H_PAD * 2;
const CHART_H = 200;

const C = {
  bg:           '#0e0e0e',
  surface:      '#161616',
  surfaceHigh:  '#1e1e1e',
  surfaceTop:   '#262626',
  primary:      '#D1FF26',
  primaryDim:   '#c1ed00',
  secondary:    '#00e3fd',
  orange:       '#ff734a',
  text:         '#ffffff',
  muted:        '#888888',
  mutedLo:      '#444444',
  border:       'rgba(255,255,255,0.05)',
};

type RangeKey = '2S' | '1M' | '3M' | '6M' | '1A' | '2A';

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '2S', label: '2 SEM',   days: 14  },
  { key: '1M', label: '1 MES',   days: 30  },
  { key: '3M', label: '3 MESES', days: 90  },
  { key: '6M', label: '6 MESES', days: 180 },
  { key: '1A', label: '1 AÑO',   days: 365 },
  { key: '2A', label: '2 AÑOS',  days: 730 },
];

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function buildLinePath(pts: { x: number; y: number }[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = ((pts[i - 1].x + pts[i].x) / 2).toFixed(1);
    d += ` C ${cpx} ${pts[i - 1].y.toFixed(1)} ${cpx} ${pts[i].y.toFixed(1)} ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`;
  }
  return d;
}

function buildFillPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  const line = buildLinePath(pts);
  const last = pts[pts.length - 1];
  const first = pts[0];
  return `${line} L ${last.x.toFixed(1)} ${CHART_H} L ${first.x.toFixed(1)} ${CHART_H} Z`;
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
                  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return `${day} ${months[d.getMonth()]}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  const today = todayISO();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yIso = yesterday.toISOString().split('T')[0];

  if (iso === today) return 'HOY';
  if (iso === yIso) return 'AYER';
  return formatDate(iso);
}

/* ─────────────────────────────────────────────────────── */

const PesoCorporalDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>('1M');

  useEffect(() => {
    getMeasurementHistory(200).then((data) => {
      setMeasurements(data); // newest first
      setLoading(false);
    });
  }, []);

  /* ── Filtered & sorted oldest→newest for chart ── */
  const filtered = useMemo(() => {
    const days = RANGES.find((r) => r.key === range)!.days;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffISO = cutoff.toISOString().split('T')[0];
    return [...measurements]
      .filter((m) => m.date >= cutoffISO && m.weight_kg != null)
      .reverse(); // oldest first
  }, [measurements, range]);

  /* ── Derived headline values ── */
  const currentWeight = measurements[0]?.weight_kg ?? null;
  const prevWeight    = measurements[1]?.weight_kg ?? null;   // registro anterior (siempre disponible si ≥2)
  const firstWeight   = measurements[measurements.length - 1]?.weight_kg ?? null;
  const totalDiff     = currentWeight != null && firstWeight != null
    ? parseFloat((currentWeight - firstWeight).toFixed(1))
    : null;

  // Diff vs registro inmediatamente anterior
  const prevDiff = currentWeight != null && prevWeight != null
    ? parseFloat((currentWeight - prevWeight).toFixed(1))
    : null;

  // Weekly change: compare current vs 7 days ago (best effort)
  const weeklyChange = useMemo(() => {
    if (measurements.length < 2) return null;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoISO = weekAgo.toISOString().split('T')[0];
    const ref = measurements.find((m) => m.date <= weekAgoISO && m.weight_kg != null);
    if (!ref || currentWeight == null) return null;
    return parseFloat((currentWeight - ref.weight_kg!).toFixed(1));
  }, [measurements, currentWeight]);

  // El valor a mostrar en el badge: preferir semanal, fallback a diferencia con anterior
  const displayDiff  = weeklyChange ?? prevDiff;
  const displayLabel = weeklyChange !== null ? 'ESTA SEMANA' : 'VS ANTERIOR';

  /* ── Weekly rate (trend) ── */
  const weeklyRate = useMemo(() => {
    if (filtered.length < 2) return null;
    const first = filtered[0];
    const last  = filtered[filtered.length - 1];
    if (!first.weight_kg || !last.weight_kg) return null;
    const daysDiff = Math.max(
      1,
      (new Date(last.date).getTime() - new Date(first.date).getTime()) / 86400000,
    );
    const rate = ((last.weight_kg - first.weight_kg) / daysDiff) * 7;
    return parseFloat(rate.toFixed(2));
  }, [filtered]);

  /* ── Consistency: % of days in last 30d with a record ── */
  const consistency = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffISO = cutoff.toISOString().split('T')[0];
    const count = measurements.filter((m) => m.date >= cutoffISO).length;
    return Math.min(100, Math.round((count / 30) * 100));
  }, [measurements]);

  /* ── Chart points ── */
  const chartPoints = useMemo(() => {
    const valid = filtered.filter((m) => m.weight_kg != null);
    if (valid.length < 2) return [];
    const weights = valid.map((m) => m.weight_kg!);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);
    const wRange = maxW - minW || 0.5;
    const pad = 16;
    return valid.map((m, i) => {
      const x = valid.length > 1
        ? (i / (valid.length - 1)) * CHART_W
        : CHART_W / 2;
      const y = CHART_H - pad - ((m.weight_kg! - minW) / wRange) * (CHART_H - pad * 2);
      return { x, y, weight: m.weight_kg!, date: m.date };
    });
  }, [filtered]);

  /* ── X-axis labels ── */
  const xLabels = useMemo(() => {
    if (filtered.length < 2) return [];
    const count = 5;
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i / (count - 1)) * (filtered.length - 1));
      const m = filtered[idx];
      const isToday = m.date === todayISO();
      return {
        label: isToday ? 'HOY' : formatDate(m.date),
        isToday,
      };
    });
  }, [filtered]);

  /* ── Tooltip position (last point) ── */
  const lastPt = chartPoints[chartPoints.length - 1];

  /* ── Trend analysis text ── */
  const trendText = useMemo(() => {
    if (weeklyRate === null) return null;
    const abs = Math.abs(weeklyRate);
    const dir = weeklyRate < 0 ? 'descenso' : 'aumento';
    return `Tu ritmo de ${dir} actual es de ${abs.toFixed(1)} kg/semana.`;
  }, [weeklyRate]);

  /* ── Recent records (last 5) ── */
  const recentRecords = measurements.slice(0, 5);

  /* ─────────────────────────────────────────────────── */

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#000" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <MaterialCommunityIcons name="scale-bathroom" size={18} color={C.primaryDim} />
          <Text style={styles.headerTitle}>PESO CORPORAL</Text>
        </View>

        <TouchableOpacity style={styles.headerBtnGhost} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="close" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >

        {/* ── Estado actual ── */}
        <View style={styles.section}>
          <Text style={styles.eyebrow}>ESTADO ACTUAL</Text>
          <View style={styles.bigWeightRow}>
            <Text style={styles.bigWeight}>
              {currentWeight != null ? currentWeight.toFixed(1) : '—'}
            </Text>
            <Text style={styles.bigUnit}>KG</Text>
          </View>

          {/* Diferencia semanal o vs anterior */}
          {displayDiff !== null && (
            <View style={styles.weeklyBadge}>
              <MaterialCommunityIcons
                name={displayDiff <= 0 ? 'trending-down' : 'trending-up'}
                size={16}
                color={displayDiff <= 0 ? C.secondary : C.orange}
              />
              <Text style={[
                styles.weeklyText,
                { color: displayDiff <= 0 ? C.secondary : C.orange },
              ]}>
                {displayDiff > 0 ? '+' : ''}{displayDiff} KG {displayLabel}
              </Text>
            </View>
          )}

          {/* Diferencia total acumulada */}
          {totalDiff !== null && totalDiff !== displayDiff && (
            <View style={[styles.weeklyBadge, { marginTop: 6 }]}>
              <MaterialCommunityIcons
                name={totalDiff <= 0 ? 'arrow-down-bold' : 'arrow-up-bold'}
                size={14}
                color={totalDiff <= 0 ? C.primaryDim : C.orange}
              />
              <Text style={[
                styles.weeklyText,
                { color: totalDiff <= 0 ? C.primaryDim : C.orange, fontSize: 12 },
              ]}>
                {totalDiff > 0 ? '+' : ''}{totalDiff} KG TOTAL
              </Text>
            </View>
          )}
        </View>

        {/* ── Bento Stats ── */}
        <View style={styles.bentoRow}>
          <View style={[styles.bentoCard, { borderLeftColor: `${C.primaryDim}55` }]}>
            <Text style={styles.bentoLabel}>PESO INICIAL</Text>
            <Text style={styles.bentoValue}>
              {firstWeight != null ? firstWeight.toFixed(1) : '—'}
              <Text style={styles.bentoUnit}> KG</Text>
            </Text>
          </View>

          <View style={[styles.bentoCard, { borderLeftColor: `${C.secondary}55` }]}>
            <Text style={styles.bentoLabel}>PESO ACTUAL</Text>
            <Text style={styles.bentoValue}>
              {currentWeight != null ? currentWeight.toFixed(1) : '—'}
              <Text style={styles.bentoUnit}> KG</Text>
            </Text>
          </View>

          <View style={[styles.bentoCard, styles.bentoCardAccent]}>
            <Text style={styles.bentoLabel}>DIFERENCIA</Text>
            <Text style={[styles.bentoValue, { color: totalDiff != null && totalDiff < 0 ? C.primaryDim : C.orange }]}>
              {totalDiff != null ? (totalDiff > 0 ? '+' : '') + totalDiff.toFixed(1) : '—'}
              <Text style={styles.bentoUnit}> KG</Text>
            </Text>
          </View>
        </View>

        {/* ── Chart Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TENDENCIA DE PROGRESO</Text>

          {/* Range tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.rangeTabs}
          >
            {RANGES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.rangeTab, range === r.key && styles.rangeTabActive]}
                onPress={() => setRange(r.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.rangeTabText, range === r.key && styles.rangeTabTextActive]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chart */}
          <View style={styles.chartBox}>
            {chartPoints.length >= 2 ? (
              <>
                <Svg width={CHART_W} height={CHART_H} style={StyleSheet.absoluteFill}>
                  <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0%" stopColor={C.primaryDim} stopOpacity="0.25" />
                      <Stop offset="100%" stopColor={C.primaryDim} stopOpacity="0" />
                    </LinearGradient>
                  </Defs>

                  {/* Fill */}
                  <Path
                    d={buildFillPath(chartPoints)}
                    fill="url(#grad)"
                  />
                  {/* Line */}
                  <Path
                    d={buildLinePath(chartPoints)}
                    fill="none"
                    stroke={C.primaryDim}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                  {/* Last point dot */}
                  {lastPt && (
                    <Circle
                      cx={lastPt.x}
                      cy={lastPt.y}
                      r={4}
                      fill={C.primary}
                      stroke="#0e0e0e"
                      strokeWidth={2}
                    />
                  )}
                </Svg>

                {/* Tooltip */}
                {lastPt && (
                  <View
                    style={[
                      styles.chartTooltip,
                      {
                        left: Math.min(
                          lastPt.x - 38,
                          CHART_W - 84,
                        ),
                        top: Math.max(0, lastPt.y - 44),
                      },
                    ]}
                    pointerEvents="none"
                  >
                    <Text style={styles.tooltipLabel}>HOY</Text>
                    <Text style={styles.tooltipValue}>{lastPt.weight.toFixed(1)} KG</Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyText}>Sin datos en este período</Text>
              </View>
            )}
          </View>

          {/* X labels */}
          {xLabels.length > 0 && (
            <View style={styles.xLabels}>
              {xLabels.map((l, i) => (
                <Text
                  key={i}
                  style={[styles.xLabel, l.isToday && styles.xLabelToday]}
                >
                  {l.label}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* ── Análisis de tendencia ── */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionAccent} />
            <Text style={styles.sectionTitle}>ANÁLISIS DE TENDENCIA</Text>
          </View>

          <View style={styles.analysisCard}>
            {trendText ? (
              <Text style={styles.analysisText}>{trendText}</Text>
            ) : (
              <Text style={styles.analysisText}>
                Necesitás al menos 2 registros para calcular tu tendencia.
              </Text>
            )}

            {consistency > 0 && (
              <View style={styles.consistencyBox}>
                <MaterialCommunityIcons name="brain" size={16} color={C.secondary} />
                <Text style={styles.consistencyText}>
                  Tu consistencia en el registro es del{' '}
                  <Text style={{ fontWeight: '800' }}>{consistency}%</Text> este mes.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Últimos registros ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionAccent, { backgroundColor: C.secondary }]} />
              <Text style={styles.sectionTitle}>ÚLTIMOS REGISTROS</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.verTodo}>VER TODO</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recordsList}>
            {recentRecords.length === 0 ? (
              <Text style={[styles.analysisText, { color: C.muted }]}>Sin registros aún.</Text>
            ) : (
              recentRecords.map((m, i) => (
                <View key={m.id ?? i} style={styles.recordRow}>
                  <View>
                    <Text style={styles.recordWeight}>
                      {m.weight_kg != null ? m.weight_kg.toFixed(1) : '—'} KG
                    </Text>
                    <Text style={styles.recordDate}>{formatDateTime(m.date)}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={C.mutedLo} />
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

/* ─── Styles ──────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: radius.input,
    backgroundColor: C.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  headerBtnGhost: {
    width: 36, height: 36, borderRadius: radius.input,
    backgroundColor: C.surfaceTop,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  headerTitle: {
    fontSize: 14, fontWeight: '800',
    color: C.primaryDim, letterSpacing: 1.5,
  },

  scroll: { paddingHorizontal: H_PAD, paddingTop: 24 },

  // Section
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11, fontWeight: '800',
    color: C.muted, letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 0,
  },
  sectionAccent: {
    width: 3, height: 18, backgroundColor: C.primaryDim, borderRadius: radius.xxs,
  },

  // Eyebrow
  eyebrow: {
    fontSize: 10, fontWeight: '700',
    color: C.muted, letterSpacing: 2,
    marginBottom: 8,
  },

  // Big weight
  bigWeightRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 12,
  },
  bigWeight: {
    fontSize: 72, fontWeight: '900',
    color: C.text, letterSpacing: -3, lineHeight: 76,
  },
  bigUnit: {
    fontSize: 24, fontWeight: '600', color: C.primaryDim, marginBottom: 6,
  },
  weeklyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
  },
  weeklyText: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.8,
  },

  // Bento
  bentoRow: {
    flexDirection: 'row', gap: 8, marginBottom: 32,
  },
  bentoCard: {
    flex: 1, backgroundColor: C.surface,
    borderRadius: radius.md, padding: 14,
    borderLeftWidth: 2, borderLeftColor: C.mutedLo,
  },
  bentoCardAccent: {
    backgroundColor: 'rgba(193,237,0,0.05)',
    borderLeftColor: C.primaryDim,
  },
  bentoLabel: {
    fontSize: 8, fontWeight: '700',
    color: C.muted, letterSpacing: 1.2,
    marginBottom: 8, textTransform: 'uppercase',
  },
  bentoValue: {
    fontSize: 20, fontWeight: '800',
    color: C.text, letterSpacing: -0.5,
  },
  bentoUnit: {
    fontSize: 11, fontWeight: '500',
    color: C.muted,
  },

  // Range tabs
  rangeTabs: {
    flexDirection: 'row', gap: 6, paddingBottom: 16,
  },
  rangeTab: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.xl, backgroundColor: C.surfaceTop,
  },
  rangeTabActive: { backgroundColor: C.primaryDim },
  rangeTabText: {
    fontSize: 9, fontWeight: '700',
    color: C.muted, letterSpacing: 1,
  },
  rangeTabTextActive: { color: '#000' },

  // Chart
  chartBox: {
    height: CHART_H,
    backgroundColor: C.surface,
    borderRadius: radius.lg, overflow: 'hidden',
    marginBottom: 8,
  },
  chartTooltip: {
    position: 'absolute',
    alignItems: 'flex-end',
  },
  tooltipLabel: {
    fontSize: 9, fontWeight: '800',
    color: C.primaryDim, letterSpacing: 1.5,
    backgroundColor: 'rgba(193,237,0,0.1)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: radius.xs, marginBottom: 2,
  },
  tooltipValue: {
    fontSize: 16, fontWeight: '800',
    color: C.text,
  },
  chartEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  chartEmptyText: {
    fontSize: 12, color: C.mutedLo, fontWeight: '600',
  },

  // X labels
  xLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  xLabel: {
    fontSize: 9, fontWeight: '700',
    color: C.muted, letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  xLabelToday: { color: C.primaryDim },

  // Analysis
  analysisCard: {
    backgroundColor: C.surface,
    borderRadius: radius.mdL, padding: 20, gap: 14,
  },
  analysisText: {
    fontSize: 13, color: C.muted,
    lineHeight: 20,
  },
  consistencyBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,227,253,0.08)',
    borderRadius: radius.input, padding: 12,
    borderWidth: 1, borderColor: 'rgba(0,227,253,0.12)',
  },
  consistencyText: {
    fontSize: 12, color: C.secondary,
    lineHeight: 18, flex: 1,
  },

  // Records
  recordsList: { gap: 8, marginTop: 16 },
  recordRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: radius.md,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  recordWeight: {
    fontSize: 16, fontWeight: '800',
    color: C.text, letterSpacing: -0.3,
  },
  recordDate: {
    fontSize: 9, fontWeight: '700',
    color: C.muted, letterSpacing: 1,
    marginTop: 3,
  },
  verTodo: {
    fontSize: 9, fontWeight: '800',
    color: C.primaryDim, letterSpacing: 1.5,
  },
});

export default PesoCorporalDetailScreen;
