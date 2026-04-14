export { colors } from './colors';
export { typography, fontFamilies } from './typography';
export { spacing, elevation, layout } from './spacing';
export { radius, borderRadius } from './radius';

export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  radius: require('./radius').radius,
  borderRadius: require('./radius').borderRadius,
  elevation: require('./spacing').elevation,
  layout: require('./spacing').layout,
};

export type Theme = typeof theme;
