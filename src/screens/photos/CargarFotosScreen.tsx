import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  PanResponder,
  Dimensions,
} from 'react-native';

const { height: SCREEN_H } = Dimensions.get('window');
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { uploadProgressPhoto, type PhotoPosition } from '../../services/photosService';
import { radius } from '../../theme/radius';

const COLORS = {
  bg: '#0e0e0e',
  surface: '#1a1a1a',
  surfaceHighest: '#262626',
  primary: '#D1FF26',
  primaryDim: '#c1ed00',
  text: '#ffffff',
  textVariant: '#adaaaa',
  outline: '#767575',
};

const STEPS = [
  {
    id: 'frente' as PhotoPosition,
    label: 'FRENTE',
    title: 'VISTA FRONTAL',
    icon: 'account' as const,
    instructions:
      'BUENA ILUMINACIÓN NATURAL Y\nFONDO DE PARED LISA.\nHOMBRES: SOLO SHORT.\nMUJERES: SHORT Y TOP.',
  },
  {
    id: 'perfil' as PhotoPosition,
    label: 'PERFIL',
    title: 'VISTA DE PERFIL',
    icon: 'account-switch' as const,
    instructions:
      'PÁRATE DE LADO CON LOS BRAZOS\nEXTENDIDOS HACIA ADELANTE.\nMISMA ILUMINACIÓN Y FONDO LISO.',
  },
  {
    id: 'espalda' as PhotoPosition,
    label: 'ESPALDA',
    title: 'VISTA DE ESPALDA',
    icon: 'account-multiple' as const,
    instructions:
      'DA LA ESPALDA A LA CÁMARA,\nPIES AL ANCHO DE HOMBROS.\nHOMBRES: SOLO SHORT.\nMUJERES: SHORT Y TOP.',
  },
];

type Photos = Record<PhotoPosition, string | null>;

const CargarFotosScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<Photos>({ frente: null, perfil: null, espalda: null });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const current = STEPS[step];
  const currentPhoto = photos[current.id];
  const hasAnyPhoto = Object.values(photos).some(Boolean);

  // Ref para evitar stale closure en PanResponder
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; }, [step]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50 && stepRef.current < STEPS.length - 1) {
          setStep(stepRef.current + 1);
        } else if (dx > 50 && stepRef.current > 0) {
          setStep(stepRef.current - 1);
        }
      },
    })
  ).current;

  const handleTakePhoto = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => ({ ...prev, [current.id]: result.assets[0].uri }));
      }
    } catch {
      Alert.alert('Error', 'No se pudo tomar la foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotos((prev) => ({ ...prev, [current.id]: result.assets[0].uri }));
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar la foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const entries = Object.entries(photos).filter(([, uri]) => uri !== null) as [PhotoPosition, string][];
    if (entries.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        entries.map(([position, uri]) => uploadProgressPhoto(position, uri))
      );
      Alert.alert('¡Listo!', 'Tus fotos de progreso se guardaron correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error al guardar', err?.message ?? 'Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Header ── */}
      <View style={styles.screenHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={18} color="#000" />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>CARGAR FOTOS DE PROGRESO</Text>
          <Text style={styles.subtitle}>TRACKING MENTAL Y FÍSICO</Text>
        </View>
      </View>

      {/* Step Tabs */}
      <View style={styles.tabs}>
        {STEPS.map((s, i) => (
          <TouchableOpacity key={s.id} style={styles.tab} onPress={() => setStep(i)}>
            <Text style={[styles.tabLabel, i === step && styles.tabLabelActive]}>
              {s.label}
            </Text>
            <View style={[styles.tabUnderline, i === step && styles.tabUnderlineActive]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Photo Area — flex:1, swipeable left/right */}
      <View style={styles.photoArea} {...panResponder.panHandlers}>
        {loading ? (
          <View style={styles.placeholderContent}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : currentPhoto ? (
          <Image
            source={{ uri: currentPhoto }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderContent}>
            <View style={styles.personIconBg}>
              <MaterialCommunityIcons name={current.icon} size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.positionTitle}>{current.title}</Text>
            <Text style={styles.instructions}>{current.instructions}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.infoBtn}>
          <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.primary} />
        </TouchableOpacity>

        <View style={styles.photoButtons}>
          <TouchableOpacity style={styles.btnCamera} onPress={handleTakePhoto} disabled={loading}>
            <MaterialCommunityIcons name="camera" size={14} color="#000" />
            <Text style={styles.btnCameraText}>TOMAR FOTO</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGallery} onPress={handleSelectFromGallery} disabled={loading}>
            <Text style={styles.btnGalleryText}>GALERÍA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Step Navigation */}
      <View style={styles.stepNav}>
        <TouchableOpacity
          style={styles.stepNavSide}
          onPress={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={16}
            color={step === 0 ? COLORS.outline : COLORS.text}
          />
          <Text style={[styles.stepNavLabel, step === 0 && styles.stepNavLabelDisabled]}>
            ANTERIOR
          </Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.stepNavSide}
          onPress={() => step < STEPS.length - 1 && setStep(step + 1)}
          disabled={step === STEPS.length - 1}
        >
          <Text
            style={[
              styles.stepNavLabel,
              { color: step === STEPS.length - 1 ? COLORS.outline : COLORS.primary },
            ]}
          >
            SIGUIENTE
          </Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={16}
            color={step === STEPS.length - 1 ? COLORS.outline : COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Save */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.saveBtn, (!hasAnyPhoto || saving) && styles.saveBtnDisabled]}
          disabled={!hasAnyPhoto || saving}
          onPress={handleSave}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={[styles.saveBtnText, !hasAnyPhoto && styles.saveBtnTextDisabled]}>
              GUARDAR REGISTROS
            </Text>
          )}
        </TouchableOpacity>
        <Text style={styles.encryptionNote}>TUS DATOS ESTÁN ENCRIPTADOS Y SEGUROS</Text>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    marginBottom: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.input,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  subtitle: {
    fontSize: 9,
    color: '#00e3fd',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginTop: 1,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabLabel: {
    fontFamily: 'Lexend',
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textVariant,
    letterSpacing: 1.5,
  },
  tabLabelActive: {
    color: COLORS.text,
  },
  tabUnderline: {
    marginTop: 6,
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: COLORS.primary,
  },
  photoArea: {
    height: Math.round(SCREEN_H * 0.42),
    marginHorizontal: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(193, 237, 0, 0.35)',
    borderRadius: radius.md,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 12,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 70,
  },
  personIconBg: {
    width: 72,
    height: 72,
    borderRadius: radius.input,
    backgroundColor: 'rgba(193, 237, 0, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  positionTitle: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 28,
    color: COLORS.text,
    letterSpacing: 2,
    marginBottom: 10,
    textAlign: 'center',
  },
  instructions: {
    fontFamily: 'Lexend',
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.textVariant,
    letterSpacing: 1,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  photoButtons: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 10,
  },
  btnCamera: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: radius.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnCameraText: {
    fontFamily: 'Lexend',
    fontSize: 9,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 1.5,
  },
  btnGallery: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.surfaceHighest,
    borderRadius: radius.control,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnGalleryText: {
    fontFamily: 'Lexend',
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  stepNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  stepNavSide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  stepNavLabel: {
    fontFamily: 'Lexend',
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1.5,
  },
  stepNavLabelDisabled: {
    color: COLORS.outline,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.xsTight,
    backgroundColor: COLORS.surfaceHighest,
  },
  dotActive: {
    backgroundColor: COLORS.primary,
  },
  actionSection: {
    marginHorizontal: 20,
    gap: 10,
  },
  saveBtn: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: radius.input,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.surfaceHighest,
  },
  saveBtnText: {
    fontFamily: 'BebasNeue_400Regular',
    fontSize: 20,
    color: '#000',
    letterSpacing: 2,
  },
  saveBtnTextDisabled: {
    color: COLORS.textVariant,
  },
  encryptionNote: {
    fontFamily: 'Lexend',
    textAlign: 'center',
    fontSize: 9,
    color: COLORS.outline,
    letterSpacing: 1.5,
  },
});

export default CargarFotosScreen;
