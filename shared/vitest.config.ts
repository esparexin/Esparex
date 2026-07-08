import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    },
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './src'),
            '@esparex/shared': path.resolve(__dirname, './src'),
        },
    },
});
