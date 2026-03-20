import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const esparexRules = require("../scripts/eslint-rules/index.js");

export default tseslint.config(
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**", "coverage/**"],
    },
    {
        plugins: {
            "unused-imports": unusedImports,
            esparex: esparexRules,
        },
        rules: {
            // Downgraded to warnings to handle massive legacy debt (2,900+ issues)
            // This allows the pre-commit guards to become active today.
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-empty-object-type": "warn",
            "@typescript-eslint/no-require-imports": "warn",
            "@typescript-eslint/no-unused-expressions": "warn",
            "@typescript-eslint/no-namespace": "warn",
            "@typescript-eslint/ban-ts-comment": "warn",

            // Legacy unused vars/imports - Downgraded to warn for the "Governance Phase"
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": "warn",
            "esparex/no-status-mutation-outside-status-mutation-service": "error",

            "no-console": [
                "warn",
                {
                    "allow": ["warn", "error", "info"]
                }
            ]
        }
    }
);
