/**
 * Jest mock for expo-image.
 *
 * expo-image uses native modules (requireNativeViewManager) that are unavailable
 * in the Jest / react-native test environment. This mock stubs the Image export
 * with the standard react-native Image component so that component tests continue
 * to render correctly without requiring a native runtime.
 */
const React = require('react');
const { Image } = require('react-native');

module.exports = {
  Image,
};
