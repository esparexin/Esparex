const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, 'core/src/domains/notifications/application');

const files = fs.readdirSync(appDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
    const filePath = path.join(appDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convert any 'from "../models/User"' or 'from "../../models/User"' or 'from "../../../../models/User"' 
    // to EXACTLY 'from "../../../../models/User"' by stripping the prefix and adding the correct one.
    
    // A regex to match any depth of relative imports to standard directories
    const replaceDepth = (dirName, newDepth) => {
        const regex = new RegExp(`from '(\\.\\.\\/)+${dirName}\\/`, 'g');
        content = content.replace(regex, `from '${newDepth}${dirName}/`);
        const regex2 = new RegExp(`from "(\\.\\.\\/)+${dirName}\\/`, 'g');
        content = content.replace(regex2, `from "${newDepth}${dirName}/`);
    };

    replaceDepth('models', '../../../../');
    replaceDepth('utils', '../../../../');
    replaceDepth('config', '../../../../');
    replaceDepth('queues', '../../../../');
    replaceDepth('domain', '../../../../');
    replaceDepth('composition', '../../../../');
    
    // Payments domain
    replaceDepth('payments', '../../');
    
    // Remaining cross-service imports that stayed behind
    const replaceService = (serviceName, newPath) => {
        const regex = new RegExp(`from '(\\.\\.\\/)+${serviceName}'`, 'g');
        content = content.replace(regex, `from '${newPath}'`);
        const regex2 = new RegExp(`from "(\\.\\.\\/)+${serviceName}"`, 'g');
        content = content.replace(regex2, `from "${newPath}"`);
    };
    
    replaceService('location/LocationNormalizer', '../../../../services/location/LocationNormalizer');
    replaceService('mutations/UnifiedMutationEngine', '../../../../services/mutations/UnifiedMutationEngine');
    
    // For local imports (NotificationDispatcher, etc.)
    // If it's `from './notification/NotificationDispatcher'` or `from '../notification/NotificationDispatcher'`
    content = content.replace(/from '(\.\.\/)*notification\/NotificationDispatcher'/g, "from './NotificationDispatcher'");
    content = content.replace(/from "(\.\.\/)*notification\/NotificationDispatcher"/g, 'from "./NotificationDispatcher"');

    // Also fix any `from '../models/AdminLog'` that might not have a trailing slash
    const replaceModelExact = (modelName) => {
        const regex = new RegExp(`from '(\\.\\.\\/)+models\\/${modelName}'`, 'g');
        content = content.replace(regex, `from '../../../../models/${modelName}'`);
        const regex2 = new RegExp(`from "(\\.\\.\\/)+models\\/${modelName}"`, 'g');
        content = content.replace(regex2, `from "../../../../models/${modelName}"`);
    };
    replaceModelExact('AdminLog');
    replaceModelExact('SmartAlert');
    replaceModelExact('AlertDeliveryLog');
    replaceModelExact('User');
    replaceModelExact('Notification');
    
    fs.writeFileSync(filePath, content);
}
console.log('Imports fixed again.');
