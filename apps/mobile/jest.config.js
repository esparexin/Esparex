// Referenced by `testEnvironment` below via path string; required here as well so
// static reference scanners (DUP-001) see the dependency. Test-tooling only.
require('./jest.environment.js');

module.exports = {
  maxWorkers: 1,
  preset: 'react-native',
  // The react-native preset pins a jest-29 test environment
  // (react-native/jest/react-native-env.js), which is incompatible with the
  // monorepo's jest 30 runtime. jest.environment.js mirrors it against the
  // hoisted jest-environment-node@30. Test-tooling only.
  testEnvironment: '<rootDir>/jest.environment.js',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  setupFiles: ['./jest.setup.js'],
  moduleNameMapper: {
    '^expo-modules-core.*$': '<rootDir>/__mocks__/expo-modules-core-refs.js',
    '^expo-image$': '<rootDir>/__mocks__/expo-image.js',
    '^react-native-razorpay$': '<rootDir>/__mocks__/react-native-razorpay.js',
    '^test-renderer$': 'react-test-renderer'
  }
};
