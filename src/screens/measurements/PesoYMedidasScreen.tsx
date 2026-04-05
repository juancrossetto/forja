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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  getMeasurementsForDate,
  saveMeasurements,
} from '../../services/measurementsService';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
  borderLight: 'rgba(255,255,255,0.05)',
};

type Gender = 'male' | 'female';

interface MeasurementField {
  id: string;
  label: string;
  icon: string;
  value: string;
  color: string;
}

const INITIAL_MEASUREMENTS: MeasurementField[] = [
  { id: 'chest', label: 'Pecho', icon: 'human-male-height', value: '', color: COLORS.primary },
  { id: 'waist', label: 'Cintura', icon: 'tape-measure', value: '', color: COLORS.secondary },
  { id: 'hips', label: 'Cadera', icon: 'human', value: '', color: COLORS.tertiary },
  { id: 'arms', label: 'Brazos', icon: 'arm-flex', value: '', color: '#4dd0e1' },
  { id: 'legs', label: 'Piernas', icon: 'walk', value: '', color: '#ff9475' },
];

const todayISO = () => new Date().toISOString().split('T')[0];

const PesoYMedidasScreen: React.FC = () => {
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [measurements, setMeasurements] = useState<MeasurementField[]>(INITIAL_MEASUREMENTS);
  const [selectedId, setSelectedId] = useState<string>('chest');
  const [saving, setSaving] = useState(false);

  // Load existing measurements for today on mount
  useEffect(() => {
    (async () => {
      const data = await getMeasurementsForDate(todayISO());
      if (!data) return;
      if (data.gender) setGender(data.gender);
      if (data.weight_kg != null) setWeight(String(data.weight_kg));
      if (data.body_fat_pct != null) setBodyFat(String(data.body_fat_pct));
      setMeasurements((prev) =>
        prev.map((m) => {
          const fieldMap: Record<string, number | null> = {
            chest: data.chest_cm,
            waist: data.waist_cm,
            hips: data.hips_cm,
            arms: data.arms_cm,
            legs: data.legs_cm,
          };
          const val = fieldMap[m.id];
          return val != null ? { ...m, value: String(val) } : m;
        })
      );
    })();
  }, []);

  const updateMeasurement = (id: string, value: string) => {
    setMeasurements((prev) =>
      prev.map((m) => (m.id === id ? { ...m, value } : m))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const get = (id: string) => {
      const raw = measurements.find((m) => m.id === id)?.value ?? '';
      const n = parseFloat(raw);
      return isNaN(n) ? null : n;
    };
    const ok = await saveMeasurements({
      gender,
      weight_kg: parseFloat(weight) || null,
      body_fat_pct: parseFloat(bodyFat) || null,
      chest_cm: get('chest'),
      waist_cm: get('waist'),
      hips_cm: get('hips'),
      arms_cm: get('arms'),
      legs_cm: get('legs'),
    });
    setSaving(false);
    if (ok) Alert.alert('Guardado', 'Tu registro fue guardado correctamente.');
    else Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión.');
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Peso y</Text>
          <Text style={[styles.title, { color: COLORS.primaryDim }]}>Medidas</Text>
          <Text style={styles.subtitle}>Seguimiento antropométrico</Text>
        </View>

        {/* Gender Toggle */}
        <View style={styles.section}>
          <View style={styles.genderToggle}>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
              onPress={() => setGender('male')}
            >
              <MaterialCommunityIcons
                name="gender-male"
                size={18}
                color={gender === 'male' ? COLORS.bg : COLORS.textVariant}
              />
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>
                Hombre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
              onPress={() => setGender('female')}
            >
              <MaterialCommunityIcons
                name="gender-female"
                size={18}
                color={gender === 'female' ? COLORS.bg : COLORS.textVariant}
              />
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>
                Mujer
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight & Body Fat Cards */}
        <View style={styles.section}>
          <View style={styles.cardRow}>
            <View style={[styles.inputCard, { borderLeftColor: COLORS.primary }]}>
              <View style={styles.inputCardHeader}>
                <MaterialCommunityIcons name="scale-bathroom" size={16} color={COLORS.primary} />
                <Text style={styles.inputLabel}>Peso</Text>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.inputField}
                  placeholder="0.0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>KG</Text>
              </View>
            </View>

            <View style={[styles.inputCard, { borderLeftColor: COLORS.secondary }]}>
              <View style={styles.inputCardHeader}>
                <MaterialCommunityIcons name="percent" size={16} color={COLORS.secondary} />
                <Text style={styles.inputLabel}>Grasa</Text>
              </View>
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.inputField}
                  placeholder="0"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={bodyFat}
                  onChangeText={setBodyFat}
                  keyboardType="decimal-pad"
                />
                <Text style={styles.inputUnit}>%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Body Figure with Hotspots */}
        <View style={styles.section}>
          <View style={styles.bodyFrame}>
            <MaterialCommunityIcons
              name={gender === 'male' ? 'human-male' : 'human-female'}
              size={200}
              color="rgba(209,255,38,0.15)"
              style={styles.bodyIcon}
            />
            {/* Hotspot dots overlaid */}
            {measurements.map((m) => {
              const positions: Record<string, { top: number; left: number }> = {
                chest: { top: 65, left: width * 0.32 },
                waist: { top: 115, left: width * 0.5 - 24 },
                hips: { top: 155, left: width * 0.32 },
                arms: { top: 85, left: width * 0.58 },
                legs: { top: 210, left: width * 0.5 - 24 },
              };
              const pos = positions[m.id] || { top: 0, left: 0 };
              const isActive = selectedId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.hotspot,
                    { top: pos.top, left: pos.left },
                    isActive && { backgroundColor: m.color, borderColor: m.color },
                  ]}
                  onPress={() => setSelectedId(m.id)}
                >
                  <View style={[styles.hotspotDot, isActive && { backgroundColor: '#000' }]} />
                </TouchableOpacity>
              );
            })}
            {/* Selected label */}
            <View style={styles.bodyLabel}>
              <Text style={styles.bodyLabelSub}>Zona</Text>
              <Text style={styles.bodyLabelMain}>
                {measurements.find((m) => m.id === selectedId)?.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Measurements List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medidas corporales</Text>
          <View style={styles.measurementsList}>
            {measurements.map((m) => {
              const isActive = selectedId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.measurementRow,
                    { borderLeftColor: isActive ? m.color : COLORS.surfaceHighest },
                    isActive && styles.measurementRowActive,
                  ]}
                  onPress={() => setSelectedId(m.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.measurementLeft}>
                    <View style={[styles.measurementIcon, { backgroundColor: `${m.color}15` }]}>
                      <MaterialCommunityIcons name={m.icon as any} size={18} color={m.color} />
                    </View>
                    <Text style={[styles.measurementLabel, isActive && { color: COLORS.text }]}>
                      {m.label}
                    </Text>
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
                    <Text style={styles.measurementUnit}>cm</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Save */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar Registro'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
    marginTop: 10,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: COLORS.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textVariant,
  },
  genderTextActive: {
    color: COLORS.bg,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderLeftWidth: 3,
    padding: 16,
  },
  inputCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  inputField: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  inputUnit: {
    fontSize: 14,
    color: COLORS.textVariant,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bodyFrame: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    height: 300,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bodyIcon: {
    opacity: 1,
  },
  hotspot: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(209,255,38,0.25)',
    borderWidth: 2,
    borderColor: 'rgba(209,255,38,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hotspotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bodyLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  bodyLabelSub: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bodyLabelMain: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  measurementsList: {
    gap: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 3,
  },
  measurementRowActive: {
    backgroundColor: COLORS.surfaceHigh,
  },
  measurementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  measurementIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textVariant,
  },
  measurementRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  measurementInput: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 70,
    textAlign: 'right',
  },
  measurementInputActive: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  measurementUnit: {
    fontSize: 12,
    color: COLORS.textVariant,
    fontWeight: '600',
  },
  actionSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.5,
  },
});

export default PesoYMedidasScreen;
