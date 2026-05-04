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
exports.adminGetListingCountsLegacyAdapter = exports.adminGetListingCounts = exports.adminResolveListingReport = exports.adminSoftDeleteListing = exports.adminExtendListing = exports.adminExpireListing = exports.adminDeactivateListing = exports.adminRejectListing = exports.adminApproveListing = exports.adminUpdateListing = exports.adminCreateListing = exports.adminGetListingById = exports.adminListListings = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const adminListingsService = __importStar(require("@esparex/core/services/AdminListingsService"));
const listingModerationSerializer_1 = require("./listingModerationSerializer");
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const getActorId = (req) => req.user?._id?.toString() ?? req.user?.id ?? '';
const getIp = (req) => ((req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0] ?? '').trim();
const getUserAgent = (req) => req.headers['user-agent'] || '';
/**
 * Builds the AdminLogFn callback for this request.
 * The service calls this to write audit logs without needing req.
 */
const buildLogFn = (req) => (action, targetType, targetId, metadata) => (0, adminLogger_1.logAdminActionDirect)(getActorId(req), action, targetType, targetId, metadata, getIp(req), getUserAgent(req));
const sendLifecycleResponse = (res, action, listing, message) => {
    (0, adminBaseController_1.sendSuccessResponse)(res, (0, listingModerationSerializer_1.serializeLifecycleActionResponse)({ action, listing, message }));
};
// ---------------------------------------------------------
// Controllers
// ---------------------------------------------------------
const adminListListings = async (req, res) => {
    try {
        const result = await adminListingsService.adminListListings(req.query);
        return (0, adminBaseController_1.sendSuccessResponse)(res, (0, listingModerationSerializer_1.serializeModerationListResponse)(result));
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminListListings = adminListListings;
const adminGetListingById = async (req, res) => {
    try {
        const listing = await adminListingsService.adminGetListingById(req.params.id);
        return (0, adminBaseController_1.sendSuccessResponse)(res, (0, listingModerationSerializer_1.serializeModerationDetailResponse)(listing));
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminGetListingById = adminGetListingById;
const adminCreateListing = async (req, res) => {
    try {
        const ad = await adminListingsService.adminCreateListing(getActorId(req), req.body, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, ad, 'Listing created successfully', 201);
    }
    catch (err) {
        return (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.adminCreateListing = adminCreateListing;
const adminUpdateListing = async (req, res) => {
    try {
        const updatedAd = await adminListingsService.adminUpdateListing(req.params.id, getActorId(req), req.body, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, updatedAd, 'Listing updated successfully');
    }
    catch (err) {
        return (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.adminUpdateListing = adminUpdateListing;
const adminApproveListing = async (req, res) => {
    try {
        const reviewVersion = typeof req.body?.reviewVersion === 'number'
            ? req.body.reviewVersion
            : undefined;
        const updated = await adminListingsService.adminApproveListing(req.params.id, getActorId(req), buildLogFn(req), reviewVersion);
        sendLifecycleResponse(res, 'approved', updated, 'Listing approved successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminApproveListing = adminApproveListing;
const adminRejectListing = async (req, res) => {
    try {
        const body = req.body;
        const rejectionReason = (body.rejectionReason ?? body.reason ?? '').trim();
        const updated = await adminListingsService.adminRejectListing(req.params.id, getActorId(req), rejectionReason, buildLogFn(req));
        sendLifecycleResponse(res, 'rejected', updated, 'Listing rejected successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminRejectListing = adminRejectListing;
const adminDeactivateListing = async (req, res) => {
    try {
        const { action, listing, message } = await adminListingsService.adminDeactivateListing(req.params.id, getActorId(req), buildLogFn(req));
        sendLifecycleResponse(res, action, listing, message);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminDeactivateListing = adminDeactivateListing;
const adminExpireListing = async (req, res) => {
    try {
        const updated = await adminListingsService.adminExpireListing(req.params.id, getActorId(req), buildLogFn(req));
        sendLifecycleResponse(res, 'expired', updated, 'Listing expired successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminExpireListing = adminExpireListing;
const adminExtendListing = async (req, res) => {
    try {
        const updated = await adminListingsService.adminExtendListing(req.params.id, getActorId(req), buildLogFn(req));
        sendLifecycleResponse(res, 'extended', updated, 'Listing expiry extended successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminExtendListing = adminExtendListing;
const adminSoftDeleteListing = async (req, res) => {
    try {
        const body = req.body;
        const { action, listing, message } = await adminListingsService.adminSoftDeleteListing(req.params.id, getActorId(req), buildLogFn(req), body?.hardDelete);
        sendLifecycleResponse(res, action, listing, message);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminSoftDeleteListing = adminSoftDeleteListing;
const adminResolveListingReport = async (req, res) => {
    try {
        const body = req.body;
        const listingResult = await adminListingsService.adminResolveListingReport(req.params.id, getActorId(req), body?.action ?? 'dismiss', body?.note, buildLogFn(req));
        return (0, adminBaseController_1.sendSuccessResponse)(res, listingResult, 'Reports resolved successfully');
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.adminResolveListingReport = adminResolveListingReport;
const adminGetListingCounts = async (req, res) => {
    try {
        const counts = await adminListingsService.adminGetListingCounts(req.query.listingType);
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, listingModerationSerializer_1.serializeListingCountsResponse)(counts));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error, 500);
    }
};
exports.adminGetListingCounts = adminGetListingCounts;
const adminGetListingCountsLegacyAdapter = async (req, res) => {
    try {
        const counts = await adminListingsService.adminGetListingCounts(req.query.listingType);
        (0, adminBaseController_1.sendSuccessResponse)(res, (0, listingModerationSerializer_1.serializeLegacyCountsAdapter)(counts));
    }
    catch (error) {
        (0, adminBaseController_1.sendAdminError)(req, res, error, 500);
    }
};
exports.adminGetListingCountsLegacyAdapter = adminGetListingCountsLegacyAdapter;
//# sourceMappingURL=adminListingsController.js.map