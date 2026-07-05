module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.spec.ts', '**/tests/**/*.spec.ts', '**/__tests__/**/*.test.ts'],
    setupFiles: ['<rootDir>/src/tests/jest.setup-env.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/tests/jest.after-env.ts'],
    globalTeardown: '<rootDir>/src/tests/jest.globalTeardown.js',
    verbose: true,
    roots: ['<rootDir>'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            diagnostics: false,
            tsconfig: '<rootDir>/tsconfig.json'
        }]
    },
    moduleNameMapper: {
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        '^@sentry/profiling-node$': '<rootDir>/src/tests/mocks/sentry-profiling-node.ts',

        // Shared package aliases (source of truth for tests)
        '^@shared$': '<rootDir>/../../shared/src/index.ts',
        '^@esparex/shared$': '<rootDir>/../../shared/src/index.ts',
        '^@esparex/core/models$': '<rootDir>/src/tests/models.mock.ts',
        '^@esparex/core/services$': '<rootDir>/src/tests/services.mock.ts',
        '^@core-services/(.*)$': '<rootDir>/../../core/src/services/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',

        // Wildcard fallback for all other core paths
        '^@esparex/core$': '<rootDir>/../../core/dist/index.js',
        '^@esparex/core/(.*)$': '<rootDir>/../../core/dist/$1',
        '^@core/(.*)$': '<rootDir>/../../core/dist/$1'
    },
    modulePathIgnorePatterns: [
        '<rootDir>/../../shared/dist'
    ]
};
