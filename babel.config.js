module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Reanimated 4 (Expo 54): el plugin de worklets debe ir último (equivale a reanimated/plugin en v4).
    plugins: ['react-native-worklets/plugin'],
  };
};
