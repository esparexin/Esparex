import nextConfig from "eslint-config-next";
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
      "**/*.test.ts",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs"
    ]
  },
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "unused-imports": unusedImports,
      "@next/next": nextPlugin,
      "esparex": esparexRules,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-namespace": "off",
      "no-console": "off",
      "unused-imports/no-unused-imports": "off",
      "esparex/no-status-mutation-outside-status-mutation-service": "off",
      "no-undef": "off"
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);
