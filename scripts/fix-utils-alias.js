const fs = require('fs');
const glob = require('glob');

const files = glob.sync('backend/user/src/**/*.ts');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/from '@utils\//g, "from '@esparex/core/utils/");
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
    }
}
console.log('Fixed ' + count + ' files with @utils alias');
