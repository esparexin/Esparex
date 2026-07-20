const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'core/src/services');

const shims = {
    // Root level
    'AdminNotificationService.ts': '../domains/notifications/application/AdminNotificationService',
    'EmailService.ts': '../domains/notifications/application/EmailService',
    'NotificationService.ts': '../domains/notifications/application/NotificationService',
    'SmartAlertQueryService.ts': '../domains/notifications/application/SmartAlertQueryService',
    'SmartAlertService.ts': '../domains/notifications/application/SmartAlertService',

    // notification level
    'notification/AdminNotificationTargetingService.ts': '../../domains/notifications/application/AdminNotificationTargetingService',
    'notification/NotificationDispatcher.ts': '../../domains/notifications/application/NotificationDispatcher',
    'notification/NotificationPreferenceService.ts': '../../domains/notifications/application/NotificationPreferenceService',
    'notification/NotificationRetentionService.ts': '../../domains/notifications/application/NotificationRetentionService',
    'notification/NotificationTemplateService.ts': '../../domains/notifications/application/NotificationTemplateService',
    'notification/NotificationVersionService.ts': '../../domains/notifications/application/NotificationVersionService',
    'notification/PushGatewayService.ts': '../../domains/notifications/application/PushGatewayService',

    // smartAlert level
    'smartAlert/SmartAlertMutationService.ts': '../../domains/notifications/application/SmartAlertMutationService'
};

for (const [relPath, targetPath] of Object.entries(shims)) {
    const fullPath = path.join(srcDir, relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    const content = `/**\n * @deprecated Moved to bounded context\n */\nexport * from '${targetPath}';\n`;
    fs.writeFileSync(fullPath, content);
}
console.log('Shims created.');
