const glob = require('glob');
const fs = require('fs');

const files = glob.sync('backend/user/src/**/*.ts');
let filesModified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('\\\\n')) {
        // Wait, did I write '\\n' literally? Yes, in the script I used `\\\\n`.
        // So the string is `\\n`.
        content = content.replace(/\\\\n/g, '\\n');
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
    }
}

console.log(`Fixed literal newlines in ${filesModified} files.`);
