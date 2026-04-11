// Configuración de Babel para Expo con soporte de Expo Router
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Necesario para Expo Router y Reanimated
      'react-native-reanimated/plugin',
    ],
  };
};
