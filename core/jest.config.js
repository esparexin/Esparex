module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleNameMapper: {
    '^uuid$': '<rootDir>/__mocks__/uuid.js',
    '^bullmq$': '<rootDir>/__mocks__/bullmq.ts',
    '^@core/(.*)$': '<rootDir>/src/$1',
    '^@esparex/core/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@shared$': '<rootDir>/../shared/src/index.ts',
    '^@esparex/shared/(.*)$': '<rootDir>/../shared/src/$1',
    '^@esparex/shared$': '<rootDir>/../shared/src/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  }
};
