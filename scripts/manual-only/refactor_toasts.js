const fs = require('fs');
const path = require('path');

if (process.env.ALLOW_MANUAL_SCRIPT !== 'true') {
    console.error('Blocked: set ALLOW_MANUAL_SCRIPT=true to run scripts/manual-only/refactor_toasts.js');
    process.exit(1);
}

const TARGET_DIR = path.join(__dirname, '../../frontend/src');
const NOTIFY_IMPORT = 'import { notify } from "@/lib/notify";';

// Regex Patterns using constructor to avoid delimiter issues
const TOAST_IMPORT_REGEX = new RegExp('import\\s+{?.*toast.*}?\\s+from\\s+[\'"](sonner|@/utils/toast)[\'"];?', 'g');
const NOTIFY_IMPORT_REGEX = new RegExp('import { notify } from "@/lib/notify";', 'g');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                // Exclude the notify.ts file itself, toast.ts and errorMapper
                if (!file.endsWith('notify.ts') && !file.endsWith('toast.ts') && !file.endsWith('errorMapper.ts')) {
                    arrayOfFiles.push(path.join(dirPath, "/", file));
                }
            }
        }
    });

    return arrayOfFiles;
}

const files = getAllFiles(TARGET_DIR);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // 1. Check if file uses toast
    if (!content.includes('toast.') && !content.match(TOAST_IMPORT_REGEX)) {
        return;
    }

    // 2. Replace Imports
    if (content.match(TOAST_IMPORT_REGEX)) {
        content = content.replace(TOAST_IMPORT_REGEX, NOTIFY_IMPORT);
    }

    // 3. Replace Usages
    content = content.replace(/toast\.success\(/g, 'notify.success(');
    content = content.replace(/toast\.info\(/g, 'notify.info(');
    content = content.replace(/toast\.warning\(/g, 'notify.warning(');
    content = content.replace(/toast\.dismiss\(/g, 'notify.dismiss(');
    content = content.replace(/toast\.loading\(/g, 'notify.info(');
    content = content.replace(/toast\.promise\(/g, 'notify.promise(');

    // 4. Critical: Replace toast.error and remove raw error.message
    // Pattern 1: toast.error(error.message) -> notify.error(error)
    content = content.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.message\s*\)/g, 'notify.error($1)');

    // Pattern 2: toast.error(error.message, ...) -> notify.error(error, ...)
    content = content.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\.message\s*,\s*/g, 'notify.error($1, ');

    // Pattern 3: toast.error(err instanceof Error ? err.message : "...") -> notify.error(err, "...")
    content = content.replace(/toast\.error\(\s*([a-zA-Z0-9_]+)\s+instanceof\s+Error\s*\?\s*\1\.message\s*:\s*/g, 'notify.error($1, ');

    // Pattern 4: Generic toast.error -> notify.error
    content = content.replace(/toast\.error\(/g, 'notify.error(');

    // 5. Native Alert Replacement
    content = content.replace(/alert\(/g, 'notify.warning(');
    content = content.replace(/window\.alert\(/g, 'notify.warning(');

    // 6. Fix any double imports or issues
    // Check if we need to add import if we replaced usages but import wasn't matched
    // Or remove duplicates

    const notifyMatches = content.match(NOTIFY_IMPORT_REGEX) || [];

    if (notifyMatches.length > 1) {
        // Too many imports, deduplicate
        content = content.replace(NOTIFY_IMPORT_REGEX, '');
        // Add one back at the top (simple heuristic: after first line or similar, but let's just prepend if it was there)
        // Actually, safest is to find where imports are.
        // Let's rely on the previous logic: if we replaced existing import, it's there. 
        // If we have duplicates, we remove all and add one.
        const lastImport = content.lastIndexOf('import ');
        if (lastImport !== -1) {
            const endOfImport = content.indexOf('\n', lastImport);
            content = content.slice(0, endOfImport + 1) + NOTIFY_IMPORT + '\n' + content.slice(endOfImport + 1);
        } else {
            content = NOTIFY_IMPORT + '\n' + content;
        }
    } else if (notifyMatches.length === 0 && content.includes('notify.')) {
        // Usage present but no import
        const lastImport = content.lastIndexOf('import ');
        if (lastImport !== -1) {
            const endOfImport = content.indexOf('\n', lastImport);
            content = content.slice(0, endOfImport + 1) + NOTIFY_IMPORT + '\n' + content.slice(endOfImport + 1);
        } else {
            content = NOTIFY_IMPORT + '\n' + content;
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        modifiedCount++;
        console.log(`Modified: ${file}`);
    }
});

console.log(`Total files modified: ${modifiedCount}`);
