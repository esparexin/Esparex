const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'core/src/domains/notifications/application');

const files = fs.readdirSync(appDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
    const filePath = path.join(appDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all instances of '../../../../' with '../../../' for the standard src/ directories
    const dirs = ['models', 'utils', 'config', 'queues', 'domain', 'composition'];
    
    for (const dir of dirs) {
        content = content.replace(new RegExp(`'\\.\\.\\/\\.\\.\\/\\.\\.\\/\\.\\.\\/${dir}\\/`, 'g'), `'../../../${dir}/`);
        content = content.replace(new RegExp(`"\\.\\.\\/\\.\\.\\/\\.\\.\\/\\.\\.\\/${dir}\\/`, 'g'), `"../../../${dir}/`);
    }

    // Also replace specific file imports that were broken
    content = content.replace(/'\.\.\/\.\.\/\.\.\/\.\.\/services\/location\/LocationNormalizer'/g, "'../../../services/location/LocationNormalizer'");
    content = content.replace(/'\.\.\/\.\.\/\.\.\/\.\.\/services\/mutations\/UnifiedMutationEngine'/g, "'../../../services/mutations/UnifiedMutationEngine'");
    
    fs.writeFileSync(filePath, content);
}
console.log('Depth fixed.');
