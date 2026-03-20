import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const moderationRowActionsPath = path.join(projectRoot, "src", "components", "moderation", "ModerationRowActions.tsx");
const moderationTypesPath = path.join(projectRoot, "src", "components", "moderation", "moderationTypes.ts");
const moderationApiPath = path.join(projectRoot, "src", "lib", "api", "moderation.ts");
const moderationHubPath = path.join(projectRoot, "src", "app", "(protected)", "moderation", "ModerationHub.tsx");
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

const rowActions = readFile(moderationRowActionsPath);
const moderationTypes = readFile(moderationTypesPath);
const moderationApi = readFile(moderationApiPath);
const moderationHub = readFile(moderationHubPath);

// Action visibility regression guards
assertPattern(
    rowActions,
    /const showApprove = status === "pending";/,
    'ModerationRowActions regression: pending -> approve action mapping changed.'
);
assertPattern(
    rowActions,
    /const showReject = status === "pending";/,
    'ModerationRowActions regression: pending -> reject action mapping changed.'
);
assertPattern(
    rowActions,
    /const showDeactivate = status === "pending" \|\| status === "active";/,
    'ModerationRowActions regression: deactivate visibility mapping changed.'
);
assertPattern(
    rowActions,
    /const showActivate = status === "deactivated";/,
    'ModerationRowActions regression: deactivated -> activate mapping changed.'
);
assertPattern(
    rowActions,
    /const showDelete = status === "active" \|\| status === "deactivated" \|\| status === "rejected";/,
    'ModerationRowActions regression: delete visibility mapping changed.'
);
assertPattern(
    rowActions,
    /const showBlockSeller = status === "active" && Boolean\(onBlockSeller\);/,
    'ModerationRowActions regression: block seller visibility mapping changed.'
);

// "All status" behavior regression guards
assertPattern(
    moderationTypes,
    /status:\s*"all"\s*\|\s*ModerationStatus;/,
    'Moderation filters regression: "all" is no longer part of status filter union.'
);
assertPattern(
    moderationTypes,
    /status:\s*"all",/,
    'Moderation filters regression: DEFAULT_FILTERS.status is not "all".'
);
assertPattern(
    moderationApi,
    /if \(filters\.status !== "all"\) params\.set\("status", filters\.status\);/,
    'Moderation API regression: status parameter should be omitted for "all".'
);
assertPattern(
    moderationHub,
    /const allowed = new Set\(\["pending", "active", "rejected", "deactivated", "sold", "expired", "all"\]\);/,
    'Moderation hub regression: query-param allowed status set changed unexpectedly.'
);

if (failures.length > 0) {
    console.error("Moderation regression guard failed:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Moderation regression guard passed.");
