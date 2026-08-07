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
        '^.+\\.(ts|tsx|js|jsx)$': ['ts-jest', {
            diagnostics: false,
            tsconfig: '<rootDir>/tsconfig.test.json'
        }]
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(sanitize-html|htmlparser2|domhandler|domelementtype|domutils|dom-serializer|entities|escape-string-regexp|parse5)/)'
    ],
    moduleNameMapper: {
        '^uuid$': '<rootDir>/__mocks__/uuid.js',
        '^@sentry/profiling-node$': '<rootDir>/src/tests/mocks/sentry-profiling-node.ts',

        // Shared package aliases (source of truth for tests)
        '^@shared$': '<rootDir>/../../shared/src/index.ts',
        '^@esparex/shared$': '<rootDir>/../../shared/src/index.ts',
        '^@esparex/contracts$': '<rootDir>/../../packages/contracts/src/index.ts',
        '^@esparex/contracts/(.*)$': '<rootDir>/../../packages/contracts/src/$1',

        // Resolve all core aliases to built JS so controller/service mocks target identical module paths
        '^@esparex/core$': '<rootDir>/../../core/dist/index.js',
        '^@esparex/core/(.*)$': '<rootDir>/../../core/dist/$1',
        '^@core/(.*)$': '<rootDir>/../../core/dist/$1'
    },
    modulePathIgnorePatterns: [
        '<rootDir>/../../shared/dist',
        '<rootDir>/dist'
    ],
    coverageThreshold: {
        global: {
            branches: 40,
            functions: 50,
            lines: 50,
            statements: 50
        }
    }
};
