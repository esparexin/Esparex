const fs = require('fs');
const path = require('path');

const infraDir = path.join(__dirname, '../core/src/infrastructure');
const indexContent = fs.readFileSync(path.join(infraDir, 'index.ts'), 'utf8');

const exportRegex = /export\s+\*\s+from\s+'([^']+)'/g;
let match;
while ((match = exportRegex.exec(indexContent)) !== null) {
    const importPath = match[1];
    const fullPath = path.join(infraDir, importPath);
    
    // Check if it exists as a file (.ts)
    const existsAsFile = fs.existsSync(fullPath + '.ts');
    // Check if it exists as a directory containing index.ts
    const existsAsDir = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'index.ts'));
    
    if (!existsAsFile && !existsAsDir) {
        console.error(`MISSING EXPORT TARGET: ${importPath}`);
    }
}
console.log('Done checking exports.');
