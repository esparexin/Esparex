const glob = require('glob');
const fs = require('fs');

const files = glob.sync('backend/user/src/**/*.ts');
let filesModified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Fix jest.mock('@esparex/core/services/XXX')
    content = content.replace(/jest\.mock\(['"]@esparex\/core\/services\/([^'"]+)['"]/g, "jest.mock('@core-services/$1'");
    
    // Also catch require('@esparex/core/services/XXX')
    content = content.replace(/require\(['"]@esparex\/core\/services\/([^'"]+)['"]/g, "require('@core-services/$1'");

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
    }
}

console.log(`Replaced deep mock paths in ${filesModified} files.`);
