import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHigh: '#20201f',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  primaryFixed: '#cefc22',
  secondary: '#00e3fd',
  secondaryFixed: '#26e6ff',
  tertiary: '#ff734a',
  tertiaryFixed: '#ff9475',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

type Gender = 'male' | 'female';

interface MeasurementHotspot {
  id: string;
  label: string;
  position: 'top' | 'left' | 'center' | 'right' | 'bottom';
  percentage: { top?: string; left?: string; right?: string; bottom?: string };
}

interface Measurement {
  id: 'chest' | 'waist' | 'hips' | 'arms' | 'legs';
  label: string;
  value: string;
}

const HOTSPOTS: MeasurementHotspot[] = [
  {
    id: 'chest',
    label: 'Pecho',
    position: 'top',
    percentage: { top: '30%', left: '50%' },
  },
  {
    id: 'arms',
    label: 'Brazos',
    position: 'left',
    percentage: { top: '35%', left: '30%' },
  },
  {
    id: 'waist',
    label: 'Cintura',
    position: 'center',
    percentage: { top: '45%', left: '50%' },
  },
  {
    id: 'hips',
    label: 'Cadera',
    position: 'center',
    percentage: { top: '55%', left: '50%' },
  },
  {
    id: 'legs',
    label: 'Piernas',
    position: 'bottom',
    percentage: { top: '70%', left: '60%' },
  },
];

const MEASUREMENTS: Measurement[] = [
  { id: 'chest', label: 'Pecho', value: '' },
  { id: 'waist', label: 'Cintura', value: '' },
  { id: 'hips', label: 'Cadera', value: '' },
  { id: 'arms', label: 'Brazos', value: '' },
  { id: 'legs', label: 'Piernas', value: '' },
];

