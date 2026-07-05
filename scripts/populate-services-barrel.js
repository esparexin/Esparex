const glob = require('glob');
const fs = require('fs');

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

let barrelContent = '// Public API for Services\n\n';

const sortedServices = Array.from(servicesReferenced).sort();

for (const service of sortedServices) {
    const baseName = service.split('/').pop();
    barrelContent += `export * as ${baseName} from './${service}';\n`;
    barrelContent += `export * from './${service}';\n\n`;
}

fs.writeFileSync('core/src/services/index.ts', barrelContent, 'utf8');
console.log('Populated core/src/services/index.ts with ' + sortedServices.length + ' services.');
