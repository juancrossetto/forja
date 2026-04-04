/**
 * Método R3SET - The Kinetic Monolith Design System
 * Color Palette
 */

export const colors = {
  // === Foundation ===
  background: '#0e0e0e',
  surface: {
    base: '#1a1a1a',
    elevated: '#222222',
    overlay: 'rgba(14, 14, 14, 0.85)',
  },

  // === Primary: High-Voltage Lime ===
  primary: {
    default: '#D1FF26',
    light: '#cefc22',
    dark: '#a8cc1e',
    muted: 'rgba(209, 255, 38, 0.15)',
    text: '#0e0e0e', // Dark text on primary backgrounds
  },

  // === Secondary: Cyan ===
  secondary: {
    default: '#00e3fd',
    light: '#33e9fd',
    dark: '#00b5ca',
    muted: 'rgba(0, 227, 253, 0.15)',
  },

  // === Tertiary: Orange ===
  tertiary: {
    default: '#ff734a',
    light: '#ff8f6d',
    dark: '#cc5c3b',
    muted: 'rgba(255, 115, 74, 0.15)',
  },

  // === Text ===
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    inverse: '#0e0e0e',
  },

  // === States ===
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#EF4444',
  info: '#00e3fd',

  // === Glassmorphism ===
  glass: {
    background: 'rgba(30, 30, 30, 0.60)',
    border: 'rgba(255, 255, 255, 0.08)',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },

  // === Borders (subtle, no hard lines) ===
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',
    default: 'rgba(255, 255, 255, 0.10)',
    strong: 'rgba(255, 255, 255, 0.18)',
  },

  // === Gradients (as arrays for LinearGradient) ===
  gradients: {
    kinetic: ['#D1FF26', '#00e3fd'] as const,
    kineticVertical: ['#D1FF26', '#00e3fd'] as const,
    warmAccent: ['#ff734a', '#D1FF26'] as const,
    darkFade: ['rgba(14, 14, 14, 0)', '#0e0e0e'] as const,
    darkFadeUp: ['#0e0e0e', 'rgba(14, 14, 14, 0)'] as const,
    surfaceGlow: ['rgba(209, 255, 38, 0.08)', 'rgba(14, 14, 14, 0)'] as const,
  },

  // === Pillar Colors (Training, Nutrition, Psychology) ===
  pillars: {
    training: '#D1FF26',
    nutrition: '#00e3fd',
    psychology: '#ff734a',
  },
} as const;

export type Colors = typeof colors;
