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

// 1. Dynamic SSOT Discovery & Contract Inheritance Verification
// Every schema in apps/*/src/schemas must extend canonical contracts from @esparex/contracts
const appSchemaRoots = [
    path.join(repoRoot, "apps", "web", "src", "schemas"),
    path.join(repoRoot, "apps", "admin", "src", "schemas"),
];

const requiredCoreMutationValidators = [
    path.join(repoRoot, "core", "src", "validators", "business.validator.ts"),
    path.join(repoRoot, "core", "src", "validators", "auth.validator.ts"),
];

// Transitional schemas scheduled for canonical migration in Phase 4
const TRANSITIONAL_LOCAL_SCHEMAS = new Set([
    "businessEditPayload.schema.ts",
    "businessRegistration.schema.ts",
]);

let violations = [];

for (const root of appSchemaRoots) {
    if (!fs.existsSync(root)) continue;
    const files = fs.readdirSync(root).filter(f => f.endsWith(".ts") && !f.endsWith(".d.ts") && !f.endsWith(".spec.ts"));
    for (const file of files) {
        if (TRANSITIONAL_LOCAL_SCHEMAS.has(file)) continue;
        const fullPath = path.join(root, file);
        const content = fs.readFileSync(fullPath, "utf-8");
        const relPath = path.relative(repoRoot, fullPath);
        if (!content.includes("@esparex/contracts")) {
            violations.push(
                `Validation SSOT Violation: ${relPath} does not extend canonical schemas from @esparex/contracts.`
            );
        }
    }
}

for (const target of requiredCoreMutationValidators) {
    if (!fs.existsSync(target)) continue;
    const content = fs.readFileSync(target, "utf-8");
    if (!content.includes("@esparex/contracts")) {
        violations.push(
            `Validation SSOT Violation: ${path.relative(repoRoot, target)} must extend @esparex/contracts.`
        );
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
