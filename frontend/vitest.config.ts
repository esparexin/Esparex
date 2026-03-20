import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['tests/**', 'playwright-report/**', 'test-results/**'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'shared': path.resolve(__dirname, '../shared'),
        },
    },
});
