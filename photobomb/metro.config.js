// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This fixes the issue with Node.js modules being required in React Native
// Specifically needed for @supabase/realtime-js which depends on 'ws' package
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
