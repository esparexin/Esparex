import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const esparexRules = require("./scripts/eslint-rules/index.js");

import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";

export default tseslint.config(
  // 1. Global Ignores
  {
    ignores: [
      "**/node_modules/**", 
      "**/dist/**", 
      "**/.next/**", 
      "**/out/**", 
      "**/public/**",
      "**/__tests__/**",
      "**/tests/**",
      "**/*.spec.ts",
      "**/*.test.ts"
    ]
  },

  // 2. Base Recommended Configs
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Global Quality & Governance (Applies to ALL JS/TS files)
  {
    files: ["**/*.{ts,tsx,js,cjs,mjs}"],
    plugins: {
      "unused-imports": unusedImports,
      "esparex": esparexRules,
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
      ],
      "esparex/no-status-mutation-outside-status-mutation-service": "error",
      "no-console": "warn",
    },
  },

  // 4. Scoped Type-Awareness (Enterprise Precision)
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./apps/web/tsconfig.json",
          "./backend/admin/tsconfig.json",
          "./backend/user/tsconfig.json",
          "./core/tsconfig.json",
          "./shared/tsconfig.json"
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // 5. Frontend Specific (Apps & Components)
  {
    files: ["apps/web/**/*.{ts,tsx}", "shared/components/**/*.{ts,tsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "error",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "@next/next/no-img-element": "off",
      "no-undef": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // 6. Backend & Node Specific (Backend, Core, Scripts)
  {
    files: [
      "backend/**/*.{ts,js,cjs,mjs}", 
      "core/**/*.{ts,js,cjs,mjs}", 
      "scripts/**/*.{ts,js,cjs,mjs}",
      "eslint.config.js"
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        Buffer: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        setImmediate: "readonly",
      },
    },
    rules: {
      "no-undef": "error",
    }
  },

  // 7. Neutral Shared Zone (Isomorphism Enforcement)
  {
    files: ["shared/**/*.{ts,js,cjs,mjs}"],
    rules: {
      "no-restricted-globals": ["error", "process", "window", "document"],
    },
    // Except for specific sub-directories like shared/components which are frontend-only
    // or shared/utils which might be isomorphic.
    // We already have a frontend-specific block for shared/components.
  },

  // 8. Prettier (Must be last)
  prettier
);
