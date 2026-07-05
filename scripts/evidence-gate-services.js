const glob = require('glob');
const fs = require('fs');

const files = glob.sync('backend/user/src/**/*.ts');
let totalImports = 0;
let filesAffected = 0;
const servicesReferenced = new Set();
const filesWithDuplicates = [];

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /from ['"]@esparex\/core\/services\/([^'"]+)['"]/g;
    let match;
    let fileMatchCount = 0;
    
    while ((match = regex.exec(content)) !== null) {
        totalImports++;
        fileMatchCount++;
        servicesReferenced.add(match[1]);
    }
    
    if (fileMatchCount > 0) {
        filesAffected++;
        if (fileMatchCount > 1) {
            filesWithDuplicates.push({ file, count: fileMatchCount });
        }
    }
}

console.log('Evidence Gate 0');
console.log('Scan all workspaces for: from "@esparex/core/services/*"');
console.log('');
console.log('| Metric | Value |');
console.log('| --- | --- |');
console.log(`| Total imports found | ${totalImports} |`);
console.log(`| Files affected | ${filesAffected} |`);
console.log(`| Services referenced | ${servicesReferenced.size} |`);
console.log(`| Files with >1 import | ${filesWithDuplicates.length} |`);
console.log('');
console.log('### Services Referenced:');
for (const service of Array.from(servicesReferenced).sort()) {
    console.log(`- ${service}`);
}
