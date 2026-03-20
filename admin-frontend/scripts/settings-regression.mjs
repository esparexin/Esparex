import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pagePath = path.join(root, "src", "app", "(protected)", "settings", "page.tsx");
const apiPath = path.join(root, "src", "lib", "api", "systemConfig.ts");

const componentDir = path.join(root, "src", "app", "(protected)", "settings", "components");
const componentExpectations = [
    "PlatformSettings.tsx",
    "AdsSettings.tsx",
    "ModerationSettings.tsx",
    "UserSettings.tsx",
    "MessagingSettings.tsx",
    "PaymentSettings.tsx",
    "FraudSettings.tsx",
    "NotificationSettings.tsx",
    "SecuritySettings.tsx",
    "SearchSettings.tsx",
    "FeatureFlags.tsx",
];

const requiredTabs = [
    "platform",
    "ads",
    "moderation",
    "users",
    "messaging",
    "payments",
    "fraud",
    "notifications",
    "security",
    "search",
    "featureFlags",
];

const failures = [];

function read(filePath) {
    if (!fs.existsSync(filePath)) {
        failures.push(`Missing file: ${path.relative(root, filePath)}`);
        return "";
    }
    return fs.readFileSync(filePath, "utf8");
}

function assertPattern(content, pattern, message) {
    if (!pattern.test(content)) {
        failures.push(message);
    }
}

const page = read(pagePath);
const api = read(apiPath);

// API contract guard: settings updates must use PATCH.
assertPattern(
    api,
    /method:\s*"PATCH"/,
    "Settings API regression: updateSystemConfig must use PATCH /system/config."
);

// Page connector guards.
assertPattern(
    page,
    /import\s+\{\s*getSystemConfig,\s*updateSystemConfig\s*\}\s+from\s+"@\/lib\/api\/systemConfig"/,
    "Settings page regression: canonical systemConfig API connector import missing."
);
assertPattern(
    page,
    /const\s+\[activeTab,\s*setActiveTab\]\s*=\s*useState<SettingsTab>\("platform"\)/,
    "Settings page regression: default active tab should be platform."
);

for (const tab of requiredTabs) {
    assertPattern(
        page,
        new RegExp(`key:\\s*"${tab}"`),
        `Settings tabs regression: missing tab key "${tab}".`
    );
}

for (const file of componentExpectations) {
    const full = path.join(componentDir, file);
    const content = read(full);
    if (!content) continue;
    assertPattern(
        content,
        /onSave\(/,
        `Settings component regression: ${file} must call onSave(...).`
    );
}

if (failures.length > 0) {
    console.error("Settings regression guard failed:");
    for (const failure of failures) {
        console.error(`- ${failure}`);
    }
    process.exit(1);
}

console.log("Settings regression guard passed.");

