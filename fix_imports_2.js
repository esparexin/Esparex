const fs = require('fs');
const path = require('path');

function replaceInDir(dir, find, replace) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath, find, replace);
        } else if (fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            content = content.replace(new RegExp(find, 'g'), replace);
            fs.writeFileSync(fullPath, content);
        }
    }
}

const appDir = path.join(__dirname, 'core/src/domains/payments/application');
replaceInDir(appDir, "\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./models", "../../../models");
replaceInDir(appDir, "\\.\\./\\.\\./\\.\\./\\.\\./config", "../../../config");

const adaptersDir = path.join(__dirname, 'core/src/domains/payments/adapters');
replaceInDir(adaptersDir, "\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./models", "../../../../../models");

