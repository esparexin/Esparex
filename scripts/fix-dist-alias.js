const fs = require('fs');
const path = require('path');
const glob = require('glob');

const files = glob.sync('backend/user/dist/**/*.js');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Calculate relative path from this file's dir to backend/user/dist/utils
    const fileDir = path.dirname(file);
    const utilsDir = 'backend/user/dist/utils';
    let relativeToUtils = path.relative(fileDir, utilsDir).replace(/\\/g, '/');
    if (!relativeToUtils.startsWith('.')) {
        relativeToUtils = './' + relativeToUtils;
    }
    
    const newContent = content.replace(/require\(['"]@utils\/([^'"]+)['"]\)/g, `require("${relativeToUtils}/$1")`);
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
    }
}
console.log('Fixed ' + count + ' files in dist');
