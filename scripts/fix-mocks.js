const fs = require('fs');
const path = require('path');
function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    for (const item of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) walkDir(fullPath);
        else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('@esparex/core/models/')) {
                content = content.replace(/jest\.mock\(['"`]@esparex\/core\/models\/[^'"`]+['"`]/g, "jest.mock('@esparex/core/models'");
                content = content.replace(/import\(['"`]@esparex\/core\/models\/[^'"`]+['"`]\)/g, "import('@esparex/core/models')");
                
                // Fix specific cases:
                // const User = (await import('@esparex/core/models/User')).default;
                // -> const User = (await import('@esparex/core/models')).User;
                const dynamicRegex = /const (\w+) = \(await import\('@esparex\/core\/models(?:.+)?'\)\)\.default;/g;
                content = content.replace(dynamicRegex, "const $1 = (await import('@esparex/core/models')).$1;");

                // import X, { type Y } from '@esparex/core/models/X'
                // already handled by rewrite-model-imports.js for the most part, but we can catch leftovers.
                
                fs.writeFileSync(fullPath, content, 'utf8');
            }
        }
    }
}
walkDir('core/src');
walkDir('backend/user/src');
