import React, { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  type LayoutChangeEvent,
} from 'react-native';
import {
  Swipeable,
  GestureHandlerRootView,
  TouchableOpacity as GHTouchableOpacity,
} from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
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
import { searchFoods, createFood, deleteFood, type FoodRow } from '../../services/foodService';
import { getMealTypeLabel, type MealType, type MealLog } from '../../services/mealService';
import { FoodDetailSheet, type FoodDetailPayload } from '../../components/nutrition/FoodDetailSheet';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';
import {
  SlidingTabHighlight,
  TabItemMotion,
  type TabSlotLayout,
} from '../../components/navigation/SlidingTabHighlight';
import { navigationChrome } from '../../theme/navigationChrome';

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

function CatalogFoodSwipeLeftAction({ onDelete }: { onDelete: () => void }) {
  return (
    <GHTouchableOpacity
      style={styles.swipeDeleteRoot}
      activeOpacity={0.92}
      onPress={onDelete}
    >
      <LinearGradient
        colors={['#3a1512', colors.tertiary.dark, colors.tertiary.default]}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.swipeDeleteGradient}
      >
        <MaterialCommunityIcons name="delete-outline" size={24} color="rgba(255,255,255,0.95)" />
        <Text style={styles.swipeDeleteText}>Eliminar</Text>
      </LinearGradient>
    </GHTouchableOpacity>
  );
}

function AlimentacionBuscarPanel({
  pendingMealType,
  initialSearchQuery,
  onOpenFoodDetail,
  onScanForCatalog,
}: {
  pendingMealType: MealType | null;
  initialSearchQuery: string;
  onOpenFoodDetail: (food: FoodRow) => void;
  /** Escanear solo para agregar a la lista (sin registro del día) */
  onScanForCatalog: () => void;
}) {
  const [q, setQ] = useState('');
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });

  useEffect(() => {
    if (initialSearchQuery) {
      setQ(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      void searchFoods(q).then((rows) => {
        setFoods(rows);
        setLoading(false);
      });
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  const resetForm = () => setForm({ name: '', kcal: '', protein: '', carbs: '', fat: '' });

  const handleDeleteFood = useCallback(async (item: FoodRow) => {
    const ok = await deleteFood(item.id);
    if (ok) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFoods((prev) => prev.filter((f) => f.id !== item.id));
    } else {
      Alert.alert('Error', 'No se pudo eliminar. Reintentá.');
    }
  }, []);

  const handleSaveManual = async () => {
    if (!form.name.trim()) {
      Alert.alert('Falta el nombre', 'Ingresá un nombre para el alimento.');
      return;
    }
    setSaving(true);
    try {
      const food = await createFood({
        name: form.name.trim(),
        kcal_100g: form.kcal ? parseFloat(form.kcal) : null,
        protein_g_100g: form.protein ? parseFloat(form.protein) : null,
        carbs_g_100g: form.carbs ? parseFloat(form.carbs) : null,
        fat_g_100g: form.fat ? parseFloat(form.fat) : null,
        source: 'manual',
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
        <View style={styles.buscarRoot}>
          <Text style={styles.buscarTitle}>Buscar en tu lista</Text>
          <Text style={styles.buscarHint}>
            Filtrá tu lista personal. Tocá un alimento para ver el detalle y agregarlo al día. Escanear o manual
            agregan a la lista sin registrar el día.
          </Text>
          {pendingMealType ? (
            <Text style={styles.buscarPendingHint}>Momento: {getMealTypeLabel(pendingMealType)}</Text>
          ) : (
            <Text style={styles.buscarPendingHintMuted}>Sin momento fijo · se usa desayuno</Text>
          )}
          <Text style={styles.catSwipeHint}>Deslizá hacia la derecha y tocá Eliminar para quitar de tu lista.</Text>

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
              <View style={styles.catFormRow}>
                <TextInput
                  style={[styles.catFormInput, styles.catFormInputHalf]}
                  placeholder="kcal/100g"
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
                style={styles.catSaveBtn}
                onPress={() => void handleSaveManual()}
                disabled={saving}
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
                <Swipeable
                  friction={2}
                  overshootLeft={false}
                  enableTrackpadTwoFingerGesture
                  renderLeftActions={() => (
                    <CatalogFoodSwipeLeftAction onDelete={() => void handleDeleteFood(item)} />
                  )}
                >
                  <TouchableOpacity
                    style={styles.catalogRowCard}
                    onPress={() => onOpenFoodDetail(item)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.buscarRowName}>{item.name}</Text>
                    <Text style={styles.buscarRowMeta}>
                      {item.kcal_100g != null ? `${item.kcal_100g} kcal/100g` : '—'}
                      {item.brand ? ` · ${item.brand}` : ''}
                    </Text>
                  </TouchableOpacity>
                </Swipeable>
              )}
              ListEmptyComponent={
                <Text style={styles.buscarEmpty}>
                  Sin coincidencias. Agregá con Manual o Escanear, o probá otro filtro.
                </Text>
              }
            />
          )}
        </View>
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
  const [submenuBarWidth, setSubmenuBarWidth] = useState(0);
  const [submenuSlotLayouts, setSubmenuSlotLayouts] = useState<Array<TabSlotLayout | null>>(() =>
    Array(SUB_ITEMS.length).fill(null),
  );

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

  /** Hueco mínimo entre submenú y tab bar (el tab bar ya incluye área segura) */
  const SUBNAV_GAP_ABOVE_TABBAR = 2;
  /** Altura aproximada del submenú (contenedor pastilla + márgenes) */
  const submenuDockHeight = 86;
  const bottomPad =
    tabBarHeight +
    SUBNAV_GAP_ABOVE_TABBAR +
    submenuDockHeight +
    Math.max(insets.bottom, 8) +
    4;

  useEffect(() => {
    if (subTab === 'lista') {
      setPendingMealType(null);
      setScannerCatalogOnly(false);
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

  const onFoodDetailAdded = useCallback(() => {
    setPendingMealType(null);
    closeFoodDetail();
    handleMealSaved();
  }, [closeFoodDetail, handleMealSaved]);

  const handleRequestAddForSlot = useCallback((mt: MealType) => {
    Alert.alert(
      getMealTypeLabel(mt),
      '¿Cómo querés agregar el alimento?',
      [
        {
          text: 'Buscar',
          onPress: () => { setPendingMealType(mt); setBuscarInitialQuery(''); setSubTab('buscar'); },
        },
        {
          text: 'Escanear',
          onPress: () => { setPendingMealType(mt); setScannerCatalogOnly(false); setSubTab('escaner'); },
        },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
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
          />
        );
      case 'lista':
        return (
          <View style={styles.listaWrap}>
            <View style={styles.planSectionHeader}>
              <Text style={styles.buscarTitle}>Plan</Text>
              <Text style={styles.planSectionSub}>
                Tu día: comidas por momento, macros y registro rápido.
              </Text>
            </View>
            <ComidasScreen
              embedded
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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={[styles.content, { paddingBottom: bottomPad }]}>{renderMain()}</View>

      <FoodDetailSheet
        visible={detailVisible}
        payload={detailPayload}
        onClose={closeFoodDetail}
        onAdded={onFoodDetailAdded}
      />

      <View
        style={[
          styles.submenuDockOuter,
          {
            bottom: tabBarHeight + SUBNAV_GAP_ABOVE_TABBAR,
            paddingBottom: 4,
          },
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
              pillInset={2}
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
                        color={active ? navigationChrome.activeIcon : navigationChrome.inactiveIcon}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  content: {
    flex: 1,
  },
  listaWrap: {
    flex: 1,
  },
  planSectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    marginBottom: 4,
  },
  planSectionSub: {
    fontSize: 12,
    color: C.muted,
    lineHeight: 17,
    marginTop: 2,
  },
  /** Área sobre el tab bar: márgenes laterales para la pastilla (fondo = pantalla) */
  submenuDockOuter: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: navigationChrome.screenEdgeInset,
    paddingTop: 4,
  },
  /** Contenedor tipo cápsula (referencia diseño limpio) */
  submenuPill: {
    ...navigationChrome.pillContainer,
    overflow: 'hidden',
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
    color: navigationChrome.activeIcon,
    fontWeight: '800',
  },
  buscarRoot: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  buscarTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  buscarHint: {
    fontSize: 12,
    color: C.muted,
    marginBottom: 8,
    lineHeight: 17,
  },
  buscarPendingHint: {
    fontSize: 12,
    fontWeight: '700',
    color: C.cyan,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  buscarPendingHintMuted: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 10,
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
  catSaveBtn: {
    backgroundColor: C.lime, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginTop: 4,
  },
  catSaveBtnText: { color: colors.primary.text, fontWeight: '900', fontSize: 14 },

  catSwipeHint: {
    fontSize: 11,
    fontWeight: '600',
    color: C.muted,
    marginBottom: 10,
    lineHeight: 15,
    opacity: 0.9,
  },
  catalogRowCard: {
    backgroundColor: colors.surface.elevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  swipeDeleteRoot: {
    width: 112,
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  swipeDeleteGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 56,
    gap: 2,
  },
  swipeDeleteText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
});
