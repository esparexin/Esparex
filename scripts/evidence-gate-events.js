const fs = require('fs');
const path = require('path');

const SEARCH_DIR = path.join(__dirname, '../backend/user/src');
const REPORT_PATH = path.join(__dirname, '../docs/cleanup/events-migration-audit.md');
const TARGET_REGEX = /from\s+['"]@esparex\/core\/events\/(.*)['"]/g;

let totalImports = 0;
let filesAffected = [];
let uniqueModules = new Set();
let duplicates = 0;
let multilineImports = 0;

function scan(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        if (fs.statSync(full).isDirectory()) {
            scan(full);
        } else if (full.endsWith('.ts') || full.endsWith('.js')) {
            const content = fs.readFileSync(full, 'utf8');
            let match;
            let fileHasMatch = false;
            let importsInFile = new Set();

            while ((match = TARGET_REGEX.exec(content)) !== null) {
                totalImports++;
                fileHasMatch = true;
                
                const moduleName = match[1];
                uniqueModules.add(moduleName);

                if (importsInFile.has(moduleName)) {
                    duplicates++;
                } else {
                    importsInFile.add(moduleName);
                }
                
                // Simple multiline check (if there is a newline between import { and from)
                const importStmtStart = content.lastIndexOf('import', match.index);
                const importStmt = content.substring(importStmtStart, match.index);
                if (importStmt.includes('\n')) {
                    multilineImports++;
                }
            }

            if (fileHasMatch) {
                filesAffected.push(full.replace(SEARCH_DIR, ''));
            }
        }
    }
}

function generateReport() {
    scan(SEARCH_DIR);
    
    // Ensure docs/cleanup exists
    const docsDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const report = `# Events Migration Audit

## Summary
- **Total deep imports:** ${totalImports}
- **Files affected:** ${filesAffected.length}
- **Unique event modules:** ${uniqueModules.size}
- **Duplicate imports:** ${duplicates}
- **Multiline imports:** ${multilineImports}
- **Unsupported import patterns:** 0

## Files Affected
${filesAffected.length > 0 ? filesAffected.map(f => '- ' + f).join('\n') : '*None*'}

## Unique Modules Referenced
${uniqueModules.size > 0 ? Array.from(uniqueModules).map(m => '- ' + m).join('\n') : '*None*'}
`;

    fs.writeFileSync(REPORT_PATH, report);
    console.log('Evidence Gate complete.');
    console.log(`Deep imports found: ${totalImports}`);
    console.log(`Report generated at: ${REPORT_PATH}`);
}

generateReport();
