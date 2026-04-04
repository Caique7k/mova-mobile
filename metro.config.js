const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native-view-overflow': path.resolve(
    __dirname,
    'components/shims/react-native-view-overflow.tsx'
  ),
};

module.exports = withNativeWind(config, { input: './global.css' });
