import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
  Dimensions,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { saveCardioLog, type CardioActivityId } from '../../services/workoutService';
import { radius } from '../../theme/radius';

const { width: SCREEN_W } = Dimensions.get('window');
const H_PAD = 24;
const GRID_GAP = 12;
const TILE_W = (SCREEN_W - H_PAD * 2 - GRID_GAP * 2) / 3;

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceLow: '#131313',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  primaryContainer: '#cefc22',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
  outline: '#767575',
  outlineVariant: '#484847',
};

const ACTIVITIES: {
  id: CardioActivityId;
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
}[] = [
  { id: 'running', label: 'RUNNING', icon: 'run-fast' },
  { id: 'walking', label: 'WALKING', icon: 'walk' },
  { id: 'cycling', label: 'CYCLING', icon: 'bike' },
  { id: 'rowing', label: 'ROWING', icon: 'waves' },
  { id: 'elliptical', label: 'ELIPTICAL', icon: 'dumbbell' },
];

function parseDistanceInput(raw: string): number | null {
  const t = raw.trim().replace(',', '.');
  if (t === '') return null;
  const n = parseFloat(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function clamp2Digits(n: string, max: number): string {
  const raw = n.replace(/\D/g, '').slice(-2);
  if (raw === '') return '00';
  const v = parseInt(raw, 10);
  return String(Math.min(max, Math.max(0, v))).padStart(2, '0');
}

const HERO_URI =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAM1-zzbYbvIc66PV_x925CHaZd9_6YDSALu3Nmeb8RKjXv-zyR1_ziE7VWLn8nsCtmqdDg9o23TVVkaeM6ospsDFQg04oODnXiMtQfcY-7LUur_6hQoDj20GOtJwwShrCyvGaLZV-aZfeBFsvCMGbhDCPnSDm5S9PviCNzOrmTTQJU9HQO1sQUoFwxs9nTr3QajvB2hsv_-KBd0e1WaFM7qdIMJRBZsRQuXNIa-BCLNG2WSvTsqhdO3VY0o2ndAw_czCxLmVlbA5xo';

const RegistroCardioScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [activity, setActivity] = useState<CardioActivityId>('running');
  const [unit, setUnit] = useState<'km' | 'mi'>('km');
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('45');
  const [seconds, setSeconds] = useState('00');
  const [intensity, setIntensity] = useState(8);
  const [trackW, setTrackW] = useState(0);
  const [saving, setSaving] = useState(false);

  const onTrackPress = useCallback(
    (locationX: number) => {
      if (trackW <= 0) return;
      const v = Math.round(1 + (locationX / trackW) * 9);
      setIntensity(Math.min(10, Math.max(1, v)));
    },
    [trackW]
  );

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();

    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const s = parseInt(seconds, 10) || 0;
    const durationSeconds = h * 3600 + m * 60 + s;

    if (durationSeconds <= 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Duración', 'Indicá una duración mayor a cero.');
      return;
    }

    const dist = parseDistanceInput(distance);
    if (distance.trim() !== '' && dist === null) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Distancia', 'Revisá el valor de distancia ingresado.');
      return;
    }

    setSaving(true);
    const ok = await saveCardioLog({
      activity,
      unit,
      distance: dist,
      durationSeconds,
      rpe: intensity,
    });
    setSaving(false);

    if (!ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'No se pudo guardar',
        'Iniciá sesión o revisá tu conexión e intentá de nuevo.'
      );
      return;
    }

    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Registro guardado', 'Tu sesión de cardio quedó registrada.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  }, [activity, unit, distance, hours, minutes, seconds, intensity, navigation]);

  const unitLabel = unit === 'km' ? 'KM' : 'MI';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>REGISTRO CARDIO</Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
        >
          <MaterialCommunityIcons name="close" size={28} color={COLORS.textVariant} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionLabel}>SELECCIONAR ACTIVIDAD</Text>
            <Text style={styles.brandHint}>KINETIC EQUILIBRIUM</Text>
          </View>
          <View style={styles.activityGrid}>
            {ACTIVITIES.map((a) => {
              const selected = activity === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.activityTile, selected && styles.activityTileSelected]}
                  onPress={() => setActivity(a.id)}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons
                    name={a.icon}
                    size={28}
                    color={selected ? COLORS.primary : COLORS.textVariant}
                  />
                  <Text style={[styles.activityTileLabel, selected && styles.activityTileLabelSelected]}>
                    {a.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.distHeader}>
            <Text style={styles.fieldLabel}>DISTANCIA RECORRIDA</Text>
            <View style={styles.unitSwitch}>
              <TouchableOpacity
                style={[styles.unitChip, unit === 'km' && styles.unitChipOn]}
                onPress={() => setUnit('km')}
              >
                <Text style={[styles.unitChipText, unit === 'km' && styles.unitChipTextOn]}>KM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitChip, unit === 'mi' && styles.unitChipOn]}
                onPress={() => setUnit('mi')}
              >
                <Text style={[styles.unitChipText, unit === 'mi' && styles.unitChipTextOn]}>MILLAS</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.distanceRow}>
            <TextInput
              style={styles.distanceInput}
              value={distance}
              onChangeText={setDistance}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="decimal-pad"
            />
            <Text style={styles.distanceUnitSuffix}>{unitLabel}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.fieldLabel}>DURACIÓN TOTAL</Text>
          <View style={styles.timeRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxHint}>HORAS</Text>
              <TextInput
                style={styles.timeInput}
                value={hours}
                onChangeText={(t) => setHours(clamp2Digits(t, 99))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxHint}>MINUTOS</Text>
              <TextInput
                style={styles.timeInput}
                value={minutes}
                onChangeText={(t) => setMinutes(clamp2Digits(t, 59))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
            <View style={styles.timeBox}>
              <Text style={styles.timeBoxHint}>SEGUNDOS</Text>
              <TextInput
                style={styles.timeInput}
                value={seconds}
                onChangeText={(t) => setSeconds(clamp2Digits(t, 59))}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.intensityHeader}>
            <Text style={styles.fieldLabel}>INTENSIDAD PERCIBIDA</Text>
            <Text style={styles.intensityValue}>
              {String(intensity).padStart(2, '0')}
              <Text style={styles.intensityMax}> /10</Text>
            </Text>
          </View>
          <Pressable
            style={styles.sliderTrack}
            onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
            onPress={(e) => onTrackPress(e.nativeEvent.locationX)}
          >
            <View style={[styles.sliderFill, { width: `${((intensity - 1) / 9) * 100}%` }]} />
            <View
              style={[
                styles.sliderThumb,
                { left: `${((intensity - 1) / 9) * 100}%` },
              ]}
            />
          </Pressable>
          <View style={styles.sliderHints}>
            <Text style={styles.sliderHint}>FÁCIL</Text>
            <Text style={styles.sliderHint}>MODERADO</Text>
            <Text style={[styles.sliderHint, styles.sliderHintStrong]}>LÍMITE</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Image
            source={{ uri: HERO_URI }}
            style={styles.heroImage}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(14,14,14,0.5)', COLORS.bg]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.heroQuote}>“El esfuerzo de hoy es el R3SET de mañana”</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          activeOpacity={0.92}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'GUARDANDO…' : 'GUARDAR REGISTRO'}</Text>
          <MaterialCommunityIcons name="arrow-right" size={22} color="#0e0e0e" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  headerTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 26,
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
    paddingTop: 24,
    gap: 40,
  },
  section: {
    gap: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.primaryDim,
  },
  brandHint: {
    fontSize: 10,
    color: COLORS.outline,
    opacity: 0.5,
    letterSpacing: 0.5,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  activityTile: {
    width: TILE_W,
    aspectRatio: 1,
    borderRadius: radius.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityTileSelected: {
    backgroundColor: COLORS.surfaceHighest,
    borderColor: COLORS.primary,
  },
  activityTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: COLORS.textVariant,
  },
  activityTileLabelSelected: {
    color: COLORS.primary,
  },
  distHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.text,
    opacity: 0.85,
  },
  unitSwitch: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: radius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(72,72,71,0.4)',
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  unitChipOn: {
    backgroundColor: COLORS.primaryContainer,
  },
  unitChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textVariant,
  },
  unitChipTextOn: {
    color: '#4b5e00',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.outlineVariant,
    paddingBottom: 8,
    gap: 8,
  },
  distanceInput: {
    flex: 1,
    fontSize: 56,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
    minHeight: 64,
  },
  distanceUnitSuffix: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.outlineVariant,
  },
  timeRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  timeBox: {
    flex: 1,
    backgroundColor: COLORS.surfaceLow,
    borderRadius: radius.sm,
    padding: 14,
    alignItems: 'center',
  },
  timeBoxHint: {
    fontSize: 10,
    color: COLORS.outlineVariant,
    marginBottom: 6,
    fontWeight: '600',
  },
  timeInput: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  intensityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  intensityValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  intensityMax: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: '700',
  },
  sliderTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: COLORS.surfaceHighest,
    marginTop: 8,
    position: 'relative',
    justifyContent: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.secondary,
    borderRadius: radius.full,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: radius.input,
    backgroundColor: COLORS.secondary,
    marginLeft: -10,
    top: -7,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  sliderHints: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 2,
  },
  sliderHint: {
    fontSize: 9,
    color: COLORS.outlineVariant,
    fontWeight: '600',
  },
  sliderHintStrong: {
    color: COLORS.tertiary,
    fontWeight: '800',
  },
  hero: {
    height: 180,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginTop: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  heroQuote: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDim,
    letterSpacing: 1.2,
  },
  footer: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    backgroundColor: COLORS.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtn: {
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#0e0e0e',
  },
});

export default RegistroCardioScreen;
