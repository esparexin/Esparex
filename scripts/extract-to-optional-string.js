const fs = require('fs');
const path = require('path');

const sharedPath = path.join(process.cwd(), 'backend/admin/src/controllers/catalog/shared.ts');
let sharedContent = fs.readFileSync(sharedPath, 'utf8');

const toOptionalStringCode = `
export const toOptionalString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || undefined;
    }
    if (value && typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
        const stringValue = (value as { toString: () => string }).toString().trim();
        return stringValue && stringValue !== '[object Object]' ? stringValue : undefined;
    }
    return undefined;
};
`;

if (!sharedContent.includes('toOptionalString')) {
    sharedContent += toOptionalStringCode;
    fs.writeFileSync(sharedPath, sharedContent);
}

const controllers = ['catalogReferenceController.ts', 'catalogSparePartController.ts', 'catalogBrandModelController.ts'];
for (const file of controllers) {
    const fullPath = path.join(process.cwd(), 'backend/admin/src/controllers/catalog', file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove the function definition
    content = content.replace(/const toOptionalString = \(value: unknown\): string \| undefined => \{[\s\S]*?\n\};\n/g, '');
    
    // Import it if not already imported
    if (!content.includes('toOptionalString') || !content.includes('import {') || !content.match(/import\s+\{.*toOptionalString.*?\}\s+from\s+['"]\.\/shared['"]/)) {
        // Add to existing shared import
        content = content.replace(/(import \{[^}]*?)( }\s+from\s+['"]\.\/shared['"])/, '$1, toOptionalString$2');
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`Extracted toOptionalString in ${file}`);
}
