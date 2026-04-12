import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  getHydrationForDate,
  saveHydration,
  getWeeklyHydration,
  getHydrationTargetMlForDate,
} from '../../services/hydrationService';
import { useUIStore } from '../../store/uiStore';
import { formatDate, todayISO as getTodayISO } from '../../utils/dateUtils';

const { width, height } = Dimensions.get('window');

// Compact box: fixed height so everything fits without scrolling
const BOX_W = width - 48;
const BOX_H = Math.min(BOX_W * 0.54, height * 0.26);

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  primary: '#D1FF26',
  primaryContainer: '#cefc22',
  secondary: '#00e3fd',
  secondaryDim: '#00d4ec',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildWeekDays() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: localDateStr(d),
      day: DAY_LABELS[d.getDay()],
      today: i === 0,
      ml: 0,
    });
  }
  return days;
}

function wavePath(w: number, h: number, amplitude: number, freq: number, phase: number) {
  let d = `M 0 ${h}`;
  for (let x = 0; x <= w; x += 2) {
    const y = amplitude * Math.sin((x / w) * freq * Math.PI * 2 + phase);
    d += ` L ${x} ${y + amplitude}`;
  }
  d += ` L ${w} ${h} Z`;
  return d;
}

function WaterWaves({ progress }: { progress: number }) {
  const phase1 = useRef(new Animated.Value(0)).current;
  const phase2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(phase1, { toValue: 1, duration: 3000, useNativeDriver: false })
    ).start();
    Animated.loop(
      Animated.timing(phase2, { toValue: 1, duration: 4000, useNativeDriver: false })
    ).start();
  }, []);

  const fillH = BOX_H * progress;
  const waveH = 20;
  const tx1 = phase1.interpolate({ inputRange: [0, 1], outputRange: [0, -BOX_W] });
  const tx2 = phase2.interpolate({ inputRange: [0, 1], outputRange: [-BOX_W * 0.5, BOX_W * 0.5] });
  const path1 = wavePath(BOX_W * 2, waveH, 7, 2, 0);
  const path2 = wavePath(BOX_W * 2, waveH, 5, 2.5, 1);

  if (fillH < 2) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end' }]} pointerEvents="none">
      <View style={{ height: fillH, backgroundColor: 'rgba(0,180,220,0.2)' }} />
      <Animated.View style={{
        position: 'absolute', bottom: fillH - waveH + 4,
        left: 0, width: BOX_W * 2, height: waveH,
        transform: [{ translateX: tx1 }],
      }}>
        <Svg width={BOX_W * 2} height={waveH}>
          <Path d={path1} fill="rgba(0,180,220,0.25)" />
        </Svg>
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', bottom: fillH - waveH + 8,
        left: 0, width: BOX_W * 2, height: waveH,
        transform: [{ translateX: tx2 }],
      }}>
        <Svg width={BOX_W * 2} height={waveH}>
          <Path d={path2} fill="rgba(0,220,240,0.15)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const todayISO = getTodayISO;

function formatL(ml: number): string {
  return ml % 500 === 0 ? (ml / 1000).toFixed(1) : (ml / 1000).toFixed(2);
}

