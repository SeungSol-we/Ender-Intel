module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxRuntime: 'automatic' }]
    ],
    plugins: [
      // 'react-native-reanimated/plugin', // Reanimated를 쓴다면 이 줄이 생명줄입니다.
    ],
  };
};