const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');
const SEARCH_DIR = path.join(__dirname, '../backend/user/src');

const APPROVED_CONFIGS = new Set([
    'constants',
    'env',
    'featureFlags'
]);

const APPROVED_UTILS = new Set([
    'AppError',
    'CategoryQueryBuilder',
    'FeedVisibilityGuard',
    'adFilterHelper',
    'adminLogger',
    'aiSpamDetector',
    'appUrl',
    'auth',
    'businessHelpers',
    'businessSerializer',
    'businessStatus',
    'catalogShadowRead',
    'categoryCanonical',
    'contentHandler',
    'controllerUtils',
    'cookieHelper',
    'deviceFingerprint',
    'errorHelpers',
    'errorResponse',
    'imageProcessor',
    'immutableFieldErrors',
    'invoiceNumber',
    'listingTypeIntegrity',
    'logger',
    'originConfig',
    'phoneUtils',
    'requestParams',
    'resilience',
    'respond',
    'roleNormalization',
    'serialize',
    'smartAlertHelpers',
    'stringUtils',
    'systemConfigHelper'
]);

let filesModified = 0;
let importsRewritten = 0;

function rewriteImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Group 1: Namespace (utils|config)
    // Group 2: Module Name
    const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]@esparex\/core\/(utils|config)\/([^'"]+)['"];?/g;
    
    let match;
    const collectedUtils = new Set();
    const collectedConfigs = new Set();
    let newContent = content;
    let localHasChanges = false;

    while ((match = importRegex.exec(content)) !== null) {
        const importBody = match[1].trim();
        const namespace = match[2].trim();
        const moduleName = match[3].trim();
        
        // Skip unapproved modules
        if (namespace === 'utils' && !APPROVED_UTILS.has(moduleName)) continue;
        if (namespace === 'config' && !APPROVED_CONFIGS.has(moduleName)) continue;

        localHasChanges = true;
        importsRewritten++;

        // Remove old import
        newContent = newContent.replace(match[0], '');
        
        const targetSet = namespace === 'utils' ? collectedUtils : collectedConfigs;

        if (importBody.startsWith('{')) {
            const names = importBody.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
            names.forEach(n => targetSet.add(n));
        } else if (importBody.startsWith('*')) {
            console.warn(`Unsupported namespace import in ${filePath}: ${importBody}`);
        } else {
            targetSet.add(`${importBody === moduleName ? moduleName : `${moduleName} as ${importBody}`}`);
        }
    }

    if (localHasChanges) {
        newContent = newContent.replace(/\n{3,}/g, '\n\n');
        
        const insertBarrel = (namespace, collected) => {
            if (collected.size === 0) return;
            const existingRegex = new RegExp(`import\\s+{([^}]+)}\\s+from\\s+['"]@esparex\\/core\\/${namespace}['"];?`);
            const existingMatch = existingRegex.exec(newContent);
            
            if (existingMatch) {
                const existingNames = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
                existingNames.forEach(n => collected.add(n));
                const newImport = `import {\n    ${Array.from(collected).sort().join(',\n    ')}\n} from '@esparex/core/${namespace}';`;
                newContent = newContent.replace(existingMatch[0], newImport);
            } else {
                const newImport = `import {\n    ${Array.from(collected).sort().join(',\n    ')}\n} from '@esparex/core/${namespace}';`;
                const firstImportMatch = newContent.match(/^import\s+/m);
                if (firstImportMatch) {
                    const idx = newContent.indexOf(firstImportMatch[0]);
                    newContent = newContent.slice(0, idx) + newImport + '\n' + newContent.slice(idx);
                } else {
                    newContent = newImport + '\n' + newContent;
                }
            }
        };

        insertBarrel('utils', collectedUtils);
        insertBarrel('config', collectedConfigs);

        if (!isDryRun) {
            fs.writeFileSync(filePath, newContent);
        }
        filesModified++;
        console.log(`${isDryRun ? '[DRY RUN] ' : ''}Rewrote imports in ${filePath}`);
    }
}

function scanAndRewrite(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            scanAndRewrite(full);
        } else if (full.endsWith('.ts') || full.endsWith('.js')) {
            rewriteImportsInFile(full);
        }
    }
}

scanAndRewrite(SEARCH_DIR);
console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Rewrite complete.`);
console.log(`Files modified: ${filesModified}`);
console.log(`Imports rewritten: ${importsRewritten}`);
