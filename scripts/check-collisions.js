const fs = require('fs');
const path = require('path');

const infraDir = path.join(__dirname, '../core/src/infrastructure');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (filepath.endsWith('.ts') && !file.endsWith('.spec.ts')) {
            filelist.push(filepath);
        }
    });
    return filelist;
}

const files = walkSync(infraDir);
const exportsMap = new Map();

files.forEach(file => {
    if (file.endsWith('index.ts') && path.dirname(file) === infraDir) return; // skip the barrel itself
    
    const content = fs.readFileSync(file, 'utf8');
    
    // Naive regex to find named exports
    const exportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+([a-zA-Z0-9_]+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
        const name = match[1];
        if (exportsMap.has(name)) {
            console.error(`COLLISION DETECTED: '${name}' exported in both:\n - ${exportsMap.get(name)}\n - ${file}`);
        } else {
            exportsMap.set(name, file);
        }
    }
});

console.log('Collision check complete.');
