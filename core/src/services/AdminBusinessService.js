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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminBusiness = exports.updateAdminBusinessFields = exports.suspendAdminBusiness = exports.rejectAdminBusiness = exports.approveAdminBusiness = exports.getBusinessAccountsQuery = exports.getAdminBusinessAccountsData = exports.cascadeExpireBusinessListings = exports.findBusinessForAdmin = exports.getAdminBusinessById = exports.transformBusinessDocs = exports.getBusinessOverview = void 0;
const Business_1 = __importDefault(require("@core/models/Business"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const constants_1 = require("@core/config/constants");
const businessStatus_1 = require("@core/utils/businessStatus");
const businessStatus_2 = require("@core/constants/enums/businessStatus");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const listingType_1 = require("@core/constants/enums/listingType");
const actor_1 = require("@core/constants/enums/actor");
const businessSerializer_1 = require("@core/utils/businessSerializer");
const StatusMutationService_1 = require("./StatusMutationService");
const AppError_1 = require("@core/utils/AppError");
const NotificationService_1 = require("./NotificationService");
const TrustService_1 = require("./TrustService");
const LocationNormalizer_1 = require("./location/LocationNormalizer");
const businessService = __importStar(require("./BusinessService"));
/**
 * Service for advanced admin-only business management and metrics.
 */
const getBusinessOverview = async () => {
    const thirtyDaysFromNow = new Date(Date.now() + constants_1.GOVERNANCE.BUSINESS.AUTO_EXPIRE_CHECK_DAYS * constants_1.MS_IN_DAY);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const [live, pending, suspended, rejected, deleted, total, expiringSoon, timeline, topCities,] = await Promise.all([
        Business_1.default.countDocuments({ status: businessStatus_2.BUSINESS_STATUS.LIVE }),
        Business_1.default.countDocuments({ status: businessStatus_2.BUSINESS_STATUS.PENDING }),
        Business_1.default.countDocuments({ status: businessStatus_2.BUSINESS_STATUS.SUSPENDED }),
        Business_1.default.countDocuments({ status: businessStatus_2.BUSINESS_STATUS.REJECTED }),
        Business_1.default.countDocuments({ isDeleted: true }).setOptions({ withDeleted: true }),
        Business_1.default.countDocuments({}).setOptions({ withDeleted: true }),
        Business_1.default.countDocuments({
            status: businessStatus_1.publishedBusinessStatusQuery,
            expiresAt: { $lte: thirtyDaysFromNow, $gte: new Date() },
            isDeleted: false,
        }),
        Business_1.default.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        Business_1.default.aggregate([
            { $match: { isDeleted: { $ne: true }, 'location.city': { $exists: true, $ne: '' } } },
            { $group: { _id: '$location.city', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 5 },
            { $project: { _id: 0, city: '$_id', count: 1 } },
        ]),
    ]);
    return {
        total,
        pending,
        live,
        suspended,
        rejected,
        deleted,
        expiringSoon,
        analytics: {
            timeline,
            topCities,
        },
    };
};
exports.getBusinessOverview = getBusinessOverview;
const transformBusinessDocs = (items) => items.map((doc) => {
    const serialized = (0, businessSerializer_1.serializeBusinessForAdmin)(doc);
    return {
        ...serialized,
        businessPhone: serialized.mobile,
        businessEmail: serialized.email,
    };
});
exports.transformBusinessDocs = transformBusinessDocs;
const getAdminBusinessById = async (id) => {
    return Business_1.default.findOne({ _id: id })
        .setOptions({ withDeleted: true })
        .populate('userId');
};
exports.getAdminBusinessById = getAdminBusinessById;
const findBusinessForAdmin = async (id) => {
    return Business_1.default.findById(id);
};
exports.findBusinessForAdmin = findBusinessForAdmin;
const cascadeExpireBusinessListings = async (businessId, actor, reason) => {
    const normalizedBusinessId = typeof businessId === 'string' && businessId.trim()
        ? businessId.trim()
        : businessId && typeof businessId === 'object' && typeof businessId.toString === 'function'
            ? businessId.toString()
            : undefined;
    if (!normalizedBusinessId) {
        return 0;
    }
    const normalizedActor = {
        type: actor.type === actor_1.ACTOR_TYPE.ADMIN
            ? actor_1.ACTOR_TYPE.ADMIN
            : actor.type === actor_1.ACTOR_TYPE.SYSTEM
                ? actor_1.ACTOR_TYPE.SYSTEM
                : actor_1.ACTOR_TYPE.USER,
        id: actor.id,
    };
    const listings = await Ad_1.default.find({ businessId: normalizedBusinessId, status: { $ne: listingStatus_1.LISTING_STATUS.EXPIRED } }).select('_id listingType');
    if (listings.length > 0) {
        await (0, StatusMutationService_1.mutateStatuses)(listings.map((l) => ({
            domain: (l.listingType === listingType_1.LISTING_TYPE.SERVICE
                ? listingType_1.LISTING_TYPE.SERVICE
                : l.listingType === listingType_1.LISTING_TYPE.SPARE_PART
                    ? 'spare_part_listing'
                    : listingType_1.LISTING_TYPE.AD),
            entityId: l._id.toString(),
            toStatus: listingStatus_1.LISTING_STATUS.EXPIRED,
            actor: normalizedActor,
            reason,
        })));
    }
    return listings.length;
};
exports.cascadeExpireBusinessListings = cascadeExpireBusinessListings;
const getAdminBusinessAccountsData = (params) => {
    const { status, locationId } = params;
    const adminQuery = (0, exports.getBusinessAccountsQuery)(status);
    if (locationId)
        adminQuery.locationId = locationId;
    return Promise.resolve({ adminQuery });
};
exports.getAdminBusinessAccountsData = getAdminBusinessAccountsData;
const getBusinessAccountsQuery = (status) => {
    const adminQuery = {};
    const normalizedStatus = status === 'approved' || status === 'active'
        ? businessStatus_2.BUSINESS_STATUS.LIVE
        : status;
    if (normalizedStatus && normalizedStatus !== 'all') {
        if (normalizedStatus === 'expiring') {
            const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            adminQuery.status = businessStatus_1.publishedBusinessStatusQuery;
            adminQuery.expiresAt = { $lte: sevenDaysFromNow, $gte: new Date() };
        }
        else if (normalizedStatus === businessStatus_2.BUSINESS_STATUS.DELETED) {
            adminQuery.isDeleted = true;
        }
        else {
            adminQuery.status = normalizedStatus;
        }
    }
    return adminQuery;
};
exports.getBusinessAccountsQuery = getBusinessAccountsQuery;
const approveAdminBusiness = async (id, actorId, logFn) => {
    const business = await businessService.approveBusiness(id, actorId);
    if (!business) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    const expiresAt = (business).expiresAt;
    await logFn('APPROVE_BUSINESS', 'Business', id, { expiresAt });
    await (0, NotificationService_1.dispatchTemplatedNotification)(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_APPROVED', { name: business.name }, { businessId: business._id.toString(), status: businessStatus_2.BUSINESS_STATUS.LIVE });
    setImmediate(() => void (0, TrustService_1.recalculateTrustScore)(business.userId).catch(() => { }));
    return business;
};
exports.approveAdminBusiness = approveAdminBusiness;
const rejectAdminBusiness = async (id, reason, actorId, logFn) => {
    if (!reason) {
        throw new AppError_1.AppError('Rejection reason is required', 400);
    }
    const business = await businessService.rejectBusiness(id, reason, actorId);
    if (!business) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    await logFn('REJECT_BUSINESS', 'Business', id, { reason });
    await (0, NotificationService_1.dispatchTemplatedNotification)(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_REJECTED', { name: business.name, reason }, { businessId: business._id.toString(), status: businessStatus_2.BUSINESS_STATUS.REJECTED });
    const actor = { type: actor_1.ACTOR_TYPE.ADMIN, id: actorId };
    await (0, exports.cascadeExpireBusinessListings)(business._id, actor, `Cascaded from business rejection: ${reason}`);
    return business;
};
exports.rejectAdminBusiness = rejectAdminBusiness;
const suspendAdminBusiness = async (id, reason, actorId, logFn) => {
    const finalReason = reason || 'Suspended by admin';
    const business = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'business',
        entityId: id,
        toStatus: businessStatus_2.BUSINESS_STATUS.SUSPENDED,
        actor: { type: actor_1.ACTOR_TYPE.ADMIN, id: actorId },
        reason: finalReason,
        patch: {
            rejectionReason: finalReason
        }
    });
    if (!business) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    await logFn('SUSPEND_BUSINESS', 'Business', id, { reason: finalReason });
    return business;
};
exports.suspendAdminBusiness = suspendAdminBusiness;
const updateAdminBusinessFields = async (id, rawBody, actorId, logFn) => {
    const allowedFields = [
        'name', 'description', 'mobile', 'email', 'website',
        'gstNumber', 'registrationNumber', 'location', 'businessTypes',
    ];
    const patch = {};
    for (const field of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(rawBody, field)) {
            patch[field] = rawBody[field];
        }
    }
    if (Object.keys(patch).length === 0) {
        throw new AppError_1.AppError('No valid fields provided for update', 400);
    }
    const existingBusiness = await (0, exports.findBusinessForAdmin)(id);
    if (!existingBusiness) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    if (patch.location && typeof patch.location === 'object' && !Array.isArray(patch.location)) {
        const incomingLocation = patch.location;
        const bizDoc = existingBusiness;
        const currentLocation = bizDoc.location;
        const normalizedLocation = await (0, LocationNormalizer_1.normalizeLocation)({
            locationId: incomingLocation.locationId || bizDoc.locationId,
            city: incomingLocation.city || currentLocation?.city,
            state: incomingLocation.state || currentLocation?.state,
            country: incomingLocation.country || currentLocation?.country || 'India',
            display: incomingLocation.display || incomingLocation.address,
            coordinates: incomingLocation.coordinates,
            address: incomingLocation.address,
            pincode: incomingLocation.pincode || currentLocation?.pincode,
        });
        const resolvedLocationPayload = businessService.buildBusinessLocationPayload({
            currentLocation,
            incomingLocation,
            normalizedLocation,
            fallbackLocationId: bizDoc.locationId,
        });
        patch.location = resolvedLocationPayload.location;
        if (resolvedLocationPayload.locationId) {
            patch.locationId = resolvedLocationPayload.locationId;
        }
    }
    const business = await Business_1.default.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).populate('userId');
    if (!business) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    await logFn('UPDATE_BUSINESS', 'Business', id, { patch });
    return business;
};
exports.updateAdminBusinessFields = updateAdminBusinessFields;
const deleteAdminBusiness = async (id, actorId, logFn) => {
    const business = await (0, exports.findBusinessForAdmin)(id);
    if (!business) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    const bizForDelete = business;
    const businessName = bizForDelete.name;
    const userId = bizForDelete.userId.toString();
    const actor = { type: actor_1.ACTOR_TYPE.ADMIN, id: actorId };
    const cascadedCount = await (0, exports.cascadeExpireBusinessListings)(business._id, actor, 'Cascaded from business deletion');
    const deleted = await businessService.softDeleteBusiness(id);
    if (!deleted) {
        throw new AppError_1.AppError('Business not found', 404);
    }
    await logFn('DELETE_BUSINESS', 'Business', id, {
        businessName,
        cascadedListings: cascadedCount
    });
    await (0, NotificationService_1.dispatchTemplatedNotification)(userId, 'BUSINESS_STATUS', 'BUSINESS_REMOVED', { name: businessName }, { businessId: id, status: businessStatus_2.BUSINESS_STATUS.DELETED });
    return true;
};
exports.deleteAdminBusiness = deleteAdminBusiness;
//# sourceMappingURL=AdminBusinessService.js.map