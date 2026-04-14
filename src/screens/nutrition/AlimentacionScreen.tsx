import React, { useState, useEffect, useCallback, Suspense, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Animated,
  Image,
  type LayoutChangeEvent,
} from 'react-native';
import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import {
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NutritionStackParamList } from '../../navigation/types';
import { AlimentacionEscanerPanel } from './AlimentacionEscanerPanel';
import ComidasScreen from './ComidasScreen';
import {
  searchFoods,
  createFood,
  resolveImageUrl,
  sharedImageUrl,
  type FoodRow,
} from '../../services/foodService';
import { getMealTypeLabel, type MealType, type MealLog } from '../../services/mealService';
import { FoodDetailSheet, type FoodDetailPayload } from '../../components/nutrition/FoodDetailSheet';
import { FoodImageCatalogPicker } from '../../components/nutrition/FoodImageCatalogPicker';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import {
  SlidingTabHighlight,
  TabItemMotion,
  type TabSlotLayout,
} from '../../components/navigation/SlidingTabHighlight';
import { navigationChrome } from '../../theme/navigationChrome';
import { AppProgressiveHeader, HEADER_ROW_HEIGHT } from '../../components/AppProgressiveHeader';
import {
  SUBNAV_GAP_ABOVE_TABBAR,
  SUBMENU_DOCK_HEIGHT,
} from './alimentacionSnackLayout';

const RegistrarComidaVoiceButton = React.lazy(
  () => import('./RegistrarComidaVoiceButton'),
);

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

type SubTab = 'lista' | 'buscar' | 'escaner' | 'voz';

type Nav = NativeStackNavigationProp<NutritionStackParamList, 'Alimentacion'>;

const C = {
  bg: colors.background,
  surface: colors.surface.base,
  text: colors.text.primary,
  muted: colors.text.tertiary,
  secondary: colors.text.secondary,
  lime: colors.primary.default,
  cyan: colors.secondary.default,
  border: colors.border.subtle,
};

const SUB_ITEMS: { key: SubTab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { key: 'lista', label: 'Plan', icon: 'clipboard-text-outline' },
  { key: 'buscar', label: 'Buscar', icon: 'magnify' },
  { key: 'escaner', label: 'Escáner', icon: 'camera' },
  { key: 'voz', label: 'Voz', icon: 'microphone' },
];

function AlimentacionBuscarPanel({
  pendingMealType,
  initialSearchQuery,
  onOpenFoodDetail,
  onScanForCatalog,
  catalogRefreshKey,
}: {
  pendingMealType: MealType | null;
  initialSearchQuery: string;
  onOpenFoodDetail: (food: FoodRow) => void;
  /** Escanear solo para agregar a la lista (sin registro del día) */
  onScanForCatalog: () => void;
  /** Incrementar al actualizar favoritos desde el detalle */
  catalogRefreshKey: number;
}) {
  const parseNumericInput = (value: string): number | null => {
    const normalized = value.trim().replace(',', '.');
    if (!normalized) return null;
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const toPer100 = (value: number | null, baseGrams: number): number | null => {
    if (value == null) return null;
    return (value * 100) / baseGrams;
  };
  const formatKcalMeta = (food: FoodRow): string => {
    const kcal100 = food.kcal_100g;
    if (kcal100 == null) return '—';
    const serving = food.default_serving_grams;
    if (serving != null && serving > 0 && Math.abs(serving - 100) > 0.001) {
      const kcalServing = Math.round((kcal100 * serving) / 100);
      const servingLabel = Number.isInteger(serving) ? `${serving}` : serving.toFixed(1);
      const kcal100Label = Number.isInteger(kcal100) ? `${kcal100}` : kcal100.toFixed(1);
      return `${kcalServing} kcal/${servingLabel}g · ${kcal100Label} kcal/100g`;
    }
    return `${kcal100} kcal/100g`;
  };

  const [q, setQ] = useState('');
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    referenceGrams: '100',
    kcal: '',
    protein: '',
    carbs: '',
    fat: '',
  });
  const [manualImageKey, setManualImageKey] = useState<string | null>(null);
  const [manualImagePickerOpen, setManualImagePickerOpen] = useState(false);

  useEffect(() => {
    if (initialSearchQuery) {
      setQ(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      void searchFoods(q, 40, { favoritesOnly }).then((rows) => {
        setFoods(rows);
        setLoading(false);
      });
    }, 280);
    return () => clearTimeout(t);
  }, [q, favoritesOnly, catalogRefreshKey]);

  const resetForm = () => {
    setForm({ name: '', referenceGrams: '100', kcal: '', protein: '', carbs: '', fat: '' });
    setManualImageKey(null);
  };

  const handleSaveManual = async () => {
    if (!form.name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresá un nombre para el alimento.');
      return;
    }
    if (!manualImageKey) {
      Alert.alert('Falta la imagen', 'Seleccioná una imagen del catálogo para crear el alimento.');
      return;
    }
    const referenceGrams = parseNumericInput(form.referenceGrams);
    if (referenceGrams == null || referenceGrams <= 0) {
      Alert.alert('Gramaje inválido', 'Ingresá una cantidad de gramos mayor a 0.');
      return;
    }

    const kcalRef = parseNumericInput(form.kcal);
    const proteinRef = parseNumericInput(form.protein);
    const carbsRef = parseNumericInput(form.carbs);
    const fatRef = parseNumericInput(form.fat);

    setSaving(true);
    try {
      const food = await createFood({
        name: form.name.trim(),
        kcal_100g: toPer100(kcalRef, referenceGrams),
        protein_g_100g: toPer100(proteinRef, referenceGrams),
        carbs_g_100g: toPer100(carbsRef, referenceGrams),
        fat_g_100g: toPer100(fatRef, referenceGrams),
        default_serving_grams: referenceGrams,
        source: 'manual',
        image_key: manualImageKey,
      });
      if (food) {
        setFoods((prev) => [food, ...prev]);
        resetForm();
        setShowForm(false);
        Alert.alert('Guardado', `"${food.name}" fue agregado a tu lista.`);
      } else {
        Alert.alert('Error', 'No se pudo guardar. Reintentá.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.buscarRoot}>
            <View style={styles.buscarFilterTabs}>
            <TouchableOpacity
              style={[styles.buscarFilterTabBtn, !favoritesOnly && styles.buscarFilterTabBtnActive]}
              onPress={() => {
                if (favoritesOnly) {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFavoritesOnly(false);
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Ver base de datos"
              accessibilityState={{ selected: !favoritesOnly }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name="database-outline"
                size={15}
                color={!favoritesOnly ? C.text : C.muted}
              />
              <Text style={[styles.buscarFilterTabText, !favoritesOnly && styles.buscarFilterTabTextActive]}>
                Base de datos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buscarFilterTabBtn, favoritesOnly && styles.buscarFilterTabBtnActive]}
              onPress={() => {
                if (!favoritesOnly) {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFavoritesOnly(true);
                }
              }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Ver favoritos"
              accessibilityState={{ selected: favoritesOnly }}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={favoritesOnly ? 'heart' : 'heart-outline'}
                size={15}
                color={favoritesOnly ? '#c62828' : C.muted}
              />
              <Text style={[styles.buscarFilterTabText, favoritesOnly && styles.buscarFilterTabTextActive]}>
                Favoritos
              </Text>
            </TouchableOpacity>
          </View>

            <View style={styles.catActions}>
            <TouchableOpacity style={styles.catActionBtn} onPress={onScanForCatalog} activeOpacity={0.85}>
              <MaterialCommunityIcons name="barcode-scan" size={18} color={C.lime} />
              <Text style={styles.catActionLabel}>Escanear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.catActionBtn, showForm && styles.catActionBtnActive]}
              onPress={() => setShowForm((v) => !v)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={18} color={showForm ? C.lime : C.muted} />
              <Text style={[styles.catActionLabel, showForm && { color: C.lime }]}>Manual</Text>
            </TouchableOpacity>
          </View>

            {showForm ? (
              <View style={styles.catForm}>
              <TextInput
                style={styles.catFormInput}
                placeholder="Nombre *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={form.name}
                onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <TextInput
                style={styles.catFormInput}
                placeholder="Estos macros corresponden a cuántos gramos? *"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="decimal-pad"
                value={form.referenceGrams}
                onChangeText={(v) => setForm((f) => ({ ...f, referenceGrams: v }))}
              />
              <View style={styles.catFormRow}>
                <TextInput
                  style={[styles.catFormInput, styles.catFormInputHalf]}
                  placeholder="kcal (por porción)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="decimal-pad"
                  value={form.kcal}
                  onChangeText={(v) => setForm((f) => ({ ...f, kcal: v }))}
                />
                <TextInput
                  style={[styles.catFormInput, styles.catFormInputHalf]}
                  placeholder="Proteína g"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="decimal-pad"
                  value={form.protein}
                  onChangeText={(v) => setForm((f) => ({ ...f, protein: v }))}
                />
              </View>
              <View style={styles.catFormRow}>
                <TextInput
                  style={[styles.catFormInput, styles.catFormInputHalf]}
                  placeholder="Carbs g"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="decimal-pad"
                  value={form.carbs}
                  onChangeText={(v) => setForm((f) => ({ ...f, carbs: v }))}
                />
                <TextInput
                  style={[styles.catFormInput, styles.catFormInputHalf]}
                  placeholder="Grasas g"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="decimal-pad"
                  value={form.fat}
                  onChangeText={(v) => setForm((f) => ({ ...f, fat: v }))}
                />
              </View>
              <TouchableOpacity
                style={styles.catImagePickerBtn}
                onPress={() => setManualImagePickerOpen(true)}
                activeOpacity={0.85}
              >
                {manualImageKey ? (
                  <>
                    <Image source={{ uri: sharedImageUrl(manualImageKey) }} style={styles.catImagePreview} />
                    <Text style={styles.catImagePickerLabel}>Cambiar imagen</Text>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="image-plus" size={18} color={C.lime} />
                    <Text style={styles.catImagePickerLabel}>Seleccionar imagen del catálogo *</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.catSaveBtn}
                onPress={() => void handleSaveManual()}
                disabled={saving || !manualImageKey}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={C.bg} />
                ) : (
                  <Text style={styles.catSaveBtnText}>Guardar en la lista</Text>
                )}
              </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={[styles.buscarInput, { marginBottom: 8 }]}
              placeholder="Filtrar tu lista…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={q}
              onChangeText={setQ}
            />
            {loading ? (
              <ActivityIndicator color={C.lime} style={{ marginTop: 16 }} />
            ) : (
              <FlatList
                data={foods}
                keyExtractor={(item) => item.id}
                style={{ marginTop: 4, flex: 1 }}
                contentContainerStyle={{ paddingBottom: 32 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.catalogRowCard}
                    onPress={() => onOpenFoodDetail(item)}
                    activeOpacity={0.85}
                  >
                    {/* Thumbnail — imagen personalizada, del catálogo o placeholder */}
                    {resolveImageUrl(item) ? (
                      <Image source={{ uri: resolveImageUrl(item)! }} style={styles.catalogRowThumb} />
                    ) : (
                      <View style={styles.catalogRowThumbPlaceholder}>
                        <MaterialCommunityIcons name="food-apple-outline" size={16} color={C.muted} />
                      </View>
                    )}
                    <View style={styles.catalogRowTextCol}>
                      <Text style={styles.buscarRowName}>{item.name}</Text>
                      <Text style={styles.buscarRowMeta}>
                        {formatKcalMeta(item)}
                        {item.brand ? ` · ${item.brand}` : ''}
                      </Text>
                    </View>
                    {item.is_favorite ? (
                      <MaterialCommunityIcons name="heart" size={18} color="#c62828" style={styles.catalogRowHeartEnd} />
                    ) : (
                      <View style={styles.catalogRowHeartEndSpacer} />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.buscarEmpty}>
                    Sin coincidencias. Agregá con Manual o Escanear, o probá otro filtro.
                  </Text>
                }
              />
            )}
          </View>
        </TouchableWithoutFeedback>
        <FoodImageCatalogPicker
          visible={manualImagePickerOpen}
          onClose={() => setManualImagePickerOpen(false)}
          onSelect={(key) => setManualImageKey(key || null)}
          currentKey={manualImageKey}
        />
      </GestureHandlerRootView>
    </KeyboardAvoidingView>
  );
}

function AlimentacionVozPanel({ onContinueToBuscar }: { onContinueToBuscar: (query: string) => void }) {
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [listening, setListening] = useState(false);

  const onTranscript = useCallback((t: string) => {
    setVoiceTranscript(t);
  }, []);

  return (
    <View style={styles.vozPanel}>
      <Text style={styles.vozTitle}>Registro por voz</Text>
      <Text style={styles.vozSub}>
        Dictá el nombre del alimento y tocá continuar: te llevamos a Buscar con el texto listo para elegir y
        agregar al día.
      </Text>
      {isExpoGo ? (
        <TouchableOpacity
          style={styles.vozDisabled}
          onPress={() =>
            Alert.alert(
              'Requiere development build',
              'Expo Go no incluye reconocimiento de voz nativo. Usá npx expo run:android o run:ios, o compilá con EAS.',
              [
                {
                  text: 'Guía',
                  onPress: () =>
                    void Linking.openURL(
                      'https://docs.expo.dev/develop/development-builds/introduction/',
                    ),
                },
                { text: 'OK' },
              ],
            )
          }
        >
          <MaterialCommunityIcons name="microphone-off" size={22} color={C.muted} />
          <Text style={styles.vozDisabledText}>Voz no disponible en Expo Go</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.vozBtnWrap}>
          <Suspense fallback={<ActivityIndicator color={C.lime} />}>
            <RegistrarComidaVoiceButton onTranscript={onTranscript} onListeningChange={setListening} />
          </Suspense>
        </View>
      )}
      {listening ? <Text style={styles.vozListening}>Escuchando…</Text> : null}
      {voiceTranscript ? <Text style={styles.vozQuote}>“{voiceTranscript}”</Text> : null}
      {voiceTranscript.trim() ? (
        <TouchableOpacity
          style={styles.vozContinue}
          onPress={() => onContinueToBuscar(voiceTranscript.trim())}
        >
          <Text style={styles.vozContinueText}>Buscar y agregar</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary.text} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function AlimentacionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<NutritionStackParamList, 'Alimentacion'>>();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const activeDate = useUIStore((s) => s.activeDate);
  const [subTab, setSubTab] = useState<SubTab>('lista');
  /** Momento del día cuando se llega desde Plan (+); se pasa al elegir alimento en Buscar */
  const [pendingMealType, setPendingMealType] = useState<MealType | null>(null);
  const [buscarInitialQuery, setBuscarInitialQuery] = useState('');
  /** Escáner en modo catálogo: solo guarda en la base de alimentos, sin crear registro diario */
  const [scannerCatalogOnly, setScannerCatalogOnly] = useState(false);
  const [detailPayload, setDetailPayload] = useState<FoodDetailPayload | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  /** Toast tras agregar alimento (Plan vs resto); lo muestra ComidasScreen embebido */
  const [mealAddedToast, setMealAddedToast] = useState<string | null>(null);
  /** Al cambiar favoritos en el detalle, el panel Buscar vuelve a consultar la lista */
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
  const bumpCatalogRefresh = useCallback(() => setCatalogRefreshKey((k) => k + 1), []);
  const [submenuBarWidth, setSubmenuBarWidth] = useState(0);
  const [submenuSlotLayouts, setSubmenuSlotLayouts] = useState<Array<TabSlotLayout | null>>(() =>
    Array(SUB_ITEMS.length).fill(null),
  );
  /** scrollY siempre alto para que el glass del header esté visible desde el inicio */
  const scrollY = useRef(new Animated.Value(0)).current;

  const onSubmenuSlotLayout = useCallback((index: number, e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    setSubmenuSlotLayouts((prev) => {
      const next = [...prev];
      next[index] = { x, y, width, height };
      return next;
    });
  }, []);

  const activeSubIndex = useMemo(() => {
    const i = SUB_ITEMS.findIndex((x) => x.key === subTab);
    return i >= 0 ? i : 0;
  }, [subTab]);

  const bottomPad = tabBarHeight + SUBNAV_GAP_ABOVE_TABBAR + SUBMENU_DOCK_HEIGHT + 4;

  useEffect(() => {
    if (subTab === 'lista') {
      setPendingMealType(null);
      setScannerCatalogOnly(false);
    } else {
      setMealAddedToast(null);
    }
  }, [subTab]);

  useEffect(() => {
    const p = route.params;
    if (!p?.initialSubTab && p?.buscarQuery == null) return;
    if (p.initialSubTab) {
      setSubTab(p.initialSubTab as SubTab);
    }
    if (p.buscarQuery != null && p.buscarQuery !== '') {
      setBuscarInitialQuery(p.buscarQuery);
    }
    navigation.setParams({ initialSubTab: undefined, buscarQuery: undefined });
  }, [route.params?.initialSubTab, route.params?.buscarQuery, navigation]);

  const handleMealSaved = useCallback(() => {
    if (scannerCatalogOnly) {
      setScannerCatalogOnly(false);
      setSubTab('buscar');
    } else {
      setSubTab('lista');
    }
  }, [scannerCatalogOnly]);

  const closeFoodDetail = useCallback(() => {
    setDetailVisible(false);
    setDetailPayload(null);
  }, []);

  const clearMealAddedToast = useCallback(() => {
    setMealAddedToast(null);
  }, []);

  const onFoodDetailAdded = useCallback(() => {
    const mt = pendingMealType;
    const message =
      mt != null
        ? `Alimento agregado a ${getMealTypeLabel(mt)}`
        : 'Alimento ingresado';
    setMealAddedToast(message);
    setPendingMealType(null);
    bumpCatalogRefresh();
    closeFoodDetail();
    handleMealSaved();
  }, [pendingMealType, bumpCatalogRefresh, closeFoodDetail, handleMealSaved]);

  const handleRequestAddForSlot = useCallback((mt: MealType) => {
    setPendingMealType(mt);
    setBuscarInitialQuery('');
    setSubTab('buscar');
  }, []);

  const renderMain = () => {
    switch (subTab) {
      case 'escaner':
        return (
          <AlimentacionEscanerPanel
            pendingMealType={pendingMealType}
            activeDate={activeDate}
            onMealSaved={handleMealSaved}
            catalogOnly={scannerCatalogOnly}
            onFoodForDetail={(food) => {
              setDetailPayload({
                kind: 'food',
                food,
                mealType: pendingMealType ?? 'DES',
                dateISO: activeDate,
              });
              setDetailVisible(true);
            }}
            onDraftFood={(offProduct, barcode) => {
              setDetailPayload({
                kind: 'draft_food',
                draft: {
                  name: offProduct.name,
                  brand: offProduct.brand,
                  barcode,
                  kcal_100g: offProduct.kcal_100g,
                  protein_g_100g: offProduct.protein_g_100g,
                  carbs_g_100g: offProduct.carbs_g_100g,
                  fat_g_100g: offProduct.fat_g_100g,
                  openfoodfacts_code: offProduct.code,
                },
                mealType: pendingMealType ?? 'DES',
                dateISO: activeDate,
                catalogOnly: scannerCatalogOnly,
              });
              setDetailVisible(true);
            }}
          />
        );
      case 'lista':
        return (
          <View style={styles.listaWrap}>
            <ComidasScreen
              embedded
              mealAddedFeedback={mealAddedToast}
              onMealAddedFeedbackClear={clearMealAddedToast}
              onRequestAddForSlot={handleRequestAddForSlot}
              onEmbeddedMealPress={(log) => {
                setDetailPayload({ kind: 'meal_log', log });
                setDetailVisible(true);
              }}
            />
          </View>
        );
      case 'buscar':
        return (
          <AlimentacionBuscarPanel
            pendingMealType={pendingMealType}
            initialSearchQuery={buscarInitialQuery}
            catalogRefreshKey={catalogRefreshKey}
            onScanForCatalog={() => {
              setScannerCatalogOnly(true);
              setSubTab('escaner');
            }}
            onOpenFoodDetail={(food) => {
              setDetailPayload({
                kind: 'food',
                food,
                mealType: pendingMealType ?? 'DES',
                dateISO: activeDate,
              });
              setDetailVisible(true);
            }}
          />
        );
      case 'voz':
        return (
          <AlimentacionVozPanel
            onContinueToBuscar={(query) => {
              setBuscarInitialQuery(query);
              setSubTab('buscar');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingBottom: bottomPad, paddingTop: insets.top + HEADER_ROW_HEIGHT }]}>{renderMain()}</View>

      <FoodDetailSheet
        visible={detailVisible}
        payload={detailPayload}
        onClose={closeFoodDetail}
        onAdded={onFoodDetailAdded}
        onFoodFavoriteChange={(updated) => {
          bumpCatalogRefresh();
          setDetailPayload((p) =>
            p?.kind === 'food' && p.food.id === updated.id ? { ...p, food: updated } : p,
          );
        }}
      />

      <View
        style={[
          styles.submenuDockOuter,
          { bottom: tabBarHeight + SUBNAV_GAP_ABOVE_TABBAR },
        ]}
      >
        <View style={styles.submenuPill}>
          <View
            style={styles.submenuRow}
            onLayout={(e) => setSubmenuBarWidth(e.nativeEvent.layout.width)}
          >
            <SlidingTabHighlight
              tabCount={SUB_ITEMS.length}
              activeIndex={activeSubIndex}
              containerWidth={submenuBarWidth}
              slotLayouts={submenuSlotLayouts}
              pillInset={-4}
            />
            {SUB_ITEMS.map((item, index) => {
              const active = subTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={styles.submenuItem}
                  onPress={() => setSubTab(item.key)}
                  activeOpacity={0.9}
                  onLayout={(e) => onSubmenuSlotLayout(index, e)}
                >
                  <TabItemMotion isFocused={active} style={styles.submenuMotionInner} variant="subtle">
                    <View style={styles.submenuIconSlot}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={22}
                        color={active ? '#FFFFFF' : navigationChrome.inactiveIcon}
                      />
                    </View>
                    <Text
                      style={[styles.submenuLabel, active && styles.submenuLabelActive]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TabItemMotion>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <AppProgressiveHeader
        scrollY={scrollY}
        topInset={insets.top}
        onHomePress={() => navigation.getParent()?.navigate('HomeStack')}
        onAvatarPress={() => navigation.getParent()?.navigate('HomeStack', { screen: 'Perfil' })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
    overflow: 'visible',
  },
  content: {
    flex: 1,
  },
  listaWrap: {
    flex: 1,
  },
  /** Área sobre el tab bar: márgenes laterales para la pastilla (fondo = pantalla) */
  submenuDockOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: navigationChrome.screenEdgeInset,
    paddingTop: 4,
    zIndex: 12,
    elevation: 12,
  },
  /** Contenedor rectangular-redondeado */
  submenuPill: {
    ...navigationChrome.pillContainer,
  },
  /** Fila + highlight comparten coordenadas */
  submenuRow: {
    position: 'relative',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: navigationChrome.containerPaddingH,
    paddingVertical: navigationChrome.containerPaddingV,
    zIndex: 1,
  },
  submenuItem: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
    minWidth: 0,
    paddingVertical: 0,
  },
  submenuMotionInner: {
    alignItems: 'center',
    gap: 2,
    width: '100%',
  },
  /** Sin caja extra: el único “seleccionado” es la pastilla animada (mismo criterio que el tab bar) */
  submenuIconSlot: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submenuLabel: {
    fontSize: 9.5,
    lineHeight: 12,
    color: navigationChrome.inactiveIcon,
    fontWeight: '600',
    textAlign: 'center',
  },
  submenuLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  buscarRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  buscarFilterTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 10,
  },
  buscarFilterTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
    paddingBottom: 8,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  buscarFilterTabBtnActive: {
    borderBottomColor: C.text,
  },
  buscarFilterTabText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '600',
  },
  buscarFilterTabTextActive: {
    color: C.text,
    fontWeight: '700',
  },
  buscarInput: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 15,
  },
  buscarRowName: { color: C.text, fontSize: 15, fontWeight: '700' },
  buscarRowMeta: { color: C.muted, fontSize: 12, marginTop: 2 },
  buscarEmpty: { color: C.muted, marginTop: 20, fontSize: 13 },
  placeholderPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  placeholderTitle: { color: C.text, fontSize: 20, fontWeight: '800' },
  placeholderSub: { color: C.secondary, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  vozPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    justifyContent: 'center',
  },
  vozTitle: { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 8 },
  vozSub: { color: C.secondary, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  vozDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    borderRadius: 12,
  },
  vozDisabledText: { color: C.muted, flex: 1, fontSize: 13 },
  vozListening: { color: C.cyan, marginTop: 12, textAlign: 'center' },
  vozQuote: { color: C.secondary, marginTop: 8, fontStyle: 'italic', textAlign: 'center' },
  vozBtnWrap: { width: '100%', marginTop: 8, flexDirection: 'row' },
  vozContinue: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.lime,
    paddingVertical: 14,
    borderRadius: 14,
  },
  vozContinueText: { color: colors.primary.text, fontWeight: '900', letterSpacing: 0.5 },

  catActions: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  catActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12,
    backgroundColor: colors.surface.elevated, borderWidth: 1, borderColor: C.border,
  },
  catActionBtnActive: { borderColor: 'rgba(209,255,38,0.4)', backgroundColor: colors.primary.muted },
  catActionLabel: { fontSize: 13, fontWeight: '700', color: C.muted },
  catForm: {
    backgroundColor: colors.surface.elevated, borderRadius: 14,
    padding: 12, marginBottom: 12, gap: 8,
    borderWidth: 1, borderColor: C.border,
  },
  catFormInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 10,
    color: C.text, fontSize: 14,
  },
  catFormRow: { flexDirection: 'row', gap: 8 },
  catFormInputHalf: { flex: 1 },
  catImagePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  catImagePreview: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.surface.base,
  },
  catImagePickerLabel: {
    color: C.text,
    fontSize: 13,
    fontWeight: '700',
  },
  catSaveBtn: {
    backgroundColor: C.lime, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  catSaveBtnText: { color: colors.primary.text, fontWeight: '900', fontSize: 14 },

  catalogRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    gap: 10,
  },
  catalogRowThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface.base,
    flexShrink: 0,
  },
  catalogRowThumbPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.surface.base,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  catalogRowHeartEnd: { flexShrink: 0 },
  catalogRowHeartEndSpacer: { width: 18, flexShrink: 0 },
  catalogRowTextCol: { flex: 1, minWidth: 0 },
});
