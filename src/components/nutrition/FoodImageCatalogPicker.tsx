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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listSharedFoodImages, type SharedFoodImage } from '../../services/foodService';
import { colors } from '../../theme/colors';

const SCREEN_H = Dimensions.get('window').height;
const COLS = 3;
const ITEM_GAP = 10;

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
    onSelect(img.key);
    onClose();
  }, [onSelect, onClose]);

  const renderItem = useCallback(({ item }: { item: SharedFoodImage }) => {
    const selected = item.key === currentKey;
    return (
      <TouchableOpacity
        style={[styles.item, selected && styles.itemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.75}
      >
        <Image
          source={{ uri: item.url }}
          style={styles.itemImage}
          resizeMode="cover"
        />
        {selected ? (
          <View style={styles.itemCheckBadge}>
            <MaterialCommunityIcons name="check" size={12} color="#000" />
          </View>
        ) : null}
        <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]} numberOfLines={2}>
          {item.label}
        </Text>
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
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
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
            numColumns={COLS}
            columnWrapperStyle={styles.row}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {/* Quitar imagen */}
        {currentKey ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => { onSelect(''); onClose(); }}
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
    zIndex: 999,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    backgroundColor: D.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    borderRadius: 2,
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
    borderRadius: 10,
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
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  row: {
    gap: ITEM_GAP,
    marginBottom: ITEM_GAP,
  },
  item: {
    flex: 1,
    maxWidth: `${100 / COLS - 2}%` as any,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: D.surface,
    borderWidth: 1,
    borderColor: D.border,
  },
  itemSelected: {
    borderColor: D.lime,
    borderWidth: 2,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: D.surfaceHi,
  },
  itemCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: D.lime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: D.textMuted,
    paddingHorizontal: 6,
    paddingVertical: 5,
    textAlign: 'center',
    textTransform: 'capitalize',
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
    borderRadius: 10,
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
