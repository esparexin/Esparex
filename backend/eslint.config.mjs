import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const esparexRules = require("../scripts/eslint-rules/index.js");

export default tseslint.config(
    // Base: non-type-aware recommended (applies to all files)
    ...tseslint.configs.recommended,
    {
        ignores: ["dist/**", "coverage/**"],
    },
    // ── Main source files: type-aware linting enabled ─────────────────────
    {
        files: ["src/**/*.ts"],
        ignores: ["src/**/*.spec.ts", "src/**/*.test.ts", "src/__tests__/**", "src/tests/**", "src/seeds/**"],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            "unused-imports": unusedImports,
            esparex: esparexRules,
        },
        rules: {
            // ── Graduated to error (0 violations) ─────────────────────────
            "@typescript-eslint/no-explicit-any": "error",

            // ── Type-safety rules (Track A) — warn while fixing ───────────
            "@typescript-eslint/no-unsafe-assignment": "warn",
            "@typescript-eslint/no-unsafe-call": "warn",
            "@typescript-eslint/no-unsafe-member-access": "warn",
            "@typescript-eslint/no-unsafe-return": "error",
            "@typescript-eslint/no-unsafe-argument": "warn",

            // ── Additional type-aware rules — warn while fixing ────────────
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/restrict-template-expressions": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-misused-promises": "error",
            "@typescript-eslint/no-unsafe-enum-comparison": "error",
            "@typescript-eslint/unbound-method": "error",
            "@typescript-eslint/prefer-promise-reject-errors": "error",

            // ── Disable rules that fire on intentional patterns ────────────
            "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/no-base-to-string": "off",

            // ── Governance phase — graduated to error (0 violations as of Track B) ─
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-empty-object-type": "error",
            "@typescript-eslint/no-require-imports": "error",
            "@typescript-eslint/no-unused-expressions": "error",
            "@typescript-eslint/no-namespace": "error",
            "@typescript-eslint/ban-ts-comment": "error",

            // Legacy unused vars/imports
            "unused-imports/no-unused-imports": "error",
            "unused-imports/no-unused-vars": "error",
            "esparex/no-status-mutation-outside-status-mutation-service": "error",

            "no-console": ["error", { "allow": ["warn", "error", "info"] }]
        }
    },
    // ── Test / spec files: no type-aware rules ────────────────────────────
    {
        files: ["src/**/*.spec.ts", "src/**/*.test.ts", "src/__tests__/**/*.ts", "src/tests/**"],
        plugins: {
            "unused-imports": unusedImports,
            esparex: esparexRules,
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "error",
            "@typescript-eslint/no-unused-vars": "off",
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": "warn",
        }
    }
);
