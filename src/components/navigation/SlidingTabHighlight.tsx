import React, { useEffect } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { navigationChrome } from '../../theme/navigationChrome';

/** Config tipo app fitness: rápido pero con un poco de inercia */
export const TAB_SPRING = {
  damping: 20,
  stiffness: 300,
  mass: 0.72,
} as const;

/** Rectángulo del ítem respecto al mismo padre que el highlight (p. ej. track / dock interior) */
export type TabSlotLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type SlidingTabHighlightProps = {
  tabCount: number;
  activeIndex: number;
  containerWidth: number;
  /**
   * Inset dentro del slot medido (px). Más bajo o negativo = pastilla más grande alrededor del ítem.
   * Por defecto: `navigationChrome.tabSelectionPillInset`.
   */
  pillInset?: number;
  horizontalContentPadding?: number;
  slotLayouts?: Array<TabSlotLayout | null | undefined>;
  style?: ViewStyle;
  /** Solo si no hay medidas por slot (fallback) */
  height?: number;
  top?: number;
};

function layoutsReady(
  slotLayouts: Array<TabSlotLayout | null | undefined> | undefined,
  tabCount: number,
): slotLayouts is TabSlotLayout[] {
  if (!slotLayouts || slotLayouts.length < tabCount) return false;
  for (let i = 0; i < tabCount; i++) {
    const s = slotLayouts[i];
    if (!s || s.width <= 0 || s.height <= 0) return false;
  }
  return true;
}

/**
 * Highlight que se desliza. Con `slotLayouts` completos usa x/y/width/height reales del ítem
 * para que envuelva todo el contenido (ícono + texto).
 */
export function SlidingTabHighlight({
  tabCount,
  activeIndex,
  containerWidth,
  pillInset = navigationChrome.tabSelectionPillInset,
  horizontalContentPadding = 0,
  slotLayouts,
  style,
  height: fallbackH = 40,
  top: fallbackTop = 8,
}: SlidingTabHighlightProps) {
  const pillX = useSharedValue(0);
  const pillW = useSharedValue(0);
  const pillTop = useSharedValue(fallbackTop);
  const pillH = useSharedValue(fallbackH);

  useEffect(() => {
    if (containerWidth <= 0 || tabCount <= 0) return;

    if (layoutsReady(slotLayouts, tabCount)) {
      const slot = slotLayouts[activeIndex];
      const inset = pillInset;
      pillX.value = withSpring(slot.x + inset, TAB_SPRING);
      pillW.value = withSpring(Math.max(0, slot.width - 2 * inset), TAB_SPRING);
      pillTop.value = withSpring(slot.y + inset, TAB_SPRING);
      pillH.value = withSpring(Math.max(0, slot.height - 2 * inset), TAB_SPRING);
      return;
    }

    const pad = horizontalContentPadding;
    const innerW = Math.max(0, containerWidth - 2 * pad);
    const slotW = innerW / tabCount;
    const w = Math.max(0, slotW - pillInset * 2);
    pillW.value = withSpring(w, TAB_SPRING);
    pillX.value = withSpring(pad + activeIndex * slotW + pillInset, TAB_SPRING);
    pillTop.value = withSpring(fallbackTop, TAB_SPRING);
    pillH.value = withSpring(fallbackH, TAB_SPRING);
  }, [
    activeIndex,
    containerWidth,
    tabCount,
    pillInset,
    horizontalContentPadding,
    slotLayouts,
    fallbackTop,
    fallbackH,
  ]);

  const animated = useAnimatedStyle(() => ({
    width: pillW.value,
    height: pillH.value,
    top: pillTop.value,
    transform: [{ translateX: pillX.value }],
  }));

  if (containerWidth <= 0) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.pill, animated, style]} />
  );
}

type TabItemMotionProps = {
  isFocused: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'subtle' | 'none';
};

export function TabItemMotion({ isFocused, children, style, variant = 'default' }: TabItemMotionProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (variant === 'none') {
      scale.value = 1;
      translateY.value = 0;
      return;
    }
    if (variant === 'subtle') {
      scale.value = withSpring(isFocused ? 1.04 : 0.97, TAB_SPRING);
      translateY.value = withSpring(isFocused ? 0 : 1, TAB_SPRING);
      return;
    }
    scale.value = withSpring(isFocused ? 1.05 : 0.96, TAB_SPRING);
    translateY.value = withSpring(isFocused ? 0 : 1.5, TAB_SPRING);
  }, [isFocused, variant]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  if (variant === 'none') {
    return <Animated.View style={style}>{children}</Animated.View>;
  }

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: 0,
    borderRadius: navigationChrome.pillRadius,
    backgroundColor: navigationChrome.selectionPill.backgroundColor,
    borderWidth: navigationChrome.selectionPill.borderWidth,
    borderColor: navigationChrome.selectionPill.borderColor,
    shadowColor: navigationChrome.selectionPill.shadowColor,
    shadowOffset: navigationChrome.selectionPill.shadowOffset,
    shadowOpacity: navigationChrome.selectionPill.shadowOpacity,
    shadowRadius: navigationChrome.selectionPill.shadowRadius,
    elevation: navigationChrome.selectionPill.elevation,
  },
});
