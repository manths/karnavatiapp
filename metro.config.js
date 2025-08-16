const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to help with network issues
config.resolver.sourceExts.push('cjs');

module.exports = config;
