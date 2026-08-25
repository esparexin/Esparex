module.exports = {
  preset: 'react-native',
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
