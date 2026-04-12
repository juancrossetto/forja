import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Animated,
  Image,
  Text,
  Platform,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/** Height of the icon row (status-bar / notch area NOT included). */
export const HEADER_ROW_HEIGHT = 62;

type LangCode = 'es' | 'en';

interface LangOption {
  code: LangCode;
  flag: string;
  label: string;
}

const LANGS: LangOption[] = [
  { code: 'es', flag: '🇪🇸', label: 'Español' },
  { code: 'en', flag: '🇬🇧', label: 'English' },
];

interface AppProgressiveHeaderProps {
  scrollY: Animated.Value;
  topInset?: number;
  onHomePress?: () => void;
  onAvatarPress?: () => void;
  onLanguageChange?: (lang: LangCode) => void;
  avatarUrl?: string | null;
  avatarInitial?: string;
}

/**
 * Reusable sticky header with progressive dark-glass blur.
 *
 * Render it last inside your screen root <View> so it layers on top of
 * everything. Connect the same `scrollY` Animated.Value you pass to your
 * Animated.ScrollView's `onScroll` handler (useNativeDriver: true).
 */
export const AppProgressiveHeader: React.FC<AppProgressiveHeaderProps> = ({
  scrollY,
  topInset = 0,
  onHomePress,
  onAvatarPress,
  onLanguageChange,
  avatarUrl,
  avatarInitial = 'U',
}) => {
  const [lang, setLang] = useState<LangCode>('es');
  const [langOpen, setLangOpen] = useState(false);

  // ── Animations (native-driver safe: opacity only) ──────────────────────────

  const glassFade = scrollY.interpolate({
    inputRange: [0, 64],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const separatorFade = scrollY.interpolate({
    inputRange: [48, 80],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const current = LANGS.find((l) => l.code === lang)!;
  const totalHeight = HEADER_ROW_HEIGHT + topInset;

  const handleLangPick = (code: LangCode) => {
    setLang(code);
    setLangOpen(false);
    onLanguageChange?.(code);
  };

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View
        style={[styles.root, { height: totalHeight }]}
        pointerEvents="box-none"
      >
        {/* Animated dark-glass background */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { opacity: glassFade }]}
          pointerEvents="none"
        >
          {Platform.OS === 'web' ? (
            <View style={[StyleSheet.absoluteFill, styles.webBlurFill]} />
          ) : (
            <BlurView
              intensity={78}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          )}
          {/* Dark overlay to deepen and unify the blur */}
          <View style={[StyleSheet.absoluteFill, styles.glassDark]} />
        </Animated.View>

        {/* Bottom hairline */}
        <Animated.View
          style={[styles.separator, { opacity: separatorFade }]}
          pointerEvents="none"
        />

        {/* ── Icon row ──────────────────────────────────────────────────────── */}
        <View style={[styles.row, { paddingTop: topInset }]}>

          {/* LEFT — home (rounded rectangle) */}
          <TouchableOpacity
            style={styles.pill}
            onPress={onHomePress}
            activeOpacity={0.68}
            hitSlop={HIT}
          >
            <Ionicons name="home-outline" size={20} color="rgba(255,255,255,0.88)" />
          </TouchableOpacity>

          {/* CENTER — language capsule (rounded rectangle, wider) */}
          <TouchableOpacity
            style={styles.langPill}
            onPress={() => setLangOpen(true)}
            activeOpacity={0.72}
          >
            <Text style={styles.flag}>{current.flag}</Text>
            <Text style={styles.langLabel}>{current.code.toUpperCase()}</Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={14}
              color="rgba(255,255,255,0.35)"
            />
          </TouchableOpacity>

          {/* RIGHT — avatar (rounded rectangle, lime accent border) */}
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

      {/* ── Language picker modal ─────────────────────────────────────────────── */}
      <Modal
        visible={langOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLangOpen(false)}
      >
        <TouchableOpacity
          style={[
            styles.modalDismiss,
            { paddingTop: topInset + HEADER_ROW_HEIGHT + 6 },
          ]}
          activeOpacity={1}
          onPress={() => setLangOpen(false)}
        >
          <View style={styles.langSheet} onStartShouldSetResponder={() => true}>
            {LANGS.map((opt, i) => (
              <TouchableOpacity
                key={opt.code}
                style={[
                  styles.langRow,
                  i < LANGS.length - 1 && styles.langRowDivider,
                  lang === opt.code && styles.langRowActive,
                ]}
                onPress={() => handleLangPick(opt.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.langRowFlag}>{opt.flag}</Text>
                <Text
                  style={[
                    styles.langRowLabel,
                    lang === opt.code && styles.langRowLabelActive,
                  ]}
                >
                  {opt.label}
                </Text>
                {lang === opt.code && (
                  <MaterialCommunityIcons
                    name="check"
                    size={15}
                    color="#D1FF26"
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const HIT = { top: 10, bottom: 10, left: 10, right: 10 } as const;

// Shared pill style — used by home, language and avatar containers
const PILL_BASE = {
  height: 40,
  borderRadius: 10,
  backgroundColor: 'rgba(255, 255, 255, 0.07)',
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.09)',
} as const;

const styles = StyleSheet.create({
  // ── Container ────────────────────────────────────────────────────────────
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  // ── Glass background ─────────────────────────────────────────────────────
  glassDark: {
    backgroundColor: 'rgba(10, 10, 10, 0.32)',
  },
  webBlurFill: {
    backgroundColor: 'rgba(14, 14, 14, 0.80)',
    // @ts-ignore — web-only
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },

  // ── Separator ────────────────────────────────────────────────────────────
  separator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },

  // ── Icon row ─────────────────────────────────────────────────────────────
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },

  // ── Home pill ────────────────────────────────────────────────────────────
  pill: {
    ...PILL_BASE,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    },

  // ── Avatar pill (lime accent border) ─────────────────────────────────────
  avatarPill: {
    ...PILL_BASE,
    width: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(209, 255, 38, 0.45)',
  },

  // ── Language capsule ─────────────────────────────────────────────────────
  langPill: {
    ...PILL_BASE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    minWidth: 90,
    justifyContent: 'center',
  },
  flag: {
    fontSize: 16,
    lineHeight: 20,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.8,
  },

  // ── Avatar ───────────────────────────────────────────────────────────────
  avatarImg: {
    width: 30,
    height: 30,
    borderRadius: 7,
  },
  avatarFallback: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D1FF26',
  },

  // ── Language picker ──────────────────────────────────────────────────────
  modalDismiss: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  langSheet: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.40,
    shadowRadius: 24,
    elevation: 12,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 12,
  },
  langRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  langRowActive: {
    backgroundColor: 'rgba(209,255,38,0.05)',
  },
  langRowFlag: {
    fontSize: 22,
  },
  langRowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.1,
  },
  langRowLabelActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
