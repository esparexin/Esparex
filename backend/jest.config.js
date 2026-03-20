module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.spec.ts', '**/tests/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    setupFiles: ['<rootDir>/src/tests/jest.setup-env.ts'],
    globalTeardown: '<rootDir>/src/tests/jest.globalTeardown.js',
    verbose: true,
    transform: {
        '^.+\\.tsx?$': ['ts-jest', { diagnostics: false }]
    },
    moduleNameMapper: {
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        '^@sentry/profiling-node$': '<rootDir>/src/tests/mocks/sentry-profiling-node.ts'
    }
};
