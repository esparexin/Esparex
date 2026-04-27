"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAdminAction = exports.logAdminActionDirect = void 0;
const AdminLog_1 = __importDefault(require("@core/models/AdminLog"));
const logger_1 = __importDefault(require("./logger"));
/**
 * Transport-free admin action logger.
 * Called by services that no longer depend on express.Request.
 * Controllers inject actorId, ip and userAgent as plain strings.
 */
const logAdminActionDirect = async (actorId, action, targetType, targetId, metadata, ip = '', userAgent = '') => {
    try {
        if (!actorId) {
            logger_1.default.warn('[AdminLogger] Attempted to log action without adminId', { action, targetType });
            return;
        }
        await AdminLog_1.default.create({
            adminId: actorId,
            action,
            targetType,
            targetId: targetId ? targetId.toString() : undefined,
            metadata,
            ipAddress: ip,
            userAgent,
        });
    }
    catch (error) {
        logger_1.default.error('[AdminLogger] Failed to create log:', error);
    }
};
exports.logAdminActionDirect = logAdminActionDirect;
/**
 * Asynchronously logs an admin action.
 * Fail-safe: Any errors during logging are caught and logged to console, ensuring the main action proceeds.
 *
 * @param req - Express Request object (to extract admin user, IP, UA)
 * @param action - Action name (e.g., 'BAN_USER', 'APPROVE_AD')
 * @param targetType - Type of target entity (e.g., 'User', 'Ad')
 * @param targetId - ID of the target entity
 * @param metadata - Optional extra data (before/after states, reasons)
 */
const logAdminAction = async (req, action, targetType, targetId, metadata, actorIdOverride) => {
    try {
        const authUser = req.user;
        const adminId = actorIdOverride || authUser?._id || authUser?.id;
        if (!adminId) {
            logger_1.default.warn('[AdminLogger] Attempted to log action without adminId', { action, targetType });
            return;
        }
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const userAgent = req.headers['user-agent'] || '';
        await AdminLog_1.default.create({
            adminId,
            action,
            targetType,
            targetId: targetId ? targetId.toString() : undefined,
            metadata,
            ipAddress,
            userAgent
        });
    }
    catch (error) {
        logger_1.default.error('[AdminLogger] Failed to create log:', error);
    }
};
exports.logAdminAction = logAdminAction;
//# sourceMappingURL=adminLogger.js.map