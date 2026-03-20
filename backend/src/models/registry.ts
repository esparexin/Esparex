import logger from '../utils/logger';
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
import './Broadcast';
import './CityPopularity';
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
// Legacy `Service` model was merged into unified `Ad` listings.
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

import { getUserConnection, getAdminConnection } from '../config/db';
import { governSchema, runStartupIndexAudit } from '../core/db/indexGovernance';

if (process.env.NODE_ENV !== 'test') {
    logger.info('All Mongoose models registered. Initializing Index Governance Audit...');

    const userConn = getUserConnection();
    const adminConn = getAdminConnection();

    // Audit User DB Models
    Object.entries(userConn.models).forEach(([name, model]) => {
        governSchema(model.schema, name);
    });

    // Audit Admin DB Models
    Object.entries(adminConn.models).forEach(([name, model]) => {
        governSchema(model.schema, name);
    });

    runStartupIndexAudit();
}
