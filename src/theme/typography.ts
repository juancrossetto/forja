/**
 * Método R3SET - Typography System
 * Fonts: Space Grotesk (Display), Manrope (Headlines/Body), Lexend (Labels)
 */

export const fontFamilies = {
  display: 'SpaceGrotesk',
  displayBold: 'SpaceGrotesk-Bold',
  headline: 'Manrope',
  headlineBold: 'Manrope-Bold',
  headlineSemiBold: 'Manrope-SemiBold',
  body: 'Manrope',
  bodyMedium: 'Manrope-Medium',
  label: 'Lexend',
  labelMedium: 'Lexend-Medium',
  labelSemiBold: 'Lexend-SemiBold',
} as const;

export const typography = {
  // === Display (Space Grotesk) ===
  displayLarge: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    textTransform: 'uppercase' as const,
  },
  displayMedium: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    textTransform: 'uppercase' as const,
  },
  displaySmall: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    textTransform: 'uppercase' as const,
  },

  // === Headlines (Manrope) ===
  headlineLarge: {
    fontFamily: fontFamilies.headlineBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  headlineMedium: {
    fontFamily: fontFamilies.headlineSemiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  headlineSmall: {
    fontFamily: fontFamilies.headlineSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },

  // === Body (Manrope) ===
  bodyLarge: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: fontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  bodySmall: {
    fontFamily: fontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // === Labels (Lexend) ===
  labelLarge: {
    fontFamily: fontFamilies.labelSemiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
  labelMedium: {
    fontFamily: fontFamilies.labelMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  },
  labelSmall: {
    fontFamily: fontFamilies.label,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },

  // === Metrics (Space Grotesk - for numbers/stats) ===
  metricLarge: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -2,
  },
  metricMedium: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
  },
  metricSmall: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.5,
  },
} as const;

export type Typography = typeof typography;
