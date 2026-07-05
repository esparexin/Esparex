const glob = require('glob');
const fs = require('fs');

// Use posix paths for glob output if possible, but let's just sanitize it
const files = glob.sync('core/src/services/**/*.ts', { ignore: ['core/src/services/index.ts', '**/*.d.ts', '**/*.spec.ts', '**/*.test.ts'] });

let barrelContent = '// Public API for Services\n\n';

for (const file of files) {
    // Normalize path to use forward slashes
    const normalizedFile = file.replace(/\\/g, '/');
    
    let servicePath = normalizedFile.replace(/^core\/src\/services\//, './').replace(/\.ts$/, '');
    let baseName = servicePath.split('/').pop();
    
    // Clean up baseName to be a valid identifier
    baseName = baseName.replace(/[^a-zA-Z0-9_]/g, '_');
    
    // Capitalize if it was e.g. types -> Types
    baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    
    barrelContent += `export * as ${baseName} from '${servicePath}';\n`;
    barrelContent += `export * from '${servicePath}';\n\n`;
}

fs.writeFileSync('core/src/services/index.ts', barrelContent, 'utf8');
console.log(`Populated core/src/services/index.ts with ${files.length} services.`);
