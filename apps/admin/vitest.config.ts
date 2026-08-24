import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        environment: "node",
        include: ["src/__tests__/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["tests/**", "playwright-report/**", "test-results/**"],
    },
    resolve: {
        alias: {
            "@": resolve("./src"),
            "@esparex/shared": resolve("../../shared/src"),
            "@esparex/contracts": resolve("../../packages/contracts/src"),
            "@esparex/ui": resolve("../../packages/ui/src"),
            "@esparex/design-tokens": resolve("../../packages/design-tokens/src"),
        },
    },
});
