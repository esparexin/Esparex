const glob = require('glob');
const fs = require('fs');

const files = glob.sync('backend/user/src/**/*.ts');
let filesModified = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // A literal backslash followed by 'n' is matched by /\\n/g in regex.
    // Let's replace the string "\\n" with an actual newline "\n".
    content = content.replace(/\\n/g, '\n');
    
    // Also remove the BOM if it got inserted in the middle of the file.
    content = content.replace(/\uFEFF/g, '');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        filesModified++;
    }
}

console.log(`Fixed syntax errors in ${filesModified} files.`);