export default function HidratacionScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const activeDate = useUIStore((s) => s.activeDate);
  const isToday = activeDate === todayISO();

  const [currentMl, setCurrentMl] = useState(0);
  const [goalMl, setGoalMl] = useState(2500);
  const [weekly, setWeekly] = useState(buildWeekDays());
  const [saving, setSaving] = useState(false);

  const reloadHydration = React.useCallback(async () => {
    const [target, dayLog, weekData] = await Promise.all([
      getHydrationTargetMlForDate(activeDate),
      getHydrationForDate(activeDate),
      getWeeklyHydration(),
    ]);
    setGoalMl(target);

    const freshWeek = buildWeekDays();
    const merged = freshWeek.map((d) => {
      const found = weekData.find((w) => w.date === d.date);
      return found ? { ...d, ml: found.total_ml } : d;
    });

    if (dayLog) {
      const todayStr = activeDate;
      const finalMerged = merged.map((d) =>
        d.date === todayStr ? { ...d, ml: dayLog.total_ml } : d
      );
      setCurrentMl(dayLog.total_ml);
      setWeekly(finalMerged);
    } else {
      setCurrentMl(0);
      setWeekly(merged);
    }
  }, [activeDate]);

  useEffect(() => {
    void reloadHydration();
  }, [reloadHydration]);

  useFocusEffect(
    React.useCallback(() => {
      void reloadHydration();
    }, [reloadHydration])
  );

  const add = (ml: number) => {
    setCurrentMl((prev) => {
      const next = prev + ml;
      if (prev < goalMl && next >= goalMl) {
        Alert.alert('¡Meta alcanzada!', 'Completaste tu objetivo diario.');
      }
      return next;
    });
    setWeekly((w) =>
      w.map((d) => (d.date === activeDate ? { ...d, ml: d.ml + ml } : d))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveHydration(currentMl, activeDate);
    setSaving(false);
    const dayLabel = isToday ? 'hoy' : `el ${formatDate(activeDate)}`;
    if (ok) {
      // Update weekly chart with the saved value
      setWeekly((w) => w.map((d) => d.date === activeDate ? { ...d, ml: currentMl } : d));
      Alert.alert('Guardado', `Registraste ${formatL(currentMl)}L ${dayLabel}.`);
    } else {
      Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión.');
    }
  };

  const progress = goalMl > 0 ? Math.min(currentMl / goalMl, 1) : 0;
  const liters = formatL(currentMl);
  const goalLiters = formatL(goalMl);
  const daysWithData = weekly.filter((d) => d.ml > 0);
  const avgMl = daysWithData.length > 0
    ? Math.round(daysWithData.reduce((a, b) => a + b.ml, 0) / daysWithData.length)
    : 0;
  const maxMl = Math.max(...weekly.map((d) => d.ml), 1);

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Header ── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>HIDRATACIÓN</Text>
          <Text style={styles.subtitle}>RENDIMIENTO COGNITIVO & FÍSICO</Text>
        </View>
        {!isToday && (
          <View style={styles.dateBadge}>
            <MaterialCommunityIcons name="calendar" size={11} color={COLORS.secondary} />
            <Text style={styles.dateBadgeText}>{formatDate(activeDate)}</Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Water Box ── */}
        <View style={styles.waterBox}>
          <WaterWaves progress={progress} />
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />
          <View style={styles.boxContent} pointerEvents="none">
            <View style={styles.valueRow}>
              <Text style={styles.bigValue}>{liters}</Text>
              <Text style={styles.goalValue}>/ {goalLiters}</Text>
            </View>
            <Text style={styles.litrosLabel}>LITROS DIARIOS</Text>
          </View>
        </View>

        {/* ── Quick Add ── */}
        <View style={styles.quickAdd}>
          <TouchableOpacity style={styles.addBtn} onPress={() => add(250)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cup-water" size={20} color={COLORS.secondary} />
            <Text style={styles.addBtnLabel}>+250ML</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => add(500)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="water" size={20} color={COLORS.secondary} />
            <Text style={styles.addBtnLabel}>+500ML</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.addBtnPrimary]} onPress={() => add(1000)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cup" size={20} color="#000" />
            <Text style={[styles.addBtnLabel, { color: '#000', fontWeight: '900' }]}>+1L</Text>
          </TouchableOpacity>
        </View>

        {/* ── Weekly Chart ── */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>ÚLTIMOS 7 DÍAS</Text>
            <View style={styles.avgBadge}>
              <Text style={styles.avgBadgeText}>
                PROMEDIO: {avgMl > 0 ? `${formatL(avgMl)}L` : '—'}
              </Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {weekly.map((d) => {
              const pct = d.ml > 0 ? Math.max((d.ml / maxMl) * 100, 6) : 0;
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    {pct > 0 && (
                      <View
                        style={[
                          styles.barFill,
                          { height: `${pct}%` as any },
                          d.today ? styles.barFillToday : styles.barFillPast,
                        ]}
                      />
                    )}
                  </View>
                  <Text style={[styles.barLabel, d.today && styles.barLabelToday]}>
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Save Button ── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.saveBtnText}>{saving ? 'GUARDANDO...' : 'GUARDAR REGISTRO'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 8 },

  // Header: back button + title inline
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, lineHeight: 26 },
  subtitle: { fontSize: 9, color: COLORS.secondary, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8, marginTop: 1 },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,227,253,0.12)', borderRadius: 7,
    paddingHorizontal: 8, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(0,227,253,0.25)',
  },
  dateBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.secondary, letterSpacing: 0.4 },

  // Water box
  waterBox: {
    width: BOX_W, height: BOX_H, borderRadius: 18,
    backgroundColor: COLORS.surface, overflow: 'hidden',
    marginBottom: 14, justifyContent: 'center', alignItems: 'center',
    alignSelf: 'center',
  },
  boxContent: { alignItems: 'center', zIndex: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  bigValue: { fontSize: 60, fontWeight: '900', color: COLORS.text, lineHeight: 68 },
  goalValue: { fontSize: 22, fontWeight: '500', color: COLORS.textVariant },
  litrosLabel: { fontSize: 10, color: COLORS.secondary, letterSpacing: 3, textTransform: 'uppercase', marginTop: 2 },
  bubble1: { position: 'absolute', top: '25%', left: '22%', width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,227,253,0.4)' },
  bubble2: { position: 'absolute', top: '40%', left: '35%', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(0,227,253,0.6)' },

  // Quick add buttons
  quickAdd: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  addBtn: {
    flex: 1, backgroundColor: COLORS.surfaceHighest, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', gap: 6,
  },
  addBtnPrimary: { backgroundColor: COLORS.primaryContainer },
  addBtnLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1, textTransform: 'uppercase' },

  // Chart
  chartCard: {
    height: Math.round(height * 0.28),
    backgroundColor: COLORS.surfaceLow, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: 'rgba(72,72,71,0.15)',
    marginBottom: 14,
  },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartTitle: { fontSize: 13, fontWeight: '700', color: COLORS.text, letterSpacing: 0.5 },
  avgBadge: { backgroundColor: 'rgba(0,104,117,0.3)', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  avgBadgeText: { fontSize: 9, color: COLORS.secondary, letterSpacing: 0.5 },

  chartBars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 5 },
  barTrack: {
    flex: 1, width: '100%',
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 4 },
  // Past days: muted primary tint so they're visible but not dominant
  barFillPast: { backgroundColor: 'rgba(209,255,38,0.4)' },
  // Today: bright secondary
  barFillToday: { backgroundColor: COLORS.secondaryDim },
  barLabel: { fontSize: 8, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 0.5, textTransform: 'uppercase' },
  barLabelToday: { color: COLORS.secondary },

  // Save button
  footer: { paddingBottom: 4 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#000', letterSpacing: 2, textTransform: 'uppercase' },
});
