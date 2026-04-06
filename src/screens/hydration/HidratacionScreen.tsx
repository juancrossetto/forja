import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import {
  getHydrationForDate,
  saveHydration,
  getWeeklyHydration,
} from '../../services/hydrationService';
import { useUIStore } from '../../store/uiStore';
import { formatDate, todayISO as getTodayISO } from '../../utils/dateUtils';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const { width } = Dimensions.get('window');
const BOX_W = width - 48;
const BOX_H = BOX_W * 0.72;

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

const GOAL_ML = 3000;

const DAY_LABELS = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

function buildWeekDays() {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push({
      date: d.toISOString().split('T')[0],
      day: DAY_LABELS[d.getDay()],
      today: i === 0,
      ml: 0,
    });
  }
  return days;
}

// Sine wave SVG path
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
  const waveH = 24;

  // We'll use a simple approach: animate translateX on wider SVGs
  const tx1 = phase1.interpolate({ inputRange: [0, 1], outputRange: [0, -BOX_W] });
  const tx2 = phase2.interpolate({ inputRange: [0, 1], outputRange: [-BOX_W * 0.5, BOX_W * 0.5] });

  const path1 = wavePath(BOX_W * 2, waveH, 8, 2, 0);
  const path2 = wavePath(BOX_W * 2, waveH, 6, 2.5, 1);

  if (fillH < 2) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'flex-end' }]} pointerEvents="none">
      {/* Solid fill */}
      <View style={{ height: fillH, backgroundColor: 'rgba(0,180,220,0.2)' }} />

      {/* Wave 1 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: fillH - waveH + 4,
          left: 0,
          width: BOX_W * 2,
          height: waveH,
          transform: [{ translateX: tx1 }],
        }}
      >
        <Svg width={BOX_W * 2} height={waveH}>
          <Path d={path1} fill="rgba(0,180,220,0.25)" />
        </Svg>
      </Animated.View>

      {/* Wave 2 */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: fillH - waveH + 8,
          left: 0,
          width: BOX_W * 2,
          height: waveH,
          transform: [{ translateX: tx2 }],
        }}
      >
        <Svg width={BOX_W * 2} height={waveH}>
          <Path d={path2} fill="rgba(0,220,240,0.15)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

// local alias for inline use
const todayISO = getTodayISO;

function formatL(ml: number): string {
  return ml % 500 === 0 ? (ml / 1000).toFixed(1) : (ml / 1000).toFixed(2);
}

