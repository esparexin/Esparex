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
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.{js,cjs,mjs}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Buffer: "readonly",
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": "warn",
    }
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImports,
      "@next/next": nextPlugin,
      "esparex": esparexRules,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
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
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-namespace": "off",
      "no-console": "warn",
      "unused-imports/no-unused-imports": "warn",
      "esparex/no-status-mutation-outside-status-mutation-service": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);
