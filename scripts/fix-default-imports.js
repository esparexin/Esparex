const fs = require('fs');
const path = require('path');

const backendSrcDir = path.join(__dirname, '../backend/user/src');

function walkSync(dir, filelist = []) {
    if (!fs.existsSync(dir)) return filelist;
    fs.readdirSync(dir).forEach(file => {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            filelist = walkSync(filepath, filelist);
        } else if (filepath.endsWith('.ts')) {
            filelist.push(filepath);
        }
    });
    return filelist;
}

const files = walkSync(backendSrcDir);
let modifiedCount = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Fix `import redis from ...` -> `import { redisClient as redis } from ...`
    const regex1 = /import\s+redis\s+from\s+(['"]@esparex\/core\/infrastructure['"])/g;
    if (regex1.test(content)) {
        content = content.replace(regex1, `import { redisClient as redis } from $1`);
        changed = true;
    }

    // Fix `import redisClient from ...` -> `import { redisClient } from ...`
    const regex2 = /import\s+redisClient\s+from\s+(['"]@esparex\/core\/infrastructure['"])/g;
    if (regex2.test(content)) {
        content = content.replace(regex2, `import { redisClient } from $1`);
        changed = true;
    }
    
    // Fix `import firebaseAdmin from ...` -> `import { firebaseAdmin } from ...`
    // Actually, maybe firebaseAdmin was exported as default? Let's fix that.
    const regex3 = /import\s+firebaseAdmin\s+from\s+(['"]@esparex\/core\/infrastructure['"])/g;
    if (regex3.test(content)) {
        content = content.replace(regex3, `import { firebaseAdmin } from $1`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content);
        modifiedCount++;
        console.log(`Fixed default imports in ${path.relative(backendSrcDir, file)}`);
    }
});

console.log(`\nCompleted. Modified ${modifiedCount} files.`);