export default function HidratacionScreen() {
  const navigation = useNavigation<any>();
  // Use the date the user is viewing in HomeScreen (defaults to today)
  const activeDate = useUIStore((s) => s.activeDate);
  const isToday = activeDate === todayISO();

  const [currentMl, setCurrentMl] = useState(0);
  const [weekly, setWeekly] = useState(buildWeekDays());
  const [saving, setSaving] = useState(false);

  // Load data for the active date + weekly chart. Reruns when date changes.
  useEffect(() => {
    let cancelled = false;
    setCurrentMl(0);
    setWeekly(buildWeekDays());

    (async () => {
      const [dayLog, weekData] = await Promise.all([
        getHydrationForDate(activeDate),
        getWeeklyHydration(),
      ]);
      if (cancelled) return;
      if (dayLog) setCurrentMl(dayLog.total_ml);
      if (weekData.length > 0) {
        setWeekly((prev) =>
          prev.map((d) => {
            const found = weekData.find((w) => w.date === d.date);
            return found ? { ...d, ml: found.total_ml } : d;
          })
        );
      }
    })();

    return () => { cancelled = true; };
  }, [activeDate]);

  const add = (ml: number) => {
    setCurrentMl((prev) => {
      const next = prev + ml;
      if (prev < GOAL_ML && next >= GOAL_ML)
        Alert.alert('¡Meta alcanzada!', 'Completaste tu objetivo diario.');
      // Update today in weekly preview
      setWeekly((w) => w.map((d) => d.today ? { ...d, ml: next } : d));
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveHydration(currentMl, activeDate);
    setSaving(false);
    const dayLabel = isToday ? 'hoy' : `el ${formatDate(activeDate)}`;
    if (ok) Alert.alert('Guardado', `Registraste ${formatL(currentMl)}L ${dayLabel}.`);
    else Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión.');
  };

  const progress = Math.min(currentMl / GOAL_ML, 1);
  const liters = formatL(currentMl);
  const avgMl = Math.round(weekly.filter((d) => d.ml > 0).reduce((a, b) => a + b.ml, 0) / Math.max(weekly.filter((d) => d.ml > 0).length, 1));
  const maxMl = Math.max(...weekly.map((d) => d.ml), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header row with close button */}
        <View style={styles.screenHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#000" />
          </TouchableOpacity>
          {!isToday && (
            <View style={styles.dateBadge}>
              <MaterialCommunityIcons name="calendar" size={12} color={COLORS.secondary} />
              <Text style={styles.dateBadgeText}>{formatDate(activeDate)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>HIDRATACIÓN</Text>
        <Text style={styles.subtitle}>RENDIMIENTO COGNITIVO &amp; FÍSICO</Text>

        {/* Water box */}
        <View style={styles.waterBox}>
          <WaterWaves progress={progress} />
          <View style={styles.bubble1} />
          <View style={styles.bubble2} />
          <View style={styles.boxContent} pointerEvents="none">
            <View style={styles.valueRow}>
              <Text style={styles.bigValue}>{liters}</Text>
              <Text style={styles.goalValue}>/ 3.0</Text>
            </View>
            <Text style={styles.litrosLabel}>LITROS DIARIOS</Text>
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.quickAdd}>
          <TouchableOpacity style={styles.addBtn} onPress={() => add(250)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cup-water" size={24} color={COLORS.secondary} />
            <Text style={styles.addBtnLabel}>+250ML</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => add(500)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="water" size={24} color={COLORS.secondary} />
            <Text style={styles.addBtnLabel}>+500ML</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addBtn, styles.addBtnPrimary]} onPress={() => add(1000)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="cup" size={24} color="#000" />
            <Text style={[styles.addBtnLabel, { color: '#000', fontWeight: '900' }]}>+1L</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>ÚLTIMOS 7 DÍAS</Text>
            <View style={styles.avgBadge}>
              <Text style={styles.avgBadgeText}>PROMEDIO: {formatL(avgMl)}L</Text>
            </View>
          </View>
          <View style={styles.chartBars}>
            {weekly.map((d) => {
              const pct = maxMl > 0 ? (d.ml / maxMl) * 100 : 0;
              return (
                <View key={d.date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${pct}%` as any }, d.today && styles.barFillToday]} />
                  </View>
                  <Text style={[styles.barLabel, d.today && styles.barLabelToday]}>{d.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.9}>
          <Text style={styles.saveBtnText}>{saving ? 'GUARDANDO...' : 'GUARDAR REGISTRO'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 12 },

  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,227,253,0.12)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,227,253,0.25)',
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 0.5,
  },

  title: { fontSize: 52, fontWeight: '700', color: COLORS.text, letterSpacing: -1, lineHeight: 56, marginBottom: 6 },
  subtitle: { fontSize: 11, color: COLORS.secondary, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24, opacity: 0.85 },

  waterBox: {
    width: BOX_W, height: BOX_H, borderRadius: 20,
    backgroundColor: COLORS.surface, overflow: 'hidden',
    marginBottom: 24, justifyContent: 'center', alignItems: 'center',
  },
  boxContent: { alignItems: 'center', zIndex: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  bigValue: { fontSize: 80, fontWeight: '900', color: COLORS.text, lineHeight: 88 },
  goalValue: { fontSize: 28, fontWeight: '500', color: COLORS.textVariant },
  litrosLabel: { fontSize: 12, color: COLORS.secondary, letterSpacing: 4, textTransform: 'uppercase', marginTop: 4 },

  bubble1: { position: 'absolute', top: '25%', left: '22%', width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(0,227,253,0.4)' },
  bubble2: { position: 'absolute', top: '38%', left: '35%', width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(0,227,253,0.6)' },

  quickAdd: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  addBtn: { flex: 1, backgroundColor: COLORS.surfaceHighest, borderRadius: 14, paddingVertical: 18, alignItems: 'center', gap: 8 },
  addBtnPrimary: { backgroundColor: COLORS.primaryContainer },
  addBtnLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1, textTransform: 'uppercase' },

  chartCard: { backgroundColor: COLORS.surfaceLow, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: 'rgba(72,72,71,0.15)' },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, letterSpacing: 0.5 },
  avgBadge: { backgroundColor: 'rgba(0,104,117,0.3)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  avgBadgeText: { fontSize: 10, color: COLORS.secondary, letterSpacing: 0.5 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', height: 120, gap: 8 },
  barCol: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', backgroundColor: COLORS.surfaceHighest, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: COLORS.surfaceHighest, borderRadius: 4 },
  barFillToday: { backgroundColor: COLORS.secondaryDim },
  barLabel: { fontSize: 8, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 0.5, textTransform: 'uppercase' },
  barLabelToday: { color: COLORS.secondary },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingBottom: 32, paddingTop: 12 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#000', letterSpacing: 2, textTransform: 'uppercase' },
});
