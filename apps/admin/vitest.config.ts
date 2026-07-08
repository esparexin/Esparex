import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['tests/**', 'playwright-report/**', 'test-results/**'],
        coverage: {
            provider: 'v8',
            thresholds: {
                statements: 50,
                branches: 50,
                functions: 50,
                lines: 50,
            }
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@shared': path.resolve(__dirname, '../../shared/src'),
            '@esparex/shared': path.resolve(__dirname, '../../shared/src'),
        },
    },
});
