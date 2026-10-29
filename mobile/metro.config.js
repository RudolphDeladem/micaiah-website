// Bundled Bible translations ship as `.bible` asset files (JSON text) instead of JS modules,
// so they stay out of the JavaScript bundle and over-the-air updates.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('bible');

module.exports = config;
