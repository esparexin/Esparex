import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      // ─── SSOT UI Governance ────────────────────────────────────────────────
      // Only 3 canonical UI primitives are allowed from @/components/ui/:
      //   dialog  |  DataTable  |  StatusChip
      // Everything else (badge, button, table, input, select, textarea, etc.)
      // does NOT exist in this project — import from shadcn/Radix is FORBIDDEN.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/ui/*"],
              importNames: [],
              // Allow only the three canonical SSOT modules.
              // Any other @/components/ui/* import is a build-time error.
              message:
                "Only @/components/ui/dialog, @/components/ui/DataTable, and @/components/ui/StatusChip are approved SSOT primitives. Do not import other shadcn/Radix-style primitives.",
            },
          ],
        },
      ],
    },
  }
);
