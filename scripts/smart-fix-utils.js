const fs = require('fs');
const glob = require('glob');

const backendUtilsFiles = [
    'adminBaseController',
    'adminLogger',
    'adminLogHelpers',
    'apiResponse',
    'contentHandler',
    'controllerUtils',
    'deviceFingerprint',
    'errorResponse',
    'health',
    'requestParams',
    'respond',
    'smartAlertHelpers'
];

const files = glob.sync('backend/user/src/**/*.ts');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    // First, rewrite ALL @utils to core
    let newContent = content.replace(/from '@utils\//g, "from '@esparex/core/utils/");
    
    // Then, revert the ones that are actually in backend/user/src/utils
    for (const backendUtil of backendUtilsFiles) {
        const regex = new RegExp(`from '@esparex/core/utils/${backendUtil}'`, 'g');
        newContent = newContent.replace(regex, `from '@utils/${backendUtil}'`);
    }

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
    }
}
console.log('Fixed ' + count + ' files with correct @utils routing');
