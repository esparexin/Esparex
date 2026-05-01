#!/usr/bin/env node
/**
 * admin-ui-guard.mjs
 * Pre-commit / CI guard — blocks shadcn-style UI primitive imports that do
 * NOT exist in the Esparex admin-frontend SSOT design system.
 *
 * Usage (package.json scripts):
 *   "guard:ui": "node scripts/admin-ui-guard.mjs"
 *
 * Allowed @/components/ui/* imports:
 *   dialog | DataTable | StatusChip
 *
 * All others are forbidden and will cause this script to exit(1).
 */

import { execSync } from "child_process";

const FORBIDDEN = [
    "@/components/ui/badge",
    "@/components/ui/button",
    "@/components/ui/table",
    "@/components/ui/input",
    "@/components/ui/select",
    "@/components/ui/textarea",
    "@/components/ui/dropdown",
    "@/components/ui/toast",
    "@/components/ui/checkbox",
    "@/components/ui/radio",
    "@/components/ui/slider",
    "@/components/ui/switch",
    "@/components/ui/tabs",
    "@/components/ui/card",
    "@/components/ui/separator",
    "@/components/ui/popover",
    "@/components/ui/tooltip",
];

let violations = 0;

for (const pattern of FORBIDDEN) {
    try {
        const result = execSync(
            `grep -rn "${pattern}" src --include="*.ts" --include="*.tsx"`,
            { encoding: "utf8" }
        ).trim();

        if (result) {
            console.error(`\n🚫 FORBIDDEN UI IMPORT: "${pattern}"`);
            console.error("─".repeat(60));
            console.error(result);
            violations++;
        }
    } catch {
        // grep exits 1 when no match found — that is the desired outcome.
    }
}

if (violations > 0) {
    console.error(
        `\n❌ UI Guard failed: ${violations} forbidden import pattern(s) detected.`
    );
    console.error(
        "   Admin-frontend SSOT primitives: dialog | DataTable | StatusChip"
    );
    console.error(
        "   Replace forbidden imports with inline HTML + Tailwind classes.\n"
    );
    process.exit(1);
} else {
    console.log("✅ UI Guard passed — no forbidden UI imports found.");
}
