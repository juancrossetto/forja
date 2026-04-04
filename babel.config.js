module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['.'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@theme': './src/theme',
            '@store': './src/store',
            '@navigation': './src/navigation',
            '@types': './src/types',
            '@utils': './src/utils',
            '@hooks': './src/hooks',
            '@assets': './src/assets',
          },
        },
      ],
    ],
  };
};
