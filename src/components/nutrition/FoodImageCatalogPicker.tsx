/**
 * FoodImageCatalogPicker — overlay (no Modal)
 * ─────────────────────────────────────────────
 * Se renderiza como absoluteFill dentro del contexto del modal padre.
 * Evita el problema de iOS donde un Modal dentro de otro Modal no aparece.
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listSharedFoodImages, type SharedFoodImage } from '../../services/foodService';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/radius';

const SCREEN_H = Dimensions.get('window').height;
/** Miniatura en fila lista — más chica = más ítems visibles */
const LIST_THUMB_SIZE = 44;

const D = {
  bg:        '#111111',
  surface:   '#1a1a1a',
  surfaceHi: '#222222',
  text:      '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.62)',
  textSoft:  'rgba(255,255,255,0.36)',
  border:    'rgba(255,255,255,0.08)',
  borderMed: 'rgba(255,255,255,0.14)',
  lime:      colors.primary.default,
} as const;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (imageKey: string) => void;
  currentKey?: string | null;
}

export function FoodImageCatalogPicker({ visible, onClose, onSelect, currentKey }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [images, setImages]     = useState<SharedFoodImage[]>([]);
  const [filtered, setFiltered] = useState<SharedFoodImage[]>([]);
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [mounted, setMounted]   = useState(false);

  // Animación entrada / salida
  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
      setMounted(true);
      setQuery('');
      setLoading(true);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 220, mass: 0.85 }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      listSharedFoodImages().then((imgs) => {
        setImages(imgs);
        setFiltered(imgs);
        setLoading(false);
      });
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_H, duration: 220, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]);

  // Filtrado por texto
  useEffect(() => {
    if (!query.trim()) { setFiltered(images); return; }
    const q = query.toLowerCase().trim();
    setFiltered(images.filter((img) => img.label.toLowerCase().includes(q)));
  }, [query, images]);

  const handleSelect = useCallback((img: SharedFoodImage) => {
    Keyboard.dismiss();
    onSelect(img.key);
    onClose();
  }, [onSelect, onClose]);

  const renderItem = useCallback(({ item }: { item: SharedFoodImage }) => {
    const selected = item.key === currentKey;
    return (
      <TouchableOpacity
        style={[styles.listRow, selected && styles.listRowSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.listThumb}
          resizeMode="cover"
        />
        <Text style={[styles.listRowLabel, selected && styles.itemLabelSelected]} numberOfLines={2}>
          {item.label}
        </Text>
        {selected ? (
          <View style={styles.listCheck}>
            <MaterialCommunityIcons name="check" size={14} color="#000" />
          </View>
        ) : (
          <MaterialCommunityIcons name="chevron-right" size={18} color={D.textSoft} />
        )}
      </TouchableOpacity>
    );
  }, [currentKey, handleSelect]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root]}
      pointerEvents="box-none"
    >
      {/* Backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        pointerEvents="auto"
      >
        {/* Handle */}
        <View style={styles.handleArea}>
          <View style={styles.handle} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Elegir imagen</Text>
          {images.length > 0 && (
            <Text style={styles.headerSub}>{images.length} imágenes disponibles</Text>
          )}
        </View>

        {/* Buscador */}
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={18} color={D.textSoft} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nombre…"
            placeholderTextColor={D.textSoft}
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
            blurOnSubmit
            onSubmitEditing={() => Keyboard.dismiss()}
          />
        </View>

        {/* Contenido */}
        {loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator color={D.lime} />
            <Text style={styles.emptyText}>Cargando catálogo…</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="image-off-outline" size={36} color={D.textSoft} />
            <Text style={styles.emptyText}>
              {images.length === 0
                ? 'No hay imágenes en el catálogo.\nSubí archivos a la raíz del bucket food-images en Supabase.'
                : 'Sin resultados.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          />
        )}

        {/* Quitar imagen */}
        {currentKey ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              Keyboard.dismiss();
              onSelect('');
              onClose();
            }}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="image-remove" size={16} color={D.textMuted} />
            <Text style={styles.clearBtnText}>Quitar imagen del catálogo</Text>
          </TouchableOpacity>
        ) : null}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    zIndex: 9999,
    elevation: 24,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    backgroundColor: D.bg,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: D.borderMed,
    maxHeight: '88%',
  },
  handleArea: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: radius.xxs,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: D.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    color: D.textSoft,
    marginTop: 2,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: D.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: D.border,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: D.text,
    padding: 0,
  },
  /** Altura acotada para que la lista scrollee dentro del sheet */
  listScroll: {
    maxHeight: SCREEN_H * 0.52,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: radius.input,
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
  },
  listRowSelected: {
    borderColor: D.lime,
    borderWidth: 1,
    backgroundColor: 'rgba(209, 255, 38, 0.06)',
  },
  listThumb: {
    width: LIST_THUMB_SIZE,
    height: LIST_THUMB_SIZE,
    borderRadius: radius.sm,
    backgroundColor: D.surfaceHi,
  },
  listRowLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: D.textMuted,
    textTransform: 'capitalize',
  },
  listCheck: {
    width: 22,
    height: 22,
    borderRadius: radius.chip,
    backgroundColor: D.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabelSelected: {
    color: D.lime,
    fontWeight: '700',
  },
  emptyWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 13,
    color: D.textSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: D.border,
    backgroundColor: D.surface,
  },
  clearBtnText: {
    fontSize: 13,
    color: D.textMuted,
    fontWeight: '600',
  },
});
