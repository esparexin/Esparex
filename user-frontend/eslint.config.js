import next from "eslint-config-next";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";

const config = [
    // Next.js recommended config
    {
        ignores: [".next/*", "node_modules/*"]
    },
    ...next,
    // Custom Governance & Fixes
    {
        plugins: {
            "unused-imports": unusedImports,
            "react-hooks": reactHooks,
            "@typescript-eslint": tseslint.plugin,
            "next": nextPlugin,
        },
        rules: {
            // ─── React Hooks ─────────────────────────────────────────────────────────
            // Exhaustive deps at error level prevents missing or wrong dependencies.
            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "error",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": "off",
            "react/no-unescaped-entities": "off",
            "@next/next/no-img-element": "off",
            "next/no-img-element": "warn",
            "react-hooks/set-state-in-effect": "warn",
            "react-hooks/immutability": "off",
            "react-hooks/purity": "off",
            "react-hooks/static-components": "off",
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    "vars": "all",
                    "varsIgnorePattern": "^_",
                    "args": "after-used",
                    "argsIgnorePattern": "^_"
                }
            ],
            // GOVERNANCE: Downgraded to WARN for legacy compatibility
            "no-restricted-syntax": [
                "warn",
                {
                    "selector": "ExpressionStatement[expression.callee.object.name='router'][expression.callee.property.name=/^(push|replace)$/]",
                    "message": "❌ Direct 'router.push/replace' in render body is dangerous. Wrap in 'useEffect' or event handler."
                }
            ]
        }
    }
];

export default config;
