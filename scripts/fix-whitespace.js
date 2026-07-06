const fs = require('fs');
const path = require('path');

function scanDir(dir) {
    let files = fs.readdirSync(dir);
    for (let f of files) {
        let fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            // Strip BOM
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }
            // Strip irregular whitespace
            content = content.replace(/[\uFEFF\u200B\u2028\u2029\xA0]/g, ' ');
            
            // Clean up any weird 3-byte artifact left by bad regex in previous steps
            // Sometimes an empty line with 3 spaces got turned into something weird.
            // Let's just run ESLint via execSync on the file and see if it passes.
            // Actually, we'll just write it if changed.
            if (content !== original) {
                console.log('Fixing irregular whitespace in', fullPath);
                fs.writeFileSync(fullPath, content);
            }
        }
    }
}

scanDir(path.join(__dirname, '../backend/user/src'));
