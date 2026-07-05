const glob = require('glob');
const fs = require('fs');

const isDryRun = process.argv.includes('--dry-run');

const files = glob.sync('backend/user/src/**/*.ts');
let totalRewrites = 0;
let filesModified = 0;
const servicesReferenced = new Set();
let filesWithDuplicates = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // First, find all deep imports for services to extract the service names
    const extractRegex = /import\s+({[^}]+}|\*\s+as\s+[a-zA-Z0-9_]+|[a-zA-Z0-9_]+(?:\s*,\s*{[^}]+})?)\s+from\s+['"]@esparex\/core\/services\/([^'"]+)['"]/g;
    let match;
    let fileMatchCount = 0;
    
    const importsToCollapse = [];
    
    while ((match = extractRegex.exec(content)) !== null) {
        fileMatchCount++;
        servicesReferenced.add(match[2]);
        importsToCollapse.push({
            fullMatch: match[0],
            importedSymbols: match[1],
            servicePath: match[2]
        });
    }

    if (fileMatchCount > 0) {
        totalRewrites += fileMatchCount;
        if (fileMatchCount > 1) {
            filesWithDuplicates++;
        }
        
        let newContent = content;
        
        // Remove old imports
        for (const imp of importsToCollapse) {
            newContent = newContent.replace(imp.fullMatch + ';', '');
            newContent = newContent.replace(imp.fullMatch, ''); // Without semicolon
        }
        
        // Remove empty lines left behind (2 or more empty lines to 1)
        newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        const symbolsToImport = new Set();
        const namespacesToImport = [];
        
        for (const imp of importsToCollapse) {
            const symbols = imp.importedSymbols.trim();
            const servicePath = imp.servicePath;
            
            if (symbols.startsWith('{')) {
                // Named imports: { foo, bar as baz }
                const inner = symbols.substring(1, symbols.length - 1);
                const parts = inner.split(',').map(s => s.trim()).filter(s => s);
                for (const part of parts) {
                    symbolsToImport.add(part);
                }
            } else if (symbols.startsWith('*')) {
                // Namespace imports: * as nsName
                namespacesToImport.push({ symbols, servicePath });
            } else if (symbols.includes(',')) {
                // Default and named: AdMutationService, { something }
                const parts = symbols.split(',');
                const defaultImport = parts[0].trim();
                
                if (servicePath.includes('CatalogOrchestrator')) {
                    symbolsToImport.add(defaultImport);
                } else {
                    namespacesToImport.push({ symbols: `* as ${defaultImport}`, servicePath });
                }
                
                const inner = parts[1].trim().substring(1, parts[1].trim().length - 1);
                const namedParts = inner.split(',').map(s => s.trim()).filter(s => s);
                for (const part of namedParts) {
                    symbolsToImport.add(part);
                }
            } else {
                // Just default import: AdMutationService
                if (servicePath.includes('CatalogOrchestrator')) {
                    symbolsToImport.add(symbols);
                } else {
                    namespacesToImport.push({ symbols: `* as ${symbols}`, servicePath });
                }
            }
        }
        
        const allNewImports = [];
        
        if (symbolsToImport.size > 0) {
            let namedImports = Array.from(symbolsToImport).join(', ');
            allNewImports.push(`import { ${namedImports} } from '@esparex/core/services';`);
        }
        
        for (const ns of namespacesToImport) {
            const nsName = ns.symbols.replace('* as ', '').trim();
            
            let baseName = ns.servicePath.split('/').pop();
            baseName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
            const PascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            
            allNewImports.push(`import { ${PascalName}_NS as ${nsName} } from '@esparex/core/services';`);
        }
        
        const finalImportBlock = allNewImports.join('\n');
        
        // Insert the new imports at the top of the file
        newContent = finalImportBlock + '\n\n' + newContent;

        if (!isDryRun && content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            filesModified++;
        } else if (isDryRun) {
            filesModified++;
        }
    }
}

if (isDryRun) {
    console.log('DRY RUN COMPLETE (no files changed)');
} else {
    console.log('REWRITE COMPLETE');
}
console.log(`Files mapped: ${filesModified}`);
console.log(`Total imports collapsed: ${totalRewrites}`);
console.log(`Distinct services referenced: ${servicesReferenced.size}`);
console.log(`Files with multiple imports collapsed: ${filesWithDuplicates}`);
