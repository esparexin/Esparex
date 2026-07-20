const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'core/src/domains/notifications/application');

const rootFiles = [
    'AdminNotificationService.ts',
    'EmailService.ts',
    'NotificationService.ts',
    'SmartAlertQueryService.ts',
    'SmartAlertService.ts'
];

const subdirFiles = [
    'AdminNotificationTargetingService.ts',
    'NotificationDispatcher.ts',
    'NotificationPreferenceService.ts',
    'NotificationRetentionService.ts',
    'NotificationTemplateService.ts',
    'NotificationVersionService.ts',
    'PushGatewayService.ts',
    'SmartAlertMutationService.ts'
];

function fixImports(files) {
    const newDepth = '../../../../';
    for (const file of files) {
        const filePath = path.join(appDir, file);
        if (!fs.existsSync(filePath)) continue;
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Use regex to replace any relative depth up to models/ utils/ etc. with the correct depth
        content = content.replace(/from '(\.\.\/)+models\//g, `from '${newDepth}models/`);
        content = content.replace(/from '(\.\.\/)+utils\//g, `from '${newDepth}utils/`);
        content = content.replace(/from '(\.\.\/)+config\//g, `from '${newDepth}config/`);
        content = content.replace(/from '(\.\.\/)+queues\//g, `from '${newDepth}queues/`);
        content = content.replace(/from '(\.\.\/)+domain\//g, `from '${newDepth}domain/`); // NotificationIntent is in core/src/domain
        content = content.replace(/from '(\.\.\/)+composition\//g, `from '${newDepth}composition/`);
        
        // Payments domain references
        content = content.replace(/from '(\.\.\/)+payments\//g, `from '../../payments/`);
        
        // Other services left behind
        content = content.replace(/from '(\.\.\/)*location\/LocationNormalizer'/g, "from '../../../../services/location/LocationNormalizer'");
        content = content.replace(/from '(\.\.\/)*mutations\/UnifiedMutationEngine'/g, "from '../../../../services/mutations/UnifiedMutationEngine'");
        
        content = content.replace(/from '(\.\.\/)+PlanEngine'/g, "from '../../payments/domain/policies/PlanEngine'");
        content = content.replace(/from '(\.\.\/)+PlanService'/g, "from '../../payments/application/PlanService'");
        content = content.replace(/from '(\.\.\/)+wallet\/WalletService'/g, "from '../../payments/application/WalletService'");
        content = content.replace(/from '(\.\.\/)+SmartAlertService'/g, "from './SmartAlertService'");
        
        content = content.replace(/from '\.\/notification\/NotificationDispatcher'/g, "from './NotificationDispatcher'");
        
        // Also fix `../../../domains/NotificationIntent` which was wrongly replaced in previous run
        content = content.replace(/from '\.\.\/\.\.\/\.\.\/domains\/NotificationIntent'/g, "from '../../../../domain/NotificationIntent'");

        fs.writeFileSync(filePath, content);
    }
}

fixImports(rootFiles);
fixImports(subdirFiles);

console.log('Imports fixed.');
