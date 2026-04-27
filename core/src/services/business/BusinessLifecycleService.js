"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.softDeleteBusiness = exports.withdrawBusiness = exports.rejectBusiness = exports.approveBusiness = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Business_1 = __importDefault(require("@core/models/Business"));
const User_1 = __importDefault(require("@core/models/User"));
const StatusMutationService_1 = require("../StatusMutationService");
const businessStatus_1 = require("@core/constants/enums/businessStatus");
const actor_1 = require("@core/constants/enums/actor");
const approveBusiness = async (id, moderatorId = 'SYSTEM') => {
    const existing = await Business_1.default.findById(id).lean();
    if (!existing)
        return null;
    if (existing.status === businessStatus_1.BUSINESS_STATUS.LIVE) {
        await User_1.default.findByIdAndUpdate(existing.userId, { role: 'business' });
        return existing;
    }
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const isSystem = moderatorId === 'SYSTEM' || !mongoose_1.default.Types.ObjectId.isValid(moderatorId);
    const business = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'business',
        entityId: id,
        toStatus: businessStatus_1.BUSINESS_STATUS.LIVE,
        actor: {
            type: isSystem ? actor_1.ACTOR_TYPE.SYSTEM : actor_1.ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason: 'Business profile approval',
        patch: {
            approvedAt: new Date(),
            expiresAt,
            isVerified: true
        }
    });
    if (!business)
        return null;
    await User_1.default.findByIdAndUpdate(business.userId, { role: 'business' });
    return business;
};
exports.approveBusiness = approveBusiness;
const rejectBusiness = async (id, reason, moderatorId = 'SYSTEM') => {
    const existing = await Business_1.default.findById(id).select('userId').lean();
    const isSystem = moderatorId === 'SYSTEM' || !mongoose_1.default.Types.ObjectId.isValid(moderatorId);
    const business = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'business',
        entityId: id,
        toStatus: businessStatus_1.BUSINESS_STATUS.REJECTED,
        actor: {
            type: isSystem ? actor_1.ACTOR_TYPE.SYSTEM : actor_1.ACTOR_TYPE.ADMIN,
            id: isSystem ? undefined : moderatorId
        },
        reason,
        patch: {
            rejectionReason: reason,
            isVerified: false
        }
    });
    if (existing?.userId) {
        await User_1.default.findByIdAndUpdate(existing.userId, { role: 'user' });
    }
    return business;
};
exports.rejectBusiness = rejectBusiness;
const withdrawBusiness = async (userId) => {
    const business = await Business_1.default.findOne({ userId, status: businessStatus_1.BUSINESS_STATUS.PENDING });
    if (!business)
        return null;
    await business.softDelete();
    await User_1.default.findByIdAndUpdate(userId, {
        $unset: { businessId: 1 }
    });
    return business;
};
exports.withdrawBusiness = withdrawBusiness;
const softDeleteBusiness = async (id) => {
    const business = await Business_1.default.findById(id);
    if (!business)
        return null;
    await business.softDelete();
    await User_1.default.findByIdAndUpdate(business.userId, {
        $unset: { businessId: 1 },
        role: 'user'
    });
    return business;
};
exports.softDeleteBusiness = softDeleteBusiness;
//# sourceMappingURL=BusinessLifecycleService.js.map