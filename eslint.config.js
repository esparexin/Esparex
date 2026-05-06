import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
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
      "**/*.test.ts",
      "**/*.d.ts"
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
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      }
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
      "no-undef": "error",
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@esparex/shared/*", "../shared/*", "**/shared/src/*"],
              "message": "Please use the clean '@esparex/shared' entry point instead of internal paths."
            }
          ]
        }
      ],
    },
  },

  // 4. Disable no-undef for TypeScript (TS Compiler handles this)
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "no-undef": "off"
    }
  },



  // 5. Frontend Specific (Apps & Components)
  {
    files: ["apps/**/*.{ts,tsx}", "shared/components/**/*.{ts,tsx}"],
    plugins: {
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node, // Next.js is SSR, needs Node globals too
        React: "readonly", // Modern React/Next.js
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
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },

  // 6. Backend & Node Specific (Backend, Core, Scripts)
  // 6. Backend & Node Specific (Backend, Core, Scripts)
  {
    files: [
      "backend/**/*.{ts,js,cjs,mjs,mongosh.js}", 
      "core/**/*.{ts,js,cjs,mjs,mongosh.js}", 
      "scripts/**/*.{ts,js,cjs,mjs,mongosh.js}",
      "eslint.config.js"
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off", // Scripts usually need console
    }
  },

  // 7. Neutral Shared Zone (Isomorphism Enforcement)
  {
    files: ["shared/**/*.{ts,js,cjs,mjs}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      }
    },
    rules: {
      // Isomorphism: prefer not using process/window directly in shared code
      // but if we do, it must be guarded. For now, we allow them as globals
      // but we could add restrictions later.
      "no-undef": "error",
    },
  },

  // 8. MongoDB Shell (Migration Scripts)
  {
    files: ["**/*.mongosh.js"],
    languageOptions: {
      globals: {
        db: "readonly",
        print: "readonly",
        printjson: "readonly",
        ObjectId: "readonly",
        ISODate: "readonly",
        UUID: "readonly",
        sleep: "readonly",
        quit: "readonly",
        sh: "readonly",
        rs: "readonly",
      }
    },
    rules: {
      "no-undef": "error",
      "no-console": "off",
    }
  },

  // 9. Scripts and Configs (Allow console)
  {
    files: ["**/scripts/**/*.{js,ts}", "**/*.cjs", "**/*.mjs"],
    rules: {
      "no-console": "off"
    }
  },

  // 10. Prettier (Must be last)
  prettier
);
