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
exports.deleteBusinessAccount = exports.updateBusinessByAdmin = exports.updateBusinessStatus = exports.rejectBusinessAccount = exports.approveBusinessAccount = exports.getBusinessAccountById = exports.getBusinessAccounts = exports.getBusinessOverview = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const shared_1 = require("./business/shared");
const adminBusinessService = __importStar(require("@esparex/core/services/AdminBusinessService"));
const businessStatus_1 = require("@esparex/core/utils/businessStatus");
const businessStatus_2 = require("@esparex/shared/enums/businessStatus");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const getActorId = (req) => req.user?._id?.toString() ?? req.user?.id ?? '';
const getIp = (req) => ((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();
const getUserAgent = (req) => req.headers['user-agent'] || '';
const buildLogFn = (req) => (action, targetType, targetId, metadata) => (0, adminLogger_1.logAdminActionDirect)(getActorId(req), action, targetType, targetId, metadata, getIp(req), getUserAgent(req));
// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------
const getBusinessOverview = async (req, res) => {
    try {
        const overview = await adminBusinessService.getBusinessOverview();
        (0, adminBaseController_1.sendSuccessResponse)(res, overview);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getBusinessOverview = getBusinessOverview;
const getBusinessAccounts = async (req, res) => {
    try {
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const status = typeof req.query.status === 'string' ? req.query.status : undefined;
        const locationId = typeof req.query.locationId === 'string' ? req.query.locationId.trim() : undefined;
        const search = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
        const { adminQuery } = await adminBusinessService.getAdminBusinessAccountsData({
            status,
            locationId,
            search,
            page,
            limit,
        });
        if (search) {
            const { escapeRegExp } = await Promise.resolve().then(() => __importStar(require('@esparex/core/utils/stringUtils')));
            const safeSearch = escapeRegExp(search);
            (adminQuery).$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { email: { $regex: safeSearch, $options: 'i' } },
                { mobile: { $regex: safeSearch, $options: 'i' } },
                { 'location.city': { $regex: safeSearch, $options: 'i' } },
            ];
        }
        const Business = (await Promise.resolve().then(() => __importStar(require('@esparex/core/models/Business')))).default;
        const [rawItems, total] = await Promise.all([
            Business.find(adminQuery)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .populate('userId')
                .setOptions({ withDeleted: true }),
            Business.countDocuments(adminQuery)
                .setOptions({ withDeleted: true }),
        ]);
        const items = adminBusinessService.transformBusinessDocs(rawItems);
        return (0, adminBaseController_1.sendPaginatedResponse)(res, items, total, page, limit);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getBusinessAccounts = getBusinessAccounts;
const getBusinessAccountById = async (req, res) => {
    try {
        const business = await adminBusinessService.getAdminBusinessById(req.params.id);
        if (!business) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Business not found', 404);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, shared_1.serializeBusinessForAdmin)(business));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getBusinessAccountById = getBusinessAccountById;
const approveBusinessAccount = async (req, res) => {
    try {
        const business = await adminBusinessService.approveAdminBusiness(req.params.id, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, shared_1.serializeBusinessForAdmin)(business), 'Business approved successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.approveBusinessAccount = approveBusinessAccount;
const rejectBusinessAccount = async (req, res) => {
    try {
        const rejectBody = req.body;
        const reason = typeof rejectBody.reason === 'string' ? rejectBody.reason.trim() : '';
        const business = await adminBusinessService.rejectAdminBusiness(req.params.id, reason, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, shared_1.serializeBusinessForAdmin)(business), 'Business rejected');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.rejectBusinessAccount = rejectBusinessAccount;
const updateBusinessStatus = async (req, res) => {
    try {
        const statusBody = req.body;
        const rawStatus = typeof statusBody.status === 'string' ? statusBody.status.trim() : '';
        const status = (0, businessStatus_1.normalizeBusinessStatus)(rawStatus);
        const reason = typeof statusBody.reason === 'string' ? statusBody.reason.trim() : '';
        if (status === businessStatus_2.BUSINESS_STATUS.LIVE) {
            return (0, exports.approveBusinessAccount)(req, res);
        }
        if (status === businessStatus_2.BUSINESS_STATUS.REJECTED) {
            if (!reason)
                req.body.reason = 'Rejected by admin';
            return (0, exports.rejectBusinessAccount)(req, res);
        }
        if (status === businessStatus_2.BUSINESS_STATUS.SUSPENDED) {
            const business = await adminBusinessService.suspendAdminBusiness(req.params.id, reason, getActorId(req), buildLogFn(req));
            return (0, adminBaseController_1.sendSuccessResponse)(res, (0, shared_1.serializeBusinessForAdmin)(business), 'Business suspended successfully');
        }
        return (0, adminBaseController_1.sendAdminError)(req, res, `Invalid status. Allowed: ${businessStatus_2.BUSINESS_STATUS.LIVE}, ${businessStatus_2.BUSINESS_STATUS.REJECTED}, ${businessStatus_2.BUSINESS_STATUS.SUSPENDED}`, 400);
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateBusinessStatus = updateBusinessStatus;
const updateBusinessByAdmin = async (req, res) => {
    try {
        const business = await adminBusinessService.updateAdminBusinessFields(req.params.id, req.body, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, shared_1.serializeBusinessForAdmin)(business), 'Business updated successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.updateBusinessByAdmin = updateBusinessByAdmin;
const deleteBusinessAccount = async (req, res) => {
    try {
        await adminBusinessService.deleteAdminBusiness(req.params.id, getActorId(req), buildLogFn(req));
        (0, adminBaseController_1.sendSuccessResponse)(res, { deleted: true }, 'Business deleted successfully');
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.deleteBusinessAccount = deleteBusinessAccount;
//# sourceMappingURL=adminBusinessController.js.map