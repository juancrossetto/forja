import React, { useState, useEffect, useCallback, Suspense } from 'react';
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
} from 'react-native';
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
import { searchFoods, type FoodRow } from '../../services/foodService';
import { getMealTypeLabel, quickAddMealFromFood, type MealType } from '../../services/mealService';
import { useUIStore } from '../../store/uiStore';
import { colors } from '../../theme/colors';

const RegistrarComidaVoiceButton = React.lazy(
  () => import('./RegistrarComidaVoiceButton'),
);

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Constants.appOwnership === 'expo';

type SubTab = 'recetas' | 'lista' | 'buscar' | 'escaner' | 'voz';

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
  { key: 'lista', label: 'Lista', icon: 'format-list-bulleted' },
  { key: 'buscar', label: 'Buscar', icon: 'magnify' },
  { key: 'escaner', label: 'Escáner', icon: 'camera' },
  { key: 'voz', label: 'Voz', icon: 'microphone' },
  { key: 'recetas', label: 'Recetas', icon: 'chef-hat' },
];

function AlimentacionBuscarPanel({
  activeDate,
  pendingMealType,
  onClearPendingMealType,
  initialSearchQuery,
  onMealSaved,
}: {
  activeDate: string;
  pendingMealType: MealType | null;
  onClearPendingMealType: () => void;
  initialSearchQuery: string;
  onMealSaved: () => void;
}) {
  const [q, setQ] = useState('');
  const [foods, setFoods] = useState<FoodRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

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

  const mealSlot = pendingMealType ?? 'DES';

  const onPickFood = async (item: FoodRow) => {
    if (savingId) return;
    setSavingId(item.id);
    try {
      const ok = await quickAddMealFromFood(item, mealSlot, activeDate);
      if (ok) {
        onClearPendingMealType();
        Alert.alert('Listo', `${item.name} agregado a ${getMealTypeLabel(mealSlot)}.`);
        onMealSaved();
      } else {
        Alert.alert('Error', 'No se pudo guardar. Reintentá.');
      }
    } finally {
      setSavingId(null);
    }
  };

  return (
    <View style={styles.buscarRoot}>
      <Text style={styles.buscarTitle}>Buscar en tu lista</Text>
      <Text style={styles.buscarHint}>
        Tocá un alimento para sumarlo al día (porción por defecto del producto o 100 g).
      </Text>
      {pendingMealType ? (
        <Text style={styles.buscarPendingHint}>
          Momento: {getMealTypeLabel(pendingMealType)}
        </Text>
      ) : (
        <Text style={styles.buscarPendingHintMuted}>Sin momento fijo · se usa desayuno</Text>
      )}
      <TextInput
        style={styles.buscarInput}
        placeholder="Nombre del alimento…"
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
          style={{ marginTop: 12, flex: 1 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.buscarRow}
              disabled={savingId != null}
              onPress={() => void onPickFood(item)}
            >
              <View style={{ flex: 1, opacity: savingId === item.id ? 0.5 : 1 }}>
                <Text style={styles.buscarRowName}>{item.name}</Text>
                <Text style={styles.buscarRowMeta}>
                  {item.kcal_100g != null ? `${item.kcal_100g} kcal/100g` : '—'}
                </Text>
              </View>
              {savingId === item.id ? (
                <ActivityIndicator color={C.lime} style={{ marginLeft: 8 }} />
              ) : null}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.buscarEmpty}>Escribí para buscar o escaneá un código en Escáner.</Text>
          }
        />
      )}
    </View>
  );
}

function AlimentacionRecetasPanel() {
  return (
    <View style={styles.placeholderPanel}>
      <MaterialCommunityIcons name="book-open-variant" size={40} color={C.lime} />
      <Text style={styles.placeholderTitle}>Recetas</Text>
      <Text style={styles.placeholderSub}>
        Pronto podrás guardar y repetir recetas. Por ahora registrá desde Escáner o Buscar.
      </Text>
    </View>
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
  /** Momento del día cuando se llega desde Lista (+); se pasa al elegir alimento en Buscar */
  const [pendingMealType, setPendingMealType] = useState<MealType | null>(null);
  const [buscarInitialQuery, setBuscarInitialQuery] = useState('');

  /** Separación visual respecto al tab bar principal */
  const SUBNAV_GAP_ABOVE_TABBAR = 6;
  /** Altura aproximada del dock compacto (para que el scroll no quede tapado) */
  const submenuDockHeight = 88;
  const bottomPad =
    tabBarHeight +
    SUBNAV_GAP_ABOVE_TABBAR +
    submenuDockHeight +
    Math.max(insets.bottom, 8) +
    4;

  useEffect(() => {
    if (subTab === 'lista') {
      setPendingMealType(null);
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
    setSubTab('lista');
  }, []);

  const renderMain = () => {
    switch (subTab) {
      case 'escaner':
        return (
          <AlimentacionEscanerPanel
            pendingMealType={pendingMealType}
            activeDate={activeDate}
            onMealSaved={handleMealSaved}
          />
        );
      case 'lista':
        return (
          <View style={styles.listaWrap}>
            <ComidasScreen
              embedded
              onRequestAddForSlot={(mt) => {
                setPendingMealType(mt);
                setBuscarInitialQuery('');
                setSubTab('buscar');
              }}
            />
          </View>
        );
      case 'buscar':
        return (
          <AlimentacionBuscarPanel
            activeDate={activeDate}
            pendingMealType={pendingMealType}
            onClearPendingMealType={() => setPendingMealType(null)}
            initialSearchQuery={buscarInitialQuery}
            onMealSaved={handleMealSaved}
          />
        );
      case 'recetas':
        return <AlimentacionRecetasPanel />;
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

      <View
        style={[
          styles.submenuDock,
          {
            bottom: tabBarHeight + SUBNAV_GAP_ABOVE_TABBAR,
            paddingBottom: Math.max(insets.bottom, 6),
          },
        ]}
      >
        <View style={styles.submenuRow}>
          {SUB_ITEMS.map((item) => {
            const active = subTab === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={styles.submenuItem}
                onPress={() => setSubTab(item.key)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.submenuIconWrap,
                    active && styles.submenuIconWrapActive,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={19}
                    color={active ? C.lime : C.muted}
                  />
                </View>
                <Text style={[styles.submenuLabel, active && styles.submenuLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
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
  submenuDock: {
    position: 'absolute',
    left: 10,
    right: 10,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingTop: 6,
    borderWidth: 1,
    borderColor: C.border,
    /** Borde inferior lima: separa el subnav del hueco hacia el tab bar principal */
    borderBottomColor: 'rgba(209, 255, 38, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  submenuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  submenuItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    minWidth: 0,
    paddingVertical: 0,
  },
  submenuIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  submenuIconWrapActive: {
    borderColor: 'rgba(209, 255, 38, 0.45)',
    backgroundColor: colors.primary.muted,
  },
  submenuLabel: {
    fontSize: 9,
    color: C.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  submenuLabelActive: {
    color: C.lime,
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
  buscarRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
});
