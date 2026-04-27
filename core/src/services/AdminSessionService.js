"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAdminSessionById = exports.getAdminSessions = exports.revokeAdminSessionsForAdmin = exports.revokeAdminSession = exports.validateAdminSession = exports.createAdminSession = exports.getAdminSessionTtlMs = void 0;
const AdminSession_1 = __importStar(require("@core/models/AdminSession"));
const systemConfigHelper_1 = require("@core/utils/systemConfigHelper");
const env_1 = require("@core/config/env");
const ADMIN_SESSION_TTL_MS = env_1.env.ADMIN_SESSION_TTL_MS ?? (8 * 60 * 60 * 1000);
const getAdminSessionTtlMs = async () => {
    try {
        const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        const minutes = Number(config?.security?.sessionTimeoutMinutes);
        if (Number.isFinite(minutes) && minutes >= 5) {
            return Math.floor(minutes) * 60 * 1000;
        }
    }
    catch {
        // Fall back to the environment-configured TTL below.
    }
    return ADMIN_SESSION_TTL_MS;
};
exports.getAdminSessionTtlMs = getAdminSessionTtlMs;
const createAdminSession = async (params) => {
    const expiresAt = new Date(Date.now() + await (0, exports.getAdminSessionTtlMs)());
    const tokenHash = (0, AdminSession_1.hashAdminSessionToken)(params.token);
    return AdminSession_1.default.create({
        adminId: params.adminId,
        tokenHash,
        tokenId: params.tokenId,
        ip: params.ip,
        device: params.device,
        expiresAt
    });
};
exports.createAdminSession = createAdminSession;
const validateAdminSession = async (params) => {
    const tokenHash = (0, AdminSession_1.hashAdminSessionToken)(params.token);
    const query = {
        adminId: params.adminId,
        tokenHash,
        revokedAt: { $exists: false },
        expiresAt: { $gt: new Date() }
    };
    if (params.tokenId)
        query.tokenId = params.tokenId;
    return AdminSession_1.default.findOne(query).lean();
};
exports.validateAdminSession = validateAdminSession;
const revokeAdminSession = async (token) => {
    const tokenHash = (0, AdminSession_1.hashAdminSessionToken)(token);
    return AdminSession_1.default.updateOne({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
};
exports.revokeAdminSession = revokeAdminSession;
const revokeAdminSessionsForAdmin = async (adminId) => {
    return AdminSession_1.default.updateMany({ adminId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
};
exports.revokeAdminSessionsForAdmin = revokeAdminSessionsForAdmin;
const getAdminSessions = async (query, skip, limit) => {
    const [items, total] = await Promise.all([
        AdminSession_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('adminId', 'firstName lastName email role'),
        AdminSession_1.default.countDocuments(query),
    ]);
    return { items, total };
};
exports.getAdminSessions = getAdminSessions;
const revokeAdminSessionById = async (id) => {
    return AdminSession_1.default.findByIdAndUpdate(id, { revokedAt: new Date() }, { new: true });
};
exports.revokeAdminSessionById = revokeAdminSessionById;
//# sourceMappingURL=AdminSessionService.js.map