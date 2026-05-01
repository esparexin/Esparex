import tseslint from "typescript-eslint";
import unusedImports from "eslint-plugin-unused-imports";
import reactHooks from "eslint-plugin-react-hooks";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "dist/**"],
  },
  ...tseslint.configs.recommended,
  {
    plugins: {
      "unused-imports": unusedImports,
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "off",
      "unused-imports/no-unused-vars": "off",
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
              group: [
                "@/components/ui/*",
                "!@/components/ui/dialog",
                "!@/components/ui/DataTable",
                "!@/components/ui/StatusChip",
              ],
              message:
                "Only @/components/ui/dialog, @/components/ui/DataTable, and @/components/ui/StatusChip are approved SSOT primitives. Do not import other shadcn/Radix-style primitives.",
            },
          ],
        },
      ],
    },
  }
);
