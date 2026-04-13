/**
 * Chrome para tab bar y submenús: contenedor tipo pastilla (referencia tipo app limpia), modo oscuro.
 */
import { colors } from './colors';

export const navigationChrome = {
  /** Fondo detrás del área de navegación (tapar contenido al hacer scroll) */
  shellBackground: colors.background,
  shellBorderTop: colors.border.subtle,

  /** Contenedor redondeado que envuelve los ítems (como la “cápsula” del reference) */
  pillContainer: {
    backgroundColor: colors.surface.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    /** Muy redondeado, estilo cápsula */
    borderRadius: 28,
  },
  /** Margen respecto a los bordes de pantalla */
  screenEdgeInset: 14,
  /** Padding interno del contenedor (aire entre borde e íconos) */
  containerPaddingV: 8,
  containerPaddingH: 6,

  /** Highlight que se desliza dentro del contenedor */
  selectionPill: {
    backgroundColor: 'rgba(209, 255, 38, 0.1)',
    borderColor: 'rgba(209, 255, 38, 0.28)',
    borderWidth: 1,
    shadowColor: '#d1ff26',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Radio del highlight interno (un poco menor que el contenedor) */
  pillRadius: 14,
  inactiveIcon: 'rgba(255, 255, 255, 0.4)',
  activeIcon: colors.primary.default,
} as const;
