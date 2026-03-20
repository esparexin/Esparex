const fs = require('fs');
const path = require('path');

if (process.env.ALLOW_MANUAL_SCRIPT !== 'true') {
    console.error('Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/verify_toast_fixes.js');
    process.exit(1);
}

const ROOT_DIR = path.join(__dirname, '../../frontend/src');

// Counters
const stats = {
    rawErrorExposure: 0,
    nativeAlerts: 0,
    directSonnerImports: 0,
    directToastCalls: 0,
    filesChecked: 0,
    allowedSonnerImports: 0
};

// Files allowed to import sonner directly
const ALLOWED_SONNER_FILES = [
    'notify.ts',
    'sonner.tsx',
    'layout.tsx'
    // utils/toast.ts was deleted
];

function scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    stats.filesChecked++;

    // 1. Check for raw error exposure: toast.error(e.message) or notify.error(e.message)
    // We want to forbid .message access inside the call
    if (content.match(/notify\.error\(\s*[^)]+\.message/)) {
        console.log(`❌ Raw error exposure in: ${fileName}`);
        stats.rawErrorExposure++;
    }
    if (content.match(/toast\.error\(\s*[^)]+\.message/)) {
        console.log(`❌ Raw error exposure (toast) in: ${fileName}`);
        stats.rawErrorExposure++;
    }

    // 2. Check for native alerts
    if (content.match(/alert\(/) || content.match(/window\.alert\(/)) {
        // Exclude comments is hard with regex, but let's check basic
        // We'll trust the grep mostly, this is a double check
        // Ignore if it looks like a component named Alert
        if (!content.match(/<Alert/)) {
            // Only count if it looks like function call
            const matches = content.match(/(\w+\.)?alert\(/g);
            if (matches) {
                matches.forEach(m => {
                    if (m === 'alert(' || m === 'window.alert(') {
                        console.log(`❌ Native alert in: ${fileName}`);
                        stats.nativeAlerts++;
                    }
                });
            }
        }
    }

    // 3. Check for Direct Sonner Imports
    if (content.includes('from "sonner"') || content.includes("from 'sonner'")) {
        if (!ALLOWED_SONNER_FILES.includes(fileName)) {
            console.log(`❌ Direct sonner import in: ${fileName}`);
            stats.directSonnerImports++;
        } else {
            stats.allowedSonnerImports++;
        }
    }

    // 4. Check for direct toast.error/success calls (should use notify)
    // If we imported notify, we shouldn't use toast. unless it's the notify file itself
    if (fileName !== 'notify.ts' && fileName !== 'utils/toast.ts') {
        if (content.match(/toast\.(success|error|info|warning|loading|promise)/)) {
            console.log(`❌ Direct toast usage in: ${fileName}`);
            stats.directToastCalls++;
        }
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            scanFile(fullPath);
        }
    });
}

console.log("🔍 Starting Verification Scan...");
traverseDir(ROOT_DIR);
console.log("\n📊 Scan Results:");
console.log(JSON.stringify(stats, null, 2));

if (stats.rawErrorExposure === 0 && stats.nativeAlerts === 0 && stats.directSonnerImports === 0) {
    console.log("\n✅ VERIFICATION PASSED");
    process.exit(0);
} else {
    console.log("\n❌ VERIFICATION FAILED");
    process.exit(1);
}
