const fs = require('fs');
const path = require('path');

const controllers = [
    'adminLocationController.ts',
    'adminUsersController.ts',
    'adminListingsController.ts',
    'adminBusinessController.ts',
    'admin2FAController.ts',
    'adminAnalyticsController.ts',
    'adminApiKeyController.ts',
    'adminAuditController.ts',
    'adminCacheController.ts',
    'adminInvoiceController.ts',
    'adminNotificationController.ts',
    'adminReportsController.ts',
    'adminRevealController.ts',
    'adminSessionController.ts',
    'adminSmartAlertsController.ts',
    'adminTransactionController.ts'
];

for (const file of controllers) {
    const fullPath = path.join(process.cwd(), 'backend/admin/src/controllers', file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');

    const regex = /\/\/\s*-+\n\/\/\s*Helpers\n\/\/\s*-+\n\n(?:const (?:getActorId|getActorRole|getIp|getUserAgent|buildLogFn) = [^;]+;[\s\n]*)+/m;

    if (regex.test(content)) {
        content = content.replace(regex, '');
        
        const imports = [];
        if (content.includes('getActorId(')) imports.push('getActorId');
        if (content.includes('getActorRole(')) imports.push('getActorRole');
        if (content.includes('getIp(')) imports.push('getIp');
        if (content.includes('getUserAgent(')) imports.push('getUserAgent');
        if (content.includes('buildLogFn(')) imports.push('buildLogFn');

        if (imports.length > 0) {
            const importStatement = `import { ${imports.join(', ')} } from '@esparex/core/utils/adminLogHelpers';\n`;
            content = content.replace(/import \{.*?\} from '@esparex\/core\/utils\/adminBaseController';\n/m, match => match + importStatement);
        }

        fs.writeFileSync(fullPath, content);
        console.log(`Extracted admin log helpers in ${file}`);
    }
}
