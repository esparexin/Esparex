"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@core/utils/logger"));
const env_1 = require("@core/config/env");
require("../config/mongoosePlugins");
require("./Admin");
require("./Category");
require("./Brand");
require("./Model");
require("./SparePart");
require("./ServiceType");
require("./ScreenSize");
require("./Plan");
require("./AdminLog");
require("./AdminSession");
require("./ApiKey");
require("./Counter");
require("./JobLog");
require("./LocationEvent");
require("./NotificationLog");
require("./PageContent");
require("./RevenueAnalytics");
require("./SavedAd");
require("./SavedSearch");
require("./SellerReputation");
require("./ScheduledNotification");
require("./SystemConfig");
require("./UserPlan");
require("./UserWallet");
require("./User");
require("./Ad");
require("./AdAnalytics");
require("./Business");
require("./Location");
require("./AdminBoundary");
require("./SmartAlert");
require("./Notification");
require("./Report");
// Legacy `Service` model was merged into unified `Ad` listings.
// Keep registry aligned with real model files to prevent runtime module load failures.
require("./Invoice");
require("./ContactSubmission");
require("./Otp");
require("./Transaction");
require("./DuplicateEvent");
require("./IdempotencyRequest");
// Chat / Messaging
require("./Conversation");
require("./ChatMessage");
require("./ChatReport");
require("./BlockedUser");
require("./FraudScore");
const db_1 = require("@core/config/db");
const indexAuditTargets_1 = require("../db/indexAuditTargets");
const indexGovernance_1 = require("../db/indexGovernance");
if (env_1.env.NODE_ENV !== 'test') {
    logger_1.default.info('All Mongoose models registered. Initializing Index Governance Audit...');
    const userConn = (0, db_1.getUserConnection)();
    const adminConn = (0, db_1.getAdminConnection)();
    const auditTargets = (0, indexAuditTargets_1.getIndexAuditTargets)([
        { scope: 'user', connection: userConn },
        { scope: 'admin', connection: adminConn },
    ]);
    if (auditTargets.length === 1 && userConn === adminConn) {
        logger_1.default.info('[Index Governance] Unified DB detected. Auditing shared model registry once.');
    }
    auditTargets.forEach(({ scope, connection }) => {
        Object.entries(connection.models).forEach(([name, model]) => {
            (0, indexGovernance_1.governSchema)(model.schema, { scope, collectionName: name });
        });
    });
    (0, indexGovernance_1.runStartupIndexAudit)();
}
//# sourceMappingURL=registry.js.map