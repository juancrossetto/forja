export { colors } from './colors';
export { typography, fontFamilies } from './typography';
export { spacing, borderRadius, elevation, layout } from './spacing';

export const theme = {
  colors: require('./colors').colors,
  typography: require('./typography').typography,
  spacing: require('./spacing').spacing,
  borderRadius: require('./spacing').borderRadius,
  elevation: require('./spacing').elevation,
  layout: require('./spacing').layout,
};

export type Theme = typeof theme;
