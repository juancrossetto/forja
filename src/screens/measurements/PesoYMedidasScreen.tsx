import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  getMeasurementsForDate,
  saveMeasurements,
} from '../../services/measurementsService';
import { useProgressStore } from '../../store/progressStore';

const BODY_IMAGES = {
  male:   require('../../../assets/male.png'),
  female: require('../../../assets/female.png'),
};

const { width } = Dimensions.get('window');
const BODY_H = Math.round(width * 1.0);

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  error: '#ff7351',
  text: '#ffffff',
  textVariant: '#adaaaa',
  outline: '#767575',
};

interface MeasurementField {
  id: string;
  label: string;
  value: string;
}

const INITIAL_MEASUREMENTS: MeasurementField[] = [
  { id: 'chest',  label: 'PECHO',   value: '' },
  { id: 'waist',  label: 'CINTURA', value: '' },
  { id: 'hips',   label: 'CADERA',  value: '' },
  { id: 'arms',   label: 'BRAZOS',  value: '' },
  { id: 'legs',   label: 'PIERNAS', value: '' },
];

// Positions as % of BODY_H / frame width (width - 48)
const FRAME_W = width - 48;
const HOTSPOTS: Record<string, { top: number; left: number }> = {
  chest: { top: BODY_H * 0.24, left: FRAME_W * 0.44 },
  arms:  { top: BODY_H * 0.34, left: FRAME_W * 0.60 },
  waist: { top: BODY_H * 0.40, left: FRAME_W * 0.46 },
  hips:  { top: BODY_H * 0.48, left: FRAME_W * 0.42 },
  legs:  { top: BODY_H * 0.68, left: FRAME_W * 0.43 },
};

const todayISO = () => new Date().toISOString().split('T')[0];

const PesoYMedidasScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const loadProgressData = useProgressStore((s) => s.loadProgressData);
  const [gender, setGender]       = useState<'male' | 'female'>('male');
  const [weight, setWeight]       = useState('');
  const [bodyFat, setBodyFat]     = useState('');
  const [measurements, setMeasurements] = useState<MeasurementField[]>(INITIAL_MEASUREMENTS);
  const [selectedId, setSelectedId]     = useState('chest');
  const [saving, setSaving]             = useState(false);
  const [weightTouched, setWeightTouched] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await getMeasurementsForDate(todayISO());
      if (!data) return;
      if (data.weight_kg   != null) setWeight(String(data.weight_kg));
      if (data.body_fat_pct != null) setBodyFat(String(data.body_fat_pct));
      setMeasurements((prev) =>
        prev.map((m) => {
          const map: Record<string, number | null> = {
            chest: data.chest_cm, waist: data.waist_cm,
            hips:  data.hips_cm,  arms:  data.arms_cm, legs: data.legs_cm,
          };
          const val = map[m.id];
          return val != null ? { ...m, value: String(val) } : m;
        })
      );
    })();
  }, []);

  const updateMeasurement = (id: string, value: string) =>
    setMeasurements((prev) => prev.map((m) => (m.id === id ? { ...m, value } : m)));

  const toNum = (s: string) => parseFloat(s.replace(',', '.'));
  const canSave = toNum(weight) > 0;

  const handleSave = async () => {
    setWeightTouched(true);
    if (!canSave) {
      Alert.alert('Peso requerido', 'Ingresá tu peso actual para continuar.');
      return;
    }
    setSaving(true);
    try {
      const get = (id: string) => {
        const n = toNum(measurements.find((m) => m.id === id)?.value ?? '');
        return isNaN(n) ? null : n;
      };
      const ok = await saveMeasurements({
        gender,
        weight_kg:    toNum(weight) || null,
        body_fat_pct: toNum(bodyFat) || null,
        chest_cm: get('chest'), waist_cm: get('waist'),
        hips_cm:  get('hips'),  arms_cm:  get('arms'), legs_cm: get('legs'),
      });
      if (ok) {
        void loadProgressData();
        navigation.goBack();
      } else {
        Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión e intentá de nuevo.');
      }
    } catch (e) {
      console.error('handleSave:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const selectedLabel = measurements.find((m) => m.id === selectedId)?.label ?? '';

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Header ── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>PESO Y MEDIDAS</Text>
          <Text style={styles.subtitle}>SIGUE TU TRANSFORMACIÓN</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Primary Stats ── */}
        <View style={styles.cardRow}>
          {/* Weight */}
          <View style={[styles.inputCard, { borderLeftColor: COLORS.primary }]}>
            <Text style={styles.cardLabel}>PESO ACTUAL</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.inputField}
                placeholder="00.0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={weight}
                onChangeText={(v) => { setWeight(v); setWeightTouched(true); }}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.inputUnit, { color: COLORS.primaryDim }]}>KG</Text>
            </View>
            {weightTouched && !canSave && (
              <Text style={styles.errorText}>EL PESO ES UN{'\n'}CAMPO MANDATORIO</Text>
            )}
          </View>

          {/* Body fat */}
          <View style={[styles.inputCard, { borderLeftColor: COLORS.secondary }]}>
            <View style={styles.cardLabelRow}>
              <Text style={styles.cardLabel}>GRASA{'\n'}CORPORAL</Text>
              <Text style={styles.optionalTag}>OPCIONAL</Text>
            </View>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.inputField}
                placeholder="00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="decimal-pad"
              />
              <Text style={[styles.inputUnit, { color: COLORS.secondary }]}>%</Text>
            </View>
          </View>
        </View>

        {/* ── Gender Toggle ── */}
        <View style={styles.genderToggle}>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
            onPress={() => setGender('male')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="gender-male" size={15} color={gender === 'male' ? '#000' : COLORS.textVariant} />
            <Text style={[styles.genderLabel, gender === 'male' && styles.genderLabelActive]}>HOMBRE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
            onPress={() => setGender('female')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="gender-female" size={15} color={gender === 'female' ? '#000' : COLORS.textVariant} />
            <Text style={[styles.genderLabel, gender === 'female' && styles.genderLabelActive]}>MUJER</Text>
          </TouchableOpacity>
        </View>

        {/* ── Body Figure ── */}
        <View style={styles.bodyFrame}>
          <Image
            source={BODY_IMAGES[gender]}
            style={styles.bodyImage}
            resizeMode="contain"
          />
          <View style={styles.bodyGradient} pointerEvents="none" />

          {measurements.map((m) => {
            const pos = HOTSPOTS[m.id];
            const isActive = selectedId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.hotspot, { top: pos.top, left: pos.left }, isActive && styles.hotspotActive]}
                onPress={() => setSelectedId(m.id)}
              >
                <View style={[styles.hotspotDot, isActive && styles.hotspotDotActive]} />
              </TouchableOpacity>
            );
          })}

          <View style={styles.bodyLabel} pointerEvents="none">
            <Text style={styles.bodyLabelSub}>ZONA SELECCIONADA</Text>
            <Text style={styles.bodyLabelMain}>{selectedLabel}</Text>
          </View>
        </View>

        {/* ── Measurements List ── */}
        <View style={styles.measurementsList}>
          {measurements.map((m) => {
            const isActive = selectedId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.measurementRow, isActive && styles.measurementRowActive]}
                onPress={() => setSelectedId(m.id)}
                activeOpacity={0.8}
              >
                <View style={styles.measurementLeft}>
                  <MaterialCommunityIcons
                    name="ruler"
                    size={20}
                    color={isActive ? COLORS.primary : COLORS.textVariant}
                  />
                  <View>
                    <Text style={[styles.measurementLabel, isActive && { color: COLORS.text }]}>
                      {m.label}
                    </Text>
                    <Text style={styles.optionalText}>OPCIONAL</Text>
                  </View>
                </View>
                <View style={styles.measurementRight}>
                  <TextInput
                    style={[styles.measurementInput, isActive && styles.measurementInputActive]}
                    placeholder="--"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    value={m.value}
                    onChangeText={(v) => updateMeasurement(m.id, v)}
                    keyboardType="decimal-pad"
                    onFocus={() => setSelectedId(m.id)}
                  />
                  <Text style={styles.measurementUnit}>CM</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Save Button ── */}
        <TouchableOpacity
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          <Text style={[styles.saveButtonText, !canSave && styles.saveButtonTextDisabled]}>
            {saving ? 'GUARDANDO...' : 'GUARDAR REGISTRO'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header
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
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5, lineHeight: 26 },
  subtitle: { fontSize: 9, color: '#00e3fd', letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.8, marginTop: 1 },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },

  // Stats cards
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  inputCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 14, borderLeftWidth: 3, padding: 16,
  },
  cardLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  optionalTag: { fontSize: 8, fontWeight: '700', color: COLORS.outline, letterSpacing: 1, textTransform: 'uppercase' },
  inputGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  inputField: { flex: 1, fontSize: 30, fontWeight: '700', color: COLORS.text, padding: 0 },
  inputUnit: { fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  errorText: { fontSize: 8, fontWeight: '700', color: COLORS.error, letterSpacing: 0.8, marginTop: 6, textTransform: 'uppercase' },

  // Gender toggle
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 14,
  },
  genderBtn: {
    flex: 1, flexDirection: 'row', gap: 6,
    paddingVertical: 10, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  genderBtnActive: { backgroundColor: COLORS.primary },
  genderLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 1 },
  genderLabelActive: { color: '#000' },

  // Body frame
  bodyFrame: {
    height: BODY_H,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bodyImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  bodyGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%',
    backgroundColor: 'transparent',
    // gradient effect via shadow
    shadowColor: COLORS.bg,
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
  },
  hotspot: {
    position: 'absolute',
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(209,255,38,0.20)',
    borderWidth: 1.5, borderColor: 'rgba(209,255,38,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  hotspotActive: {
    backgroundColor: COLORS.primary,
    borderColor: '#fff',
    transform: [{ scale: 1.25 }],
  },
  hotspotDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  hotspotDotActive: { backgroundColor: '#000' },
  bodyLabel: { position: 'absolute', bottom: 16, left: 16 },
  bodyLabelSub: { fontSize: 9, fontWeight: '700', color: COLORS.primaryDim, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  bodyLabelMain: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 },

  // Measurements list
  measurementsList: { gap: 10, marginBottom: 24 },
  measurementRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface, borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: COLORS.surfaceHighest,
  },
  measurementRowActive: {
    backgroundColor: COLORS.surfaceHigh,
    borderLeftColor: COLORS.primary,
  },
  measurementLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  measurementLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textVariant, letterSpacing: 0.8 },
  optionalText: { fontSize: 8, color: COLORS.outline, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 },
  measurementRight: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  measurementInput: {
    fontSize: 18, fontWeight: '700', color: COLORS.text,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    width: 64, textAlign: 'right',
  },
  measurementInputActive: { borderWidth: 1, borderColor: COLORS.primary },
  measurementUnit: { fontSize: 11, color: COLORS.textVariant, fontWeight: '700', letterSpacing: 0.8 },

  // Save button
  saveButton: {
    backgroundColor: COLORS.primary, paddingVertical: 18,
    borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.surfaceHighest,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: { fontSize: 15, fontWeight: '700', color: '#000', letterSpacing: 2, textTransform: 'uppercase' },
  saveButtonTextDisabled: { color: COLORS.textVariant },
});

export default PesoYMedidasScreen;
