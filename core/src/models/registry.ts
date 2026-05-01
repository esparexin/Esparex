import logger from '@core/utils/logger';
import { env } from '@core/config/env';
import '../config/mongoosePlugins';
import './Admin';
import './Category';
import './Brand';
import './Model';
import './SparePart';
import './ServiceType';
import './ScreenSize';
import './Plan';
import './AdminLog';
import './AdminSession';
import './ApiKey';
import './Counter';
import './JobLog';
import './LocationEvent';
import './NotificationLog';
import './PageContent';
import './RevenueAnalytics';
import './SavedAd';
import './SavedSearch';
import './SellerReputation';
import './ScheduledNotification';
import './SystemConfig';
import './UserPlan';
import './UserWallet';


import './User';
import './Ad';
import './AdAnalytics';
import './Business';
import './Location';
import './AdminBoundary';
import './SmartAlert';
import './Notification';
import './Report';
// Previous `Service` model was merged into unified `Ad` listings.
// Keep registry aligned with real model files to prevent runtime module load failures.
import './Invoice';
import './ContactSubmission';
import './Otp';
import './Transaction';
import './DuplicateEvent';
import './IdempotencyRequest';

// Chat / Messaging
import './Conversation';
import './ChatMessage';
import './ChatReport';
import './BlockedUser';
import './FraudScore';

import { getUserConnection, getAdminConnection } from '@core/config/db';
import { getIndexAuditTargets } from '../db/indexAuditTargets';
import { governSchema, runStartupIndexAudit } from '../db/indexGovernance';

if (env.NODE_ENV !== 'test') {
    logger.info('All Mongoose models registered. Initializing Index Governance Audit...');

    const userConn = getUserConnection();
    const adminConn = getAdminConnection();
    const auditTargets = getIndexAuditTargets([
        { scope: 'user', connection: userConn },
        { scope: 'admin', connection: adminConn },
    ]);

    if (auditTargets.length === 1 && userConn === adminConn) {
        logger.info('[Index Governance] Unified DB detected. Auditing shared model registry once.');
    }

    auditTargets.forEach(({ scope, connection }) => {
        Object.entries(connection.models).forEach(([name, model]) => {
            governSchema(model.schema as Parameters<typeof governSchema>[0], { scope, collectionName: name });
        });
    });

    runStartupIndexAudit();
}
