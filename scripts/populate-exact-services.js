const fs = require('fs');
const content = fs.readFileSync('unique_services.txt', 'utf8');
const services = content.split('\n').map(s => s.trim()).filter(s => s);

let barrelContent = '// Public API for Services\n\n';

for (const service of services) {
    let baseName = service.split('/').pop();
    
    // Clean up baseName to be a valid identifier
    baseName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Original capitalized base name
    const PascalName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    // Export all named exports normally
    barrelContent += `export * from './${service}';\n`;
    // Export a namespace with _NS suffix to avoid collisions with classes/vars named the same
    barrelContent += `export * as ${PascalName}_NS from './${service}';\n\n`;
}

fs.writeFileSync('core/src/services/index.ts', barrelContent, 'utf8');
console.log(`Populated core/src/services/index.ts with ${services.length} services (using _NS for namespaces).`);