const PesoYMedidasScreen: React.FC = () => {
  const [gender, setGender] = useState<Gender>('male');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [measurements, setMeasurements] = useState<Measurement[]>(MEASUREMENTS);
  const [selectedMeasurement, setSelectedMeasurement] = useState<'chest' | 'waist' | 'hips' | 'arms' | 'legs'>('chest');

  const updateMeasurement = (id: string, value: string) => {
    setMeasurements(prev =>
      prev.map(m => (m.id === id ? { ...m, value } : m))
    );
  };

  const selectedMeasurementData = measurements.find(m => m.id === selectedMeasurement);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Peso y Medidas</Text>
          <Text style={styles.subtitle}>Sigue tu transformación</Text>
        </View>

        {/* Gender Toggle and Weight/BF */}
        <View style={styles.controlsSection}>
          {/* Gender Toggle */}
          <View style={styles.genderToggle}>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'male' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('male')}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === 'male' && styles.genderButtonTextActive,
                ]}
              >
                Hombre
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderButton,
                gender === 'female' && styles.genderButtonActive,
              ]}
              onPress={() => setGender('female')}
            >
              <Text
                style={[
                  styles.genderButtonText,
                  gender === 'female' && styles.genderButtonTextActive,
                ]}
              >
                Mujer
              </Text>
            </TouchableOpacity>
          </View>

          {/* Weight Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Peso Actual</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.inputField}
                placeholder="00.0"
                placeholderTextColor={COLORS.textVariant}
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
              />
              <Text style={styles.inputUnit}>KG</Text>
            </View>
          </View>

          {/* Body Fat Input */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>Grasa Corporal</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.inputField}
                placeholder="00"
                placeholderTextColor={COLORS.textVariant}
                value={bodyFat}
                onChangeText={setBodyFat}
                keyboardType="number-pad"
              />
              <Text style={styles.inputUnit}>%</Text>
            </View>
          </View>
        </View>

        {/* Body Avatar with Hotspots */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarFrame}>
            {/* Body Image */}
            <Image
              source={{
                uri: 'https://via.placeholder.com/200x300',
              }}
              style={styles.avatarImage}
            />

            {/* Overlay Gradient */}
            <View style={styles.avatarGradient} />

            {/* Hotspots */}
            {HOTSPOTS.map(hotspot => (
              <TouchableOpacity
                key={hotspot.id}
                style={[
                  styles.hotspot,
                  {
                    top: hotspot.percentage.top,
                    left: hotspot.percentage.left,
                  },
                  selectedMeasurement === hotspot.id && styles.hotspotActive,
                ]}
                onPress={() => setSelectedMeasurement(hotspot.id as any)}
              >
                <View
                  style={[
                    styles.hotspotInner,
                    selectedMeasurement === hotspot.id &&
                      styles.hotspotInnerActive,
                  ]}
                />
              </TouchableOpacity>
            ))}

            {/* Selected Label */}
            <View style={styles.selectedLabel}>
              <Text style={styles.selectedLabelSubtitle}>Zona Seleccionada</Text>
              <Text style={styles.selectedLabelText}>
                {selectedMeasurementData?.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Measurements Input List */}
        <View style={styles.measurementsSection}>
          {measurements.map((measurement, index) => (
            <View
              key={measurement.id}
              style={[
                styles.measurementRow,
                selectedMeasurement === measurement.id &&
                  styles.measurementRowActive,
                index > 0 && styles.measurementRowInactive,
              ]}
            >
              <View style={styles.measurementLabel}>
                <Text style={styles.measurementIcon}>📏</Text>
                <Text style={styles.measurementText}>{measurement.label}</Text>
              </View>
              <View style={styles.measurementInput}>
                <TextInput
                  style={styles.measurementInputField}
                  placeholder="00"
                  placeholderTextColor={COLORS.textVariant}
                  value={measurement.value}
                  onChangeText={value =>
                    updateMeasurement(measurement.id, value)
                  }
                  keyboardType="number-pad"
                  editable={selectedMeasurement === measurement.id}
                />
                <Text style={styles.measurementUnit}>cm</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Save Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Guardar Registro</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  controlsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  genderToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: COLORS.surfaceHighest,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  genderButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.5,
  },
  genderButtonTextActive: {
    color: COLORS.primaryFixed,
  },
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primaryFixed,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: COLORS.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textVariant,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  inputField: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
  inputUnit: {
    fontSize: 12,
    color: COLORS.textVariant,
    fontWeight: '600',
  },
  avatarSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  avatarFrame: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    aspectRatio: 4 / 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${COLORS.text}08`,
    position: 'relative',
  },
  avatarImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  avatarGradient: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(to bottom, transparent, rgba(14, 14, 14, 0.7))',
  },
  hotspot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primaryFixed}4D`,
    borderWidth: 2,
    borderColor: COLORS.primaryFixed,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -16,
    marginTop: -16,
    shadowColor: COLORS.primaryFixed,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  hotspotActive: {
    borderColor: COLORS.text,
    backgroundColor: COLORS.primaryFixed,
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: -20,
    marginTop: -20,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  hotspotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: `${COLORS.text}66`,
  },
  hotspotInnerActive: {
    backgroundColor: COLORS.text,
  },
  selectedLabel: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    zIndex: 10,
  },
  selectedLabelSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryFixed,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  selectedLabelText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.4,
  },
  measurementsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceHigh,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryFixed,
  },
  measurementRowActive: {
    backgroundColor: COLORS.surfaceHigh,
    borderLeftColor: COLORS.primaryFixed,
  },
  measurementRowInactive: {
    opacity: 0.6,
    borderLeftColor: COLORS.textVariant,
  },
  measurementLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  measurementIcon: {
    fontSize: 16,
  },
  measurementText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  measurementInput: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  measurementInputField: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: 60,
    textAlign: 'right',
  },
  measurementUnit: {
    fontSize: 10,
    color: COLORS.textVariant,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actionSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  bottomSpacer: {
    height: 32,
  },
});

export default PesoYMedidasScreen;
