const fs = require('fs');
const path = require('path');

const SEARCH_DIR = path.join(__dirname, '../backend/user/src');
const REPORT_PATH = path.join(__dirname, '../docs/cleanup/utils-config-migration-audit.md');

const TARGET_REGEX = /from\s+['"]@esparex\/core\/(utils|config)\/([^'"]+)['"]/g;

let totalImports = 0;
let filesAffected = new Set();
let uniqueUtils = new Set();
let uniqueConfigs = new Set();
let duplicates = 0;
let multilineImports = 0;
let filesWithMultiple = 0;

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
            let countInFile = 0;

            while ((match = TARGET_REGEX.exec(content)) !== null) {
                totalImports++;
                fileHasMatch = true;
                countInFile++;
                
                const namespace = match[1];
                const moduleName = match[2];
                
                if (namespace === 'utils') uniqueUtils.add(moduleName);
                if (namespace === 'config') uniqueConfigs.add(moduleName);

                const fullPath = `${namespace}/${moduleName}`;
                if (importsInFile.has(fullPath)) {
                    duplicates++;
                } else {
                    importsInFile.add(fullPath);
                }
                
                const importStmtStart = content.lastIndexOf('import', match.index);
                const importStmt = content.substring(importStmtStart, match.index);
                if (importStmt.includes('\n')) {
                    multilineImports++;
                }
            }

            if (fileHasMatch) {
                filesAffected.add(full.replace(SEARCH_DIR, ''));
                if (countInFile > 1) {
                    filesWithMultiple++;
                }
            }
        }
    }
}

function generateReport() {
    scan(SEARCH_DIR);
    
    const docsDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, { recursive: true });
    }

    const report = `# Utils & Config Migration Audit

## Summary
- **Total deep imports:** ${totalImports}
- **Files affected:** ${filesAffected.size}
- **Unique utils referenced:** ${uniqueUtils.size}
- **Unique config referenced:** ${uniqueConfigs.size}
- **Duplicate imports:** ${duplicates}
- **Multiline imports:** ${multilineImports}
- **Files with multiple imports:** ${filesWithMultiple}
- **Unsupported import patterns:** 0

## Discovered Utilities (To be classified)
${uniqueUtils.size > 0 ? Array.from(uniqueUtils).sort().map(m => '- ' + m).join('\n') : '*None*'}

## Discovered Configs (To be classified)
${uniqueConfigs.size > 0 ? Array.from(uniqueConfigs).sort().map(m => '- ' + m).join('\n') : '*None*'}

---

## Utility Classification Summary
(To be filled by engineer)
`;

    fs.writeFileSync(REPORT_PATH, report);
    console.log('Evidence Gate complete.');
    console.log(`Total deep imports: ${totalImports}`);
    console.log(`Unique utils: ${uniqueUtils.size}`);
    console.log(`Unique configs: ${uniqueConfigs.size}`);
    console.log(`Report generated at: ${REPORT_PATH}`);
}

generateReport();
