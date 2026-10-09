'use strict';

/**
 * React Native test environment for Jest 30.
 *
 * Mirrors `react-native/jest/react-native-env.js` (which pins
 * jest-environment-node@29 via react-native's own dependency range and breaks
 * under jest-runtime@30 with `TypeError: this._moduleMocker.clearMocksOnScope
 * is not a function`) but extends the monorepo-hoisted
 * jest-environment-node@30 instead, whose ModuleMocker (jest-mock@30) provides
 * the API jest-runtime@30 expects.
 *
 * Test-tooling only; no production source affected.
 */
const NodeEnvironment = require('jest-environment-node').TestEnvironment;

module.exports = class ReactNativeEnvironment extends NodeEnvironment {
  customExportConditions = ['require', 'react-native'];
};
