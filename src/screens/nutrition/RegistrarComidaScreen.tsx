import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { saveMealLog, updateMealLog, getMealsForDate, type MealLog } from '../../services/mealService';
import { useUIStore } from '../../store/uiStore';
import { formatDate, todayISO } from '../../utils/dateUtils';

const { width, height } = Dimensions.get('window');

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHighest: '#262626',
  surfaceLow: '#131313',
  primary: '#D1FF26',
  secondary: '#00e3fd',
  tertiary: '#ff734a',
  text: '#ffffff',
  textVariant: '#adaaaa',
};

type Momento = 'DES' | 'ALM' | 'MER' | 'CEN';

const MOMENTOS: { key: Momento; label: string; full: string; color: string }[] = [
  { key: 'DES', label: 'DES', full: 'Desayuno', color: COLORS.primary },
  { key: 'ALM', label: 'ALM', full: 'Almuerzo', color: COLORS.secondary },
  { key: 'MER', label: 'MER', full: 'Merienda', color: COLORS.tertiary },
  { key: 'CEN', label: 'CEN', full: 'Cena', color: '#a78bfa' },
];

const PHOTO_H = Math.min(height * 0.26, 210);

const MEAL_TYPE_LABELS: Record<Momento, string> = {
  DES: 'Desayuno', ALM: 'Almuerzo', MER: 'Merienda', CEN: 'Cena',
};

