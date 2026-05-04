"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AdminLog_1 = __importDefault(require("@core/models/AdminLog"));
const logger_1 = __importDefault(require("@core/utils/logger"));
class AuditService {
    /**
     * Log an administrative or security event.
     * Persistence: Writes to AdminLog (MongoDB) and structured logs (Winston).
     */
    static async logEvent(event, context) {
        const { action, targetType, targetId, metadata } = event;
        const { actorId, actorType, ip, userAgent, requestId } = context;
        // 1. Structured Logging (Internal tracing)
        logger_1.default.info(`[AUDIT] ${action} on ${targetType}`, {
            ...event,
            ...context,
            timestamp: new Date().toISOString()
        });
        // 2. Persistent Storage (Only for high-value actions or admin actions)
        if (actorType === 'admin' || action.startsWith('SECURITY_') || action.startsWith('CRITICAL_')) {
            try {
                // We use AdminLog as our persistent audit trail
                await AdminLog_1.default.create({
                    adminId: actorId ? new mongoose_1.default.Types.ObjectId(actorId) : undefined,
                    action,
                    targetType,
                    targetId,
                    metadata: {
                        ...metadata,
                        actorType,
                        requestId
                    },
                    ipAddress: ip,
                    userAgent
                });
            }
            catch (err) {
                logger_1.default.error('Failed to persist audit log to MongoDB', { error: String(err), event });
            }
        }
    }
    /**
     * Shorthand for admin actions
     */
    static async logAdminAction(adminId, action, targetType, targetId, metadata) {
        return this.logEvent({ action, targetType, targetId, metadata }, { actorId: adminId, actorType: 'admin' });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=AuditService.js.map