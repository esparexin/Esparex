const fs = require('fs');
const glob = require('glob');

const files = glob.sync('backend/user/src/**/*.ts');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/from '@esparex\/core\/utils\//g, "from '@utils/");
    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
    }
}
console.log('Restored ' + count + ' files with @utils alias');
