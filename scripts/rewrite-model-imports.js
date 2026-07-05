const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, '../backend/user/src'),
    path.join(__dirname, '../core/src'),
    path.join(__dirname, '../apps')
];

let filesAffected = 0;
let importsFound = 0;
const uniqueModels = new Set();
const isDryRun = process.argv.includes('--dry-run');

function processFile(filePath) {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    
    // Regex to match imports from @esparex/core/models/<ModelName>
    // Handles both default and named imports, single and multiline.
    // Example: import { User } from '@esparex/core/models/User';
    // Example: import User from '@esparex/core/models/User';
    // Example: import type { IUser } from '@esparex/core/models/User';
    
    // We'll use a simpler regex to just find the deep imports, 
    // parse out what they import, and replace them with a single consolidated import.
    
    const importRegex = /import\s+(type\s+)?([^'"]+)\s+from\s+['"]@esparex\/core\/models\/([^'"]+)['"];?/g;
    
    let match;
    let fileModified = false;
    let fileImports = 0;
    
    const replacements = [];
    const importedSymbols = [];
    const importedTypeSymbols = [];

    while ((match = importRegex.exec(originalContent)) !== null) {
        fileImports++;
        const isType = !!match[1];
        let imported = match[2].trim();
        const modelName = match[3].trim();
        
        uniqueModels.add(modelName);
        
        // Remove braces if it's `{ User }`
        if (imported.startsWith('{') && imported.endsWith('}')) {
            imported = imported.slice(1, -1).trim();
        }
        
        // Handle `default as X` or just `X`
        const symbols = imported.split(',').map(s => s.trim()).filter(Boolean);
        for (const sym of symbols) {
            if (isType) {
                importedTypeSymbols.push(sym);
            } else {
                importedSymbols.push(sym);
            }
        }
        
        replacements.push({
            start: match.index,
            end: match.index + match[0].length,
            match: match[0]
        });
    }

    if (fileImports > 0) {
        importsFound += fileImports;
        filesAffected++;
        
        if (!isDryRun) {
            // Reconstruct the file content by replacing all deep imports with an empty string,
            // then adding the consolidated import at the top (or where the first import was).
            let newContent = originalContent;
            
            // Reverse order to not mess up indices
            for (let i = replacements.length - 1; i >= 0; i--) {
                const rep = replacements[i];
                newContent = newContent.slice(0, rep.start) + newContent.slice(rep.end);
            }
            
            // Build the consolidated import
            let consolidatedImport = '';
            
            if (importedSymbols.length > 0) {
                // Deduplicate
                const uniqueSyms = [...new Set(importedSymbols)].join(', ');
                consolidatedImport += `import { ${uniqueSyms} } from '@esparex/core/models';\n`;
            }
            
            if (importedTypeSymbols.length > 0) {
                const uniqueTypeSyms = [...new Set(importedTypeSymbols)].join(', ');
                consolidatedImport += `import type { ${uniqueTypeSyms} } from '@esparex/core/models';\n`;
            }
            
            // Insert the consolidated import where the first import was found
            const firstImportStart = replacements[0].start;
            newContent = newContent.slice(0, firstImportStart) + consolidatedImport.trim() + newContent.slice(firstImportStart);
            
            // Clean up possible double newlines
            newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
            
            fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

console.log(`Starting scan in directories: ${targetDirs.join(', ')}`);
console.log(`Mode: ${isDryRun ? 'DRY-RUN' : 'WRITE'}\n`);

targetDirs.forEach(walkDir);

console.log('--- Migration Report ---');
console.log(`Files affected:    ${filesAffected}`);
console.log(`Import statements: ${importsFound}`);
console.log(`Unique models:     ${uniqueModels.size}`);
if (uniqueModels.size > 0) {
    console.log(`Models referenced: ${[...uniqueModels].join(', ')}`);
}

