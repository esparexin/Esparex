const glob = require('glob');
const fs = require('fs');
const path = require('path');

const files = glob.sync('backend/user/src/**/*.ts');
const servicesReferenced = new Set();

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const regex = /from ['"]@esparex\/core\/services\/([^'"]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        servicesReferenced.add(match[1]);
    }
}

const barrelContent = fs.readFileSync('core/src/services/index.ts', 'utf8');

console.log(`Services discovered: ${servicesReferenced.size}\\n`);

const exported = [];
const missing = [];

for (const service of servicesReferenced) {
    // Check if the service path is exported in the barrel
    // e.g. export * from './ad/AdAggregationService'
    // or export { something } from './ad/AdAggregationService'
    const servicePath = './' + service;
    if (barrelContent.includes(`from '${servicePath}'`) || barrelContent.includes(`from "${servicePath}"`)) {
        exported.push(service);
    } else {
        missing.push(service);
    }
}

console.log('Exported:');
exported.forEach(s => console.log(`✓ ${s}`));

console.log('\\nMissing:');
missing.forEach(s => console.log(`✗ ${s}`));

console.log('\\nVerification: ' + (missing.length === 0 ? 'PASSED' : 'FAILED'));

if (missing.length > 0) {
    process.exit(1);
}
