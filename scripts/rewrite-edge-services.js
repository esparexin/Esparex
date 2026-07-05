const glob = require('glob');
const fs = require('fs');

const files = glob.sync('backend/user/src/**/*.ts');
let filesModified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix export { X } from '@esparex/core/services/XXX'
    content = content.replace(/export\s+{[^}]+}\s+from\s+['"]@esparex\/core\/services\/[^'"]+['"]/g, match => {
        return match.replace(/@esparex\/core\/services\/[^'"]+/, '@esparex/core/services');
    });

    // Fix import type { X } from ...
    content = content.replace(/import\s+type\s+{[^}]+}\s+from\s+['"]@esparex\/core\/services\/[^'"]+['"]/g, match => {
        return match.replace(/@esparex\/core\/services\/[^'"]+/, '@esparex/core/services');
    });

    // Fix await import(...)
    content = content.replace(/await\s+import\s*\(\s*['"]@esparex\/core\/services\/[^'"]+['"]\s*\)/g, match => {
        return match.replace(/@esparex\/core\/services\/[^'"]+/, '@esparex/core/services');
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
    }
}

console.log(`Fixed edge cases in ${filesModified} files.`);
