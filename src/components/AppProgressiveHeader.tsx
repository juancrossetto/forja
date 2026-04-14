import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Text,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import {
  getHealthStatus,
  requestHealthPermissions,
} from '../services/healthService';

/** Height of the icon row (status-bar / notch area NOT included). */
export const HEADER_ROW_HEIGHT = 62;

const DIM     = 'rgba(255,255,255,0.22)';
const PRIMARY = '#D1FF26';

interface AppProgressiveHeaderProps {
  scrollY: Animated.Value;
  topInset?: number;
  onHomePress?: () => void;
  onAvatarPress?: () => void;
}

export const AppProgressiveHeader: React.FC<AppProgressiveHeaderProps> = ({
  scrollY,
  topInset = 0,
  onHomePress,
  onAvatarPress,
}) => {
  const avatarUrl       = useAuthStore((s) => s.avatarUrl);
  const user            = useAuthStore((s) => s.user);
  const watchConnected  = useAuthStore((s) => s.watchConnected);
  const setWatchConnected = useAuthStore((s) => s.setWatchConnected);

  const avatarInitial = (user?.name?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase();

  // ── Check health permission on startup (no network — reads local perm state) ──
  useEffect(() => {
    getHealthStatus().then((status) => {
      setWatchConnected(status.permissions.steps === 'granted');
    });
  }, [setWatchConnected]);

  // ── Animations ─────────────────────────────────────────────────────────────
  const glassFade = scrollY.interpolate({
    inputRange: [0, 64], outputRange: [0, 1], extrapolate: 'clamp',
  });
  const separatorFade = scrollY.interpolate({
    inputRange: [48, 80], outputRange: [0, 1], extrapolate: 'clamp',
  });

  // Monta el glass solo cuando hay scroll real — evita que BlurView (UIVisualEffectView
  // en iOS) renderice su material nativo aunque el Animated.View padre tenga opacity:0.
  const [glassActive, setGlassActive] = useState(false);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      if (value > 2)  setGlassActive(true);
      if (value <= 0) setGlassActive(false);
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const totalHeight = HEADER_ROW_HEIGHT + topInset;

  // ── Device tap handlers ────────────────────────────────────────────────────

  const handleWatchPress = async () => {
    if (watchConnected) {
      Alert.alert(
        'Apple Watch conectado',
        'Para desconectar, revocá el permiso de Salud en Ajustes.',
        [
          { text: 'Ahora no', style: 'cancel' },
          { text: 'Ir a Ajustes', onPress: () => Linking.openURL('app-settings:') },
        ],
      );
      return;
    }

    const status = await requestHealthPermissions();
    const granted = status.permissions.steps === 'granted';
    setWatchConnected(granted);

    if (granted) return;

    if (!status.available) {
      Alert.alert(
        'No disponible',
        'El sensor de actividad no está disponible en este dispositivo.',
        [{ text: 'Entendido' }],
      );
      return;
    }

    // Permission denied (ya fue rechazado antes — iOS no vuelve a preguntar)
    Alert.alert(
      'Permiso de salud requerido',
      'Para sincronizar tus pasos y actividad, habilitá el acceso en:\n\nAjustes → Privacidad y seguridad → Movimiento y actividad física → Método R3SET',
      [
        { text: 'Ahora no', style: 'cancel' },
        { text: 'Ir a Ajustes', onPress: () => Linking.openURL('app-settings:') },
      ],
    );
  };

  const handleGarminPress = () => {
    Alert.alert(
      'Conectar Garmin',
      '¿Querés vincular tu dispositivo Garmin?\n\nEsta integración estará disponible próximamente.',
      [{ text: 'Entendido' }],
    );
  };

  const handleFitbitPress = () => {
    Alert.alert(
      'Conectar Fitbit',
      '¿Querés vincular tu cuenta de Fitbit?\n\nEsta integración estará disponible próximamente.',
      [{ text: 'Entendido' }],
    );
  };

  return (
    <View
      style={[styles.root, { height: totalHeight }]}
      pointerEvents="box-none"
    >
      {/* Glass background — solo se monta cuando hay scroll activo */}
      {glassActive ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: glassFade }]}
          pointerEvents="none"
        >
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBlurFill]} />
          ) : (
            <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, styles.glassDark]} />
        </Animated.View>
      ) : null}

      {/* Bottom hairline */}
      <Animated.View
        style={[styles.separator, { opacity: separatorFade }]}
        pointerEvents="none"
      />

      {/* ── Icon row ──────────────────────────────────────────────────────── */}
      <View style={[styles.row, { paddingTop: topInset }]}>

        {/* LEFT — home */}
        <TouchableOpacity
          style={styles.pill}
          onPress={onHomePress}
          activeOpacity={0.68}
          hitSlop={HIT}
        >
          <Ionicons name="home-outline" size={20} color="rgba(255,255,255,0.88)" />
        </TouchableOpacity>

        {/* CENTER — devices (each icon independently tappable) */}
        <View style={styles.devicesPill}>
          <TouchableOpacity
            onPress={handleWatchPress}
            activeOpacity={0.65}
            hitSlop={HIT_SM}
          >
            <MaterialCommunityIcons
              name="watch"
              size={16}
              color={watchConnected ? PRIMARY : DIM}
            />
          </TouchableOpacity>

          <View style={styles.deviceDivider} />

          <TouchableOpacity
            onPress={handleGarminPress}
            activeOpacity={0.65}
            hitSlop={HIT_SM}
          >
            <MaterialCommunityIcons name="navigation" size={16} color={DIM} />
          </TouchableOpacity>

          <View style={styles.deviceDivider} />

          <TouchableOpacity
            onPress={handleFitbitPress}
            activeOpacity={0.65}
            hitSlop={HIT_SM}
          >
            <MaterialCommunityIcons name="heart-pulse" size={16} color={DIM} />
          </TouchableOpacity>
        </View>

        {/* RIGHT — avatar */}
        <TouchableOpacity
          style={styles.avatarPill}
          onPress={onAvatarPress}
          activeOpacity={0.72}
          hitSlop={HIT}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{avatarInitial}</Text>
            </View>
          )}
        </TouchableOpacity>

      </View>
    </View>
  );
};

const HIT    = { top: 10, bottom: 10, left: 10, right: 10 } as const;
const HIT_SM = { top: 8,  bottom: 8,  left: 6,  right: 6  } as const;

const PILL_BASE = {
  height: 40,
  borderRadius: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.09)',
} as const;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
  },

  glassDark: { backgroundColor: 'rgba(10, 10, 10, 0.32)' },
  webBlurFill: {
    backgroundColor: 'rgba(14, 14, 14, 0.80)',
    // @ts-ignore — web-only
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },

  separator: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  pill: {
    ...PILL_BASE,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },

  devicesPill: {
    ...PILL_BASE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 4,
  },
  deviceDivider: {
    width: 1, height: 12,
    backgroundColor: 'rgba(255,255,255,0.10)',
    marginHorizontal: 2,
  },

  avatarPill: {
    ...PILL_BASE,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(209, 255, 38, 0.45)',
  },
  avatarImg: { width: 30, height: 30, borderRadius: 7 },
  avatarFallback: {
    width: 30, height: 30, borderRadius: 7,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 13, fontWeight: '700', color: '#D1FF26' },
});
