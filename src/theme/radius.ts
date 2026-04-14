/**
 * Método R3SET — Border radius: única fuente para toda la app (como `colors.ts`).
 *
 * ─── CÓMO USAR ───────────────────────────────────────────────────────────────
 *
 * Preferir SIEMPRE los grupos semánticos sobre los valores de escala directos:
 *
 *   radius.surface.card       → tarjetas de contenido  (20)
 *   radius.surface.sheet      → bottom-sheets          (24)
 *   radius.surface.modal      → modales                (30)
 *   radius.button.default     → botones estándar       (20)
 *   radius.button.pill        → botones tipo píldora   (9999)
 *   radius.label.chip         → chips / badges         (12)
 *   radius.navigation.dock    → barra de navegación    (30)
 *
 * Los valores de `scale` están reservados para casos donde ningún token
 * semántico aplica. Usar `scale` directo (ej. radius.sm, radius.lg)
 * solo si se trata de un valor de presentación puntual.
 *
 * ─── JERARQUÍA ───────────────────────────────────────────────────────────────
 *
 *   scale   → valores numéricos base, sin semántica de negocio
 *   radius  → = scale + grupos semánticos (superficie, botón, etiqueta…)
 *   borderRadius → mapa plano = compat para imports legacy; preferir `radius`
 *
 * ─── ESCALA ─ ordenada de menor a mayor ─────────────────────────────────────
 */

const scale = {
  hairline: 1,      // líneas sutiles, separadores casi invisibles
  xxs: 2,
  xsTight: 3,
  xs: 4,
  smTight: 5,
  control: 6,       // controles pequeños (switches, knobs)
  avatarTight: 7,
  controlL: 9,      // variante mayor de `control`
  input: 10,        // ⚠ solo para escala de valor bruto; usar radius.surface.input (20) en inputs
  chip: 11,         // ⚠ solo para escala de valor bruto; usar radius.label.chip (12) en chips
  sm: 12,           // tarjetas pequeñas, iconos con fondo
  mdTight: 13,      // entre sm y panel; ≠ "md ajustado" — es un tamaño propio ~13 px
  mdL: 14,          // entre sm y panel; ≠ "md grande" — es un tamaño propio ~14 px
  panel: 18,        // paneles internos, escáneres, sub-secciones
  md: 20,           // radio base para la mayoría de tarjetas e inputs
  lg: 24,           // bottom-sheets, modales secundarios
  xl: 30,           // modales principales, dock de navegación
  xxl: 34,
  xxxl: 36,
  roundAvatar: 40,  // avatares redondeados no circulares
  /** Círculos perfectos (usar con contenedor cuadrado del mismo tamaño) */
  circle50: 50,
  circle52: 52,
  full: 9999,       // píldoras / círculos vía porcentaje
} as const;

export const radius = {
  ...scale,

  // ── Botones ────────────────────────────────────────────────────────────────
  button: {
    default: scale.md,    // 20 — botón estándar
    small: scale.sm,      // 12 — botón compacto
    pill: scale.full,     // píldora
  },

  // ── Etiquetas / chips / badges ─────────────────────────────────────────────
  label: {
    badge: scale.xs,      // 4
    chip: scale.sm,       // 12
    pill: scale.full,
  },

  // ── Superficies ────────────────────────────────────────────────────────────
  surface: {
    card: scale.md,       // 20 — tarjeta estándar
    input: scale.md,      // 20 — campo de texto
    elevated: scale.md,   // 20 — superficie elevada
    sheet: scale.lg,      // 24 — bottom-sheet
    sheetTop: scale.xl,   // 30 — top corners de sheet (cuando solo se redondea arriba)
    hero: scale.md,       // 20 — banners / covers
    panel: scale.lg,      // 24 — paneles laterales / drawers
    modal: scale.xl,      // 30 — modales de pantalla completa
  },

  // ── Navegación ────────────────────────────────────────────────────────────
  navigation: {
    dock: scale.xl,       // 30 — pill de la tab bar
    pill: scale.lg,       // 24 — ítem activo dentro del dock
  },

  /** Escáner de alimentos (vista de cámara) */
  scanner: {
    outer: 38,
    ring: 35,
    lens: 26,
    frameL: 22,
    frameM: 21,
    panel: scale.mdL,     // 14
  },
} as const;

/**
 * Mapa plano para retrocompatibilidad con imports legacy.
 * Para código nuevo, preferir `radius.surface.*`, `radius.button.*`, etc.
 */
export const borderRadius = {
  ...scale,
  card: scale.md,
  button: scale.md,
  input: scale.md,
  tile: scale.sm,
  sheet: scale.lg,
  navigationDock: scale.xl,
  navigationPill: scale.lg,
} as const;

export type Radius = typeof radius;
export type BorderRadius = typeof borderRadius;
