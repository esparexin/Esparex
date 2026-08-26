#!/usr/bin/env node

/**
 * Validation SSOT Governance Gate
 * 
 * Verifies that all mutation schemas across apps, core, and backend extend from
 * the canonical Single Source of Truth (@esparex/contracts).
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");

const targetAuditFiles = [
    {
        file: path.join(repoRoot, "core", "src", "validators", "business.validator.ts"),
        requiredImports: ["CreateBusinessPayloadSchema", "UpdateBusinessPayloadSchema", "@esparex/contracts"],
    },
    {
        file: path.join(repoRoot, "core", "src", "validators", "auth.validator.ts"),
        requiredImports: ["LoginPayloadSchema", "VerifyOtpPayloadSchema", "@esparex/contracts"],
    },
    {
        file: path.join(repoRoot, "apps", "web", "src", "schemas", "login.schema.ts"),
        requiredImports: ["authMobileSchema", "@esparex/contracts"],
    },
    {
        file: path.join(repoRoot, "apps", "admin", "src", "components", "plans", "planForm.schema.ts"),
        requiredImports: ["BasePlanPayloadSchema", "@esparex/contracts"],
    },
];

let violations = [];

for (const target of targetAuditFiles) {
    if (!fs.existsSync(target.file)) {
        violations.push(`Target file missing: ${path.relative(repoRoot, target.file)}`);
        continue;
    }

    const content = fs.readFileSync(target.file, "utf-8");
    for (const req of target.requiredImports) {
        if (!content.includes(req)) {
            violations.push(
                `Missing required SSOT reference "${req}" in ${path.relative(repoRoot, target.file)}`
            );
        }
    }
}

if (violations.length > 0) {
    console.error("❌ Validation SSOT Governance Gate Violation!");
    console.error("Validation schemas must import and extend canonical contracts from @esparex/contracts.\n");
    for (const v of violations) {
        console.error(`- ${v}`);
    }
    process.exit(1);
} else {
    console.log("✅ Validation SSOT Governance Gate Passed — All schemas extend @esparex/contracts.");
}
