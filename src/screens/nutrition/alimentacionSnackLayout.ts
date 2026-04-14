/**
 * Constantes del dock de submenú (AlimentacionScreen) para `bottomPad`, etc.
 * Mantener alineadas con el layout real del submenú.
 */
export const SUBNAV_GAP_ABOVE_TABBAR = 6;
export const SUBMENU_DOCK_HEIGHT = 64;

/**
 * Toast del Plan embebido: vive dentro de `ComidasScreen`, y el área útil del padre ya
 * termina justo encima del submenú. El `bottom` del overlay es relativo a ese contenedor,
 * así que debe ser un valor pequeño (pegado al borde inferior del contenido = junto al
 * margen superior visual del submenú). No usar tabBarHeight aquí.
 */
export const EMBEDDED_SNACK_BOTTOM_INSET = 8;
