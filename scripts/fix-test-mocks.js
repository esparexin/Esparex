const fs = require('fs');
const glob = require('glob');

const shims = [
    'adminBaseController', 'adminLogger', 'adminLogHelpers', 'apiResponse', 
    'contentHandler', 'controllerUtils', 'deviceFingerprint', 'errorResponse', 
    'health', 'requestParams', 'respond', 'smartAlertHelpers'
];

const files = glob.sync('backend/user/src/__tests__/**/*.ts');
let count = 0;

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    
    for (const shim of shims) {
        // Literal replacements to avoid regex headaches
        content = content.split(`jest.mock('@esparex/core/utils/${shim}'`).join(`jest.mock('@utils/${shim}'`);
        content = content.split(`jest.mock("@esparex/core/utils/${shim}"`).join(`jest.mock("@utils/${shim}"`);
        
        content = content.split(`require('@esparex/core/utils/${shim}')`).join(`require('@utils/${shim}')`);
        content = content.split(`require("@esparex/core/utils/${shim}")`).join(`require("@utils/${shim}")`);
        
        content = content.split(`from '@esparex/core/utils/${shim}'`).join(`from '@utils/${shim}'`);
        content = content.split(`from "@esparex/core/utils/${shim}"`).join(`from "@utils/${shim}"`);
    }

    // Also, we don't need the Proxy hack if we fix the models!
    // But since the models are already imported via the barrel in controllers,
    // the tests that use jest.mock('@esparex/core/models/XXX') WILL fail
    // unless they use the Proxy hack. The Proxy hack is globally enabled via jest.config.js.

    if (fs.readFileSync(file, 'utf8') !== content) {
        fs.writeFileSync(file, content, 'utf8');
        count++;
    }
}

console.log('Fixed mocks in ' + count + ' test files');
