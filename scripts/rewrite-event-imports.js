const fs = require('fs');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');
const SEARCH_DIR = path.join(__dirname, '../backend/user/src');
const REPORT_PATH = path.join(__dirname, '../docs/cleanup/events-migration-audit.md');

// Only run if Evidence Gate found > 0
if (fs.existsSync(REPORT_PATH)) {
    const report = fs.readFileSync(REPORT_PATH, 'utf8');
    const match = report.match(/Deep imports found:\s*(\d+)/i) || report.match(/Total deep imports:\s*\*\*\s*(\d+)/i) || report.match(/Total deep imports:\s*(\d+)/i);
    const count = match ? parseInt(match[1], 10) : 0;
    if (count === 0) {
        console.log('Deep imports found: 0\n→ Rewrite script executes in no-op mode');
        process.exit(0);
    }
}

// Below is the migration logic which would run if > 0.
console.log('Deep imports found: >0\n→ Rewrite script performs migration');

function rewriteImportsInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Collect all imports for @esparex/core/events/*
    const importRegex = /import\s+({[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]@esparex\/core\/events\/([^'"]+)['"];?/g;
    
    let match;
    const collectedImports = new Set();
    let newContent = content;

    while ((match = importRegex.exec(content)) !== null) {
        hasChanges = true;
        const importBody = match[1].trim();
        const moduleName = match[2].trim();
        
        // Remove old import
        newContent = newContent.replace(match[0], '');
        
        // Parse the import body
        if (importBody.startsWith('{')) {
            // Named imports
            const names = importBody.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
            names.forEach(n => collectedImports.add(n));
        } else if (importBody.startsWith('*')) {
            // Namespace import, rewrite unsupported
            console.warn(`Unsupported namespace import in ${filePath}: ${importBody}`);
        } else {
            // Default import, convert to named import based on module name
            collectedImports.add(`${moduleName} as ${importBody}`);
        }
    }

    if (hasChanges) {
        // Strip duplicate newlines where imports used to be
        newContent = newContent.replace(/\n{3,}/g, '\n\n');
        
        // Find existing @esparex/core/events import
        const existingBarrelRegex = /import\s+{([^}]+)}\s+from\s+['"]@esparex\/core\/events['"];?/;
        const existingMatch = existingBarrelRegex.exec(newContent);
        
        if (existingMatch) {
            const existingNames = existingMatch[1].split(',').map(s => s.trim()).filter(Boolean);
            existingNames.forEach(n => collectedImports.add(n));
            
            const newImport = `import {\n    ${Array.from(collectedImports).join(',\n    ')}\n} from '@esparex/core/events';`;
            newContent = newContent.replace(existingMatch[0], newImport);
        } else {
            const newImport = `import {\n    ${Array.from(collectedImports).join(',\n    ')}\n} from '@esparex/core/events';\n`;
            
            // Insert at the top of the file (after any leading comments or other imports)
            // A simple approach is finding the last import statement and appending it after.
            const lastImportIndex = newContent.lastIndexOf('import ');
            if (lastImportIndex !== -1) {
                const endOfLastImport = newContent.indexOf('\n', lastImportIndex);
                newContent = newContent.slice(0, endOfLastImport + 1) + newImport + newContent.slice(endOfLastImport + 1);
            } else {
                newContent = newImport + newContent;
            }
        }
        
        if (!isDryRun) {
            fs.writeFileSync(filePath, newContent);
        }
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
console.log(`${isDryRun ? '[DRY RUN] ' : ''}Rewrite complete.`);
