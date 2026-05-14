import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const queryServicePath = path.join(projectRoot, "core", "src", "services", "ListingModerationQueryService.ts");
const serializerPath = path.join(projectRoot, "core", "src", "controllers/admin/listingModerationSerializer.ts");

const failures = [];

function readFile(filePath) {
    if (!fs.existsSync(filePath)) {
        failures.push(`Missing expected file: ${path.relative(projectRoot, filePath)}`);
        return "";
    }
    return fs.readFileSync(filePath, "utf8");
}

function assertPattern(content, pattern, message) {
    if (!pattern.test(content)) {
        failures.push(message);
    }
}

const queryService = readFile(queryServicePath);
const serializer = readFile(serializerPath);

// MODERATION_STATUSES coverage
assertPattern(
    queryService,
    /LISTING_STATUS\.ACTIVE,/,
    'Moderation status SSOT: missing LISTING_STATUS.ACTIVE.'
);
assertPattern(
    queryService,
    /'approved',/,
    "Moderation status SSOT: missing 'approved' alias."
);

// Serializer coverage
assertPattern(
    serializer,
    /'active',/,
    "Moderation serializer: missing 'active' status coverage."
);
assertPattern(
    serializer,
    /'approved',/,
    "Moderation serializer: missing 'approved' status coverage."
);

// Serializer safety
assertPattern(
    serializer,
    /\/\/ Safe fallback for legacy rows missing listingType\n\s*return LISTING_TYPE\.AD/,
    "Moderation serializer: missing safe fallback for listingType."
);

if (failures.length > 0) {
    console.error("Moderation Status SSOT guard failed:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Moderation Status SSOT guard passed.");
