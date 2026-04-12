/**
 * Amplía app.json con valores que pueden venir del entorno (p. ej. EAS projectId para push).
 * @param {{ config: import('@expo/config').ExpoConfig }} ctx
 */
module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    eas: {
      ...config.extra?.eas,
      projectId:
        process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
        config.extra?.eas?.projectId ||
        '',
    },
  },
});
