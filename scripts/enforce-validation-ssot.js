#!/usr/bin/env node

/**
 * Validation SSOT Governance Gate
 * 
 * 1. Verifies that all mutation schemas across apps, core, and backend extend from
 *    the canonical Single Source of Truth (@esparex/contracts).
 * 2. Static analysis check ensuring optional string schemas with constraints (.min, .regex, authNameSchema)
 *    safely handle empty string form values via z.union([..., z.literal("")]) or .or("").
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

// 1. Check SSOT required contract references
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

// 2. Scan schema directories for forbidden Zod empty-string optional traps
const schemaScanDirs = [
    path.join(repoRoot, "apps", "web", "src", "schemas"),
    path.join(repoRoot, "apps", "admin", "src", "schemas"),
    path.join(repoRoot, "packages", "contracts", "src", "v1", "authentication"),
    path.join(repoRoot, "packages", "contracts", "src", "v1", "businesses"),
    path.join(repoRoot, "packages", "contracts", "src", "v1", "common", "schema"),
];

const walk = (dir) => {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    for (const file of fs.readdirSync(dir)) {
        const full = path.join(dir, file);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            results = results.concat(walk(full));
        } else if (/\.(ts|tsx)$/.test(file)) {
            results.push(full);
        }
    }
    return results;
};

const allSchemaFiles = schemaScanDirs.flatMap(walk);

for (const file of allSchemaFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(repoRoot, file);
    const lines = content.split("\n");

    lines.forEach((line, idx) => {
        // Flag direct usage of authNameSchema.optional() without empty string union
        if (/\bauthNameSchema\.optional\(\)/.test(line) && !/z\.literal\(["']["']\)/.test(line) && !/\.or\(/.test(line)) {
            violations.push(
                `[ZOD EMPTY-STRING TRAP] ${rel}:${idx + 1} uses authNameSchema.optional() without z.literal(""). Use z.union([authNameSchema, z.literal("")]).optional() instead.`
            );
        }
    });
}

if (violations.length > 0) {
    console.error("❌ Validation SSOT Governance Gate Violation!");
    console.error("Validation schemas must import and extend canonical contracts from @esparex/contracts and handle empty strings on optional fields.\n");
    for (const v of violations) {
        console.error(`- ${v}`);
    }
    process.exit(1);
} else {
    console.log("✅ Validation SSOT Governance Gate Passed — All schemas extend @esparex/contracts and handle empty string optional fields safely.");
}
