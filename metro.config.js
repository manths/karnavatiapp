const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to help with network issues
config.resolver.sourceExts.push('cjs');

// Add hermes transformer options for better compatibility
config.transformer.hermesCommand = 'node_modules/react-native/sdks/hermesc/hermesc';
config.transformer.minifierPath = 'metro-minify-terser';

// Better error handling for production builds
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Ensure proper platform extensions
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
