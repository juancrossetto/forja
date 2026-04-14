/**
 * Chrome para tab bar y submenús: contenedor tipo pastilla (referencia tipo app limpia), modo oscuro.
 */
import { colors } from './colors';
import { borderRadius } from './radius';

export const navigationChrome = {
  /** Fondo detrás del área de navegación (tapar contenido al hacer scroll) */
  shellBackground: colors.background,
  shellBorderTop: colors.border.subtle,

  /** Contenedor rectangular-redondeado que envuelve los ítems */
  pillContainer: {
    backgroundColor: colors.surface.elevated,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.navigationDock,
  },
  /** Margen respecto a los bordes de pantalla */
  screenEdgeInset: 14,
  /** Padding interno del contenedor (aire entre borde e íconos) */
  containerPaddingV: 8,
  containerPaddingH: 6,

  /**
   * Inset del highlight respecto al slot medido del ítem (px).
   * Negativo agranda la pastilla para que abrace mejor ícono + label (tabs y submenú).
   */
  tabSelectionPillInset: -4,

  /** Highlight que se desliza dentro del contenedor */
  selectionPill: {
    backgroundColor: 'rgba(209, 255, 38, 0.13)',
    borderColor: 'rgba(209, 255, 38, 0.48)',
    borderWidth: 1,
    shadowColor: '#d1ff26',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
  },
  /** Radio del highlight interno (proporcionalmente menor que el contenedor) */
  pillRadius: borderRadius.navigationPill,
  inactiveIcon: 'rgba(255, 255, 255, 0.4)',
  activeIcon: colors.primary.default,
} as const;
