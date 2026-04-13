import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  resolveOrCreateFoodFromBarcode,
  findFoodByBarcode,
  type FoodRow,
} from '../../services/foodService';
import {
  getMealTypeLabel,
  quickAddPhotoMealJournal,
  type MealType,
} from '../../services/mealService';
import { colors } from '../../theme/colors';

const C = {
  bg: colors.background,
  surface: colors.surface.base,
  text: colors.text.primary,
  muted: colors.text.tertiary,
  lime: colors.primary.default,
  limeMuted: colors.primary.muted,
  cyan: colors.secondary.default,
  border: 'rgba(209, 255, 38, 0.22)',
};

type ScanMode = 'foto' | 'codigo';

type Props = {
  /** Desde Lista (+); si es null se usa Desayuno al guardar rápido */
  pendingMealType: MealType | null;
  activeDate: string;
  onMealSaved?: () => void;
  /** Si es true, solo agrega a la base de alimentos; nunca crea registro de comida diaria */
  catalogOnly?: boolean;
  /** Modo diario: al resolver el código se abre la hoja de detalle */
  onFoodForDetail?: (food: FoodRow) => void;
};

export function AlimentacionEscanerPanel({
  pendingMealType,
  activeDate,
  onMealSaved,
  catalogOnly = false,
  onFoodForDetail,
}: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [mode, setMode] = useState<ScanMode>('codigo');
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [capturing, setCapturing] = useState(false);
  const barcodeLock = useRef(false);
  const scanY = useSharedValue(0);
  const frameHeight = useSharedValue(200);

  useEffect(() => {
    barcodeLock.current = false;
  }, [mode]);

  useEffect(() => {
    if (mode === 'codigo') {
      scanY.value = 0;
      scanY.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(scanY);
    }
  }, [mode, scanY]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * (frameHeight.value - 2) }],
  }));

  const mealTypeForLog = pendingMealType ?? 'DES';

  const savePhotoUri = (uri: string) => {
    Alert.alert(
      'Agregar al diario',
      `Se guardará la foto en ${getMealTypeLabel(mealTypeForLog)} como referencia (sin macros).`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Guardar',
          onPress: () => {
            void (async () => {
              const ok = await quickAddPhotoMealJournal(mealTypeForLog, activeDate, uri);
              if (ok) {
                Alert.alert('Listo', 'Foto agregada al día.');
                onMealSaved?.();
              } else {
                Alert.alert('Error', 'No se pudo guardar. Reintentá.');
              }
            })();
          },
        },
      ],
    );
  };

  const onBarcode = useCallback(
    (result: BarcodeScanningResult) => {
      if (mode !== 'codigo' || barcodeLock.current) return;
      const data = result.data?.trim();
      if (!data) return;
      barcodeLock.current = true;
      void (async () => {
        let releaseOnDismiss = false;
        try {
          const existing = await findFoodByBarcode(data);

          if (catalogOnly) {
            // ── Modo catálogo: solo gestiona la base de alimentos ──
            if (existing) {
              releaseOnDismiss = true;
              Alert.alert(
                'Ya en tu catálogo',
                `"${existing.name}" ya existe en tu base de alimentos.`,
                [{ text: 'OK', onPress: () => { barcodeLock.current = false; } }],
              );
              return;
            }
            const food = await resolveOrCreateFoodFromBarcode(data);
            if (!food) {
              releaseOnDismiss = true;
              Alert.alert(
                'No encontrado',
                'No hay producto en Open Food Facts para este código. Probá otro o cargá manualmente.',
                [{ text: 'OK', onPress: () => { barcodeLock.current = false; } }],
              );
              return;
            }
            releaseOnDismiss = true;
            Alert.alert('Guardado en catálogo', `"${food.name}" fue agregado a tu base de alimentos.`, [
              { text: 'OK', onPress: () => { barcodeLock.current = false; onMealSaved?.(); } },
            ]);
            return;
          }

          // ── Modo registro diario: hoja de detalle ──
          if (existing) {
            onFoodForDetail?.(existing);
            barcodeLock.current = false;
            return;
          }
          const food = await resolveOrCreateFoodFromBarcode(data);
          if (!food) {
            releaseOnDismiss = true;
            Alert.alert(
              'No encontrado',
              'No hay producto en Open Food Facts para este código. Probá otro o cargá desde Buscar.',
              [{ text: 'OK', onPress: () => { barcodeLock.current = false; } }],
            );
            return;
          }
          onFoodForDetail?.(food);
          barcodeLock.current = false;
          return;
        } catch (e) {
          console.warn('onBarcode error:', e);
          Alert.alert('Error', 'Ocurrió un error al procesar el código. Reintentá.');
        } finally {
          if (!releaseOnDismiss) barcodeLock.current = false;
        }
      })();
    },
    [mode, mealTypeForLog, activeDate, onMealSaved, catalogOnly, onFoodForDetail],
  );

  const takePhoto = async () => {
    if (!cameraRef.current || capturing) return;
    try {
      setCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) savePhotoUri(photo.uri);
    } catch (e) {
      console.warn('takePicture', e);
      Alert.alert('Cámara', 'No se pudo capturar. Reintentá.');
    } finally {
      setCapturing(false);
    }
  };

  const pickGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      savePhotoUri(res.assets[0].uri);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <MaterialCommunityIcons name="camera-off" size={48} color={C.muted} />
        <Text style={styles.webText}>La cámara no está disponible en web. Usá la app en el dispositivo.</Text>
      </View>
    );
  }

  if (!permission?.granted) {
    return (
      <View style={styles.permBox}>
        <Text style={styles.permText}>Activá la cámara para fotografiar tu plato o leer el código del producto.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={() => void requestPermission()}>
          <Text style={styles.permBtnText}>Permitir acceso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerBlock}>
        <Text style={styles.kicker}>REGISTRO RÁPIDO</Text>
        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {mode === 'foto' ? 'Capturá tu plato' : 'Leé el código del envase'}
          </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Cómo usar',
                mode === 'foto'
                  ? 'Encuadrá la comida, tocá el disparador con borde lima o elegí una foto de la galería.'
                  : 'Enfocá el código de barras (EAN). Si existe en Open Food Facts, cargamos los datos.',
              )
            }
            hitSlop={12}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={22} color={C.cyan} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'codigo' && styles.modeChipOn]}
          onPress={() => setMode('codigo')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="barcode-scan"
            size={18}
            color={mode === 'codigo' ? C.lime : C.muted}
          />
          <Text style={[styles.modeLabel, mode === 'codigo' && styles.modeLabelOn]}>Código</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeChip, mode === 'foto' && styles.modeChipOn]}
          onPress={() => setMode('foto')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="camera-outline"
            size={18}
            color={mode === 'foto' ? C.lime : C.muted}
          />
          <Text style={[styles.modeLabel, mode === 'foto' && styles.modeLabelOn]}>Plato</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.frameOuter}>
        <LinearGradient
          colors={['rgba(209,255,38,0.12)', 'transparent', 'rgba(0,227,253,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.frameInner} onLayout={(e) => { frameHeight.value = e.nativeEvent.layout.height; }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing="back"
            flash={flash}
            mode="picture"
            autofocus="on"
            barcodeScannerSettings={
              mode === 'codigo'
                ? { barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }
                : { barcodeTypes: [] }
            }
            onBarcodeScanned={mode === 'codigo' ? onBarcode : undefined}
          />
          {mode === 'codigo' && (
            <Animated.View style={[styles.scanLine, scanLineStyle]} pointerEvents="none">
              <LinearGradient
                colors={['transparent', C.lime, 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          )}
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.ctrlBtn}
          onPress={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
        >
          <MaterialCommunityIcons
            name={flash === 'on' ? 'flash' : 'flash-off'}
            size={24}
            color={flash === 'on' ? C.lime : C.muted}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shutterOuter}
          onPress={mode === 'foto' ? () => void takePhoto() : undefined}
          disabled={mode === 'codigo' || capturing}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[C.lime, colors.primary.dark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shutterGradient}
          >
            {capturing ? (
              <ActivityIndicator color={colors.primary.text} />
            ) : mode === 'foto' ? (
              <View style={styles.shutterCore} />
            ) : (
              <MaterialCommunityIcons name="line-scan" size={28} color={C.muted} />
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ctrlBtn} onPress={() => void pickGallery()}>
          <MaterialCommunityIcons name="image-multiple-outline" size={24} color={C.cyan} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {mode === 'foto'
          ? 'Tip: buena luz lateral = mejor detección de porción después.'
          : 'El código se lee automáticamente al enfocarlo.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  headerBlock: { marginBottom: 10 },
  kicker: {
    color: C.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    opacity: 0.9,
    marginBottom: 4,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: {
    flex: 1,
    color: C.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  modeChipOn: {
    borderColor: C.border,
    backgroundColor: C.limeMuted,
  },
  modeLabel: {
    color: C.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  modeLabelOn: {
    color: C.lime,
  },
  frameOuter: {
    flex: 1,
    minHeight: 200,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  frameInner: {
    flex: 1,
    margin: 1,
    borderRadius: 21,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
    shadowColor: C.lime,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingHorizontal: 4,
  },
  ctrlBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    padding: 3,
    backgroundColor: 'rgba(209,255,38,0.2)',
  },
  shutterGradient: {
    flex: 1,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderWidth: 3,
    borderColor: colors.primary.default,
  },
  hint: {
    textAlign: 'center',
    color: C.muted,
    fontSize: 11,
    marginTop: 10,
    lineHeight: 15,
    paddingHorizontal: 8,
  },
  permBox: { flex: 1, justifyContent: 'center', padding: 24 },
  permText: { color: colors.text.secondary, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  permBtn: {
    alignSelf: 'center',
    backgroundColor: C.lime,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  permBtnText: { fontWeight: '800', color: colors.primary.text },
  webFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
  webText: { color: colors.text.secondary, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