export default function RegistrarComidaScreen() {
  const navigation = useNavigation<any>();
  const activeDate = useUIStore((s) => s.activeDate);
  const isToday = activeDate === todayISO();
  const tabBarHeight = useBottomTabBarHeight();

  const [photo, setPhoto] = useState<string | null>(null);
  const [momento, setMomento] = useState<Momento>('DES');
  const [titulo, setTitulo] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingMeals, setExistingMeals] = useState<MealLog[]>([]);
  const [existingRecord, setExistingRecord] = useState<MealLog | null>(null);

  // Load already-saved meals for this day
  useEffect(() => {
    let cancelled = false;
    getMealsForDate(activeDate).then((meals) => {
      if (!cancelled) setExistingMeals(meals);
    });
    return () => { cancelled = true; };
  }, [activeDate]);

  // When momento or existingMeals change, pre-fill with existing data
  useEffect(() => {
    const match = existingMeals.find((m) => m.meal_type === momento) ?? null;
    setExistingRecord(match);
    setTitulo(match?.title ?? '');
    setPhoto(match?.photo_url ?? null);
  }, [momento, existingMeals]);

  const pickPhoto = () => {
    Alert.alert('Agregar foto', 'Elegí una opción', [
      {
        text: 'Cámara',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled) setPhoto(result.assets[0].uri);
        },
      },
      {
        text: 'Galería',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') return;
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled) setPhoto(result.assets[0].uri);
        },
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);

    let ok: boolean;
    if (existingRecord) {
      // Update existing record
      ok = await updateMealLog(existingRecord.id, {
        title: titulo.trim() || null,
        photo_uri: photo,
      });
    } else {
      // Create new record
      ok = await saveMealLog({
        date: activeDate,
        meal_type: momento,
        title: titulo.trim() || null,
        photo_uri: photo,
      });
    }

    setSaving(false);
    if (ok) {
      const dayLabel = isToday ? 'hoy' : `el ${formatDate(activeDate)}`;
      const action = existingRecord ? 'actualizada' : 'registrada';
      Alert.alert(
        existingRecord ? 'Actualizado' : 'Guardado',
        `Tu ${MEAL_TYPE_LABELS[momento].toLowerCase()} fue ${action} para ${dayLabel}.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
      // Refresh existing meals list
      getMealsForDate(activeDate).then(setExistingMeals);
    } else {
      Alert.alert('Error', 'No se pudo guardar. Verificá tu conexión.');
    }
  };

  const isUpdating = !!existingRecord;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={18} color="#000" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.title}>COMIDA</Text>
            <Text style={styles.subtitle}>REGISTRA TU COMIDA</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <MaterialCommunityIcons name="close" size={18} color={COLORS.textVariant} />
          </TouchableOpacity>
        </View>

        {/* Fecha activa */}
        {!isToday && (
          <View style={styles.dateBadgeWrap}>
            <View style={styles.dateBadge}>
              <MaterialCommunityIcons name="calendar" size={11} color={COLORS.secondary} />
              <Text style={styles.dateBadgeText}>{formatDate(activeDate)}</Text>
            </View>
          </View>
        )}

        {/* ── Comidas ya guardadas ese día ── */}
        {existingMeals.length > 0 && (
          <View style={styles.existingWrap}>
            <Text style={styles.existingTitle}>Ya registrado</Text>
            <View style={styles.existingList}>
              {existingMeals.map((m) => {
                const mom = MOMENTOS.find((x) => x.key === m.meal_type);
                const isSelected = m.meal_type === momento;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.existingChip,
                      { borderColor: mom?.color ?? COLORS.primary },
                      isSelected && { backgroundColor: `${mom?.color ?? COLORS.primary}22` },
                    ]}
                    onPress={() => setMomento(m.meal_type as Momento)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.existingDot, { backgroundColor: mom?.color ?? COLORS.primary }]} />
                    <Text style={styles.existingChipText}>{mom?.full ?? m.meal_type}</Text>
                    {m.title ? <Text style={styles.existingChipSub}>{m.title}</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* ── Photo Card ── */}
          <TouchableOpacity style={styles.photoCard} onPress={pickPhoto} activeOpacity={0.88}>
            {photo ? (
              <>
                <Image source={{ uri: photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                <View style={styles.photoOverlay}>
                  <MaterialCommunityIcons name="camera-retake" size={26} color="#fff" />
                  <Text style={styles.photoOverlayLabel}>CAMBIAR FOTO</Text>
                </View>
              </>
            ) : (
              <View style={styles.photoEmpty}>
                <MaterialCommunityIcons name="camera" size={42} color={COLORS.primary} />
                <Text style={styles.photoEmptyLabel}>TOMAR FOTO O CARGAR GALERÍA</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Momento Selector ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECCIONAR MOMENTO</Text>
            <View style={styles.momentoGrid}>
              {MOMENTOS.map((m) => {
                const active = momento === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.momentoBtn,
                      active && { backgroundColor: m.color },
                    ]}
                    onPress={() => setMomento(m.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.momentoLabel, active && styles.momentoLabelActive]}>
                      {m.label}
                    </Text>
                    {active && (
                      <Text style={styles.momentoFull}>{m.full}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Detalle — textarea real ── */}
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>DETALLE</Text>
            <TextInput
              style={styles.detailTextarea}
              placeholder="Describe lo que comiste, porciones, sensaciones..."
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={titulo}
              onChangeText={setTitulo}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              returnKeyType="default"
            />
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ── Guardar — fuera del scroll, fijo al fondo ── */}
        <View style={[styles.footer, { paddingBottom: tabBarHeight + 8 }]}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              saving && { opacity: 0.6 },
              isUpdating && styles.saveBtnUpdate,
            ]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.9}
          >
            <Text style={styles.saveBtnText}>
              {saving
                ? (isUpdating ? 'ACTUALIZANDO...' : 'GUARDANDO...')
                : (isUpdating ? 'ACTUALIZAR REGISTRO' : 'GUARDAR REGISTRO')}
            </Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  headerTitle: { flex: 1 },
  title: {
    fontSize: 28, fontWeight: '900', color: COLORS.text,
    letterSpacing: -1, lineHeight: 32, textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 9, fontWeight: '700', color: COLORS.primary,
    letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.85, marginTop: 1,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.surfaceHighest,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },

  // Fecha
  dateBadgeWrap: { paddingHorizontal: 20, marginBottom: 8 },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,227,253,0.1)', borderRadius: 7,
    paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(0,227,253,0.2)',
  },
  dateBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.secondary },

  // Comidas existentes
  existingWrap: { paddingHorizontal: 20, marginBottom: 10 },
  existingTitle: {
    fontSize: 9, fontWeight: '700', color: COLORS.textVariant,
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6,
  },
  existingList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  existingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.surfaceHighest, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1,
  },
  existingDot: { width: 6, height: 6, borderRadius: 3 },
  existingChipText: { fontSize: 11, fontWeight: '700', color: COLORS.text },
  existingChipSub: { fontSize: 10, color: COLORS.textVariant },

  scroll: { paddingHorizontal: 20 },

  // ── Foto ──
  photoCard: {
    width: '100%', height: PHOTO_H, borderRadius: 14,
    backgroundColor: COLORS.surfaceLow,
    borderWidth: 1, borderColor: COLORS.surfaceHighest,
    overflow: 'hidden', marginBottom: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  photoEmpty: { alignItems: 'center', gap: 10, paddingHorizontal: 32 },
  photoEmptyLabel: {
    fontSize: 10, fontWeight: '700', color: COLORS.primary,
    letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', lineHeight: 15,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  photoOverlayLabel: {
    fontSize: 10, fontWeight: '700', color: '#fff', letterSpacing: 2, textTransform: 'uppercase',
  },

  // ── Momento ──
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 9, fontWeight: '700', color: COLORS.textVariant,
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
  },
  momentoGrid: { flexDirection: 'row', gap: 8 },
  momentoBtn: {
    flex: 1, backgroundColor: COLORS.surfaceHighest, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  momentoLabel: {
    fontSize: 11, fontWeight: '900', color: COLORS.textVariant,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  momentoLabelActive: { color: '#000' },
  momentoFull: {
    fontSize: 8, fontWeight: '600', color: 'rgba(0,0,0,0.55)',
    letterSpacing: 0.3, textTransform: 'uppercase',
  },

  // ── Detalle ──
  detailCard: {
    backgroundColor: COLORS.surfaceLow, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  detailTitle: {
    fontSize: 13, fontWeight: '800', color: COLORS.text,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
  },
  detailTextarea: {
    color: COLORS.text, fontSize: 14, lineHeight: 22,
    minHeight: 110, textAlignVertical: 'top',
    borderRadius: 8, backgroundColor: COLORS.surfaceHighest,
    padding: 12,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 20, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  saveBtnUpdate: {
    backgroundColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
  },
  saveBtnText: {
    fontSize: 15, fontWeight: '900', color: '#000',
    letterSpacing: 2, textTransform: 'uppercase',
  },
});
