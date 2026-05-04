"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPhoneRequests = exports.getPhoneRevealLogs = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const AdminRevealService_1 = require("@esparex/core/services/AdminRevealService");
/**
 * Get all phone reveal logs for auditing (Admin only)
 */
const getPhoneRevealLogs = async (req, res) => {
    try {
        const { buyerId, sellerId, entityId, entityType, ipAddress } = req.query;
        const filters = {};
        if (buyerId)
            filters.buyerId = buyerId;
        if (sellerId)
            filters.sellerId = sellerId;
        if (entityId)
            filters.entityId = entityId;
        if (entityType)
            filters.entityType = entityType;
        if (ipAddress)
            filters.ipAddress = ipAddress;
        return (0, AdminRevealService_1.getPhoneRevealLogsPaginated)(req, res, filters);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getPhoneRevealLogs = getPhoneRevealLogs;
/**
 * Get all phone requests across the platform (Admin only)
 */
const getAllPhoneRequests = async (req, res) => {
    try {
        const { status } = req.query;
        const filters = {};
        if (status)
            filters.status = status;
        return (0, AdminRevealService_1.getPhoneRequestsPaginated)(req, res, filters);
    }
    catch (error) {
        return (0, adminBaseController_1.sendAdminError)(req, res, error);
    }
};
exports.getAllPhoneRequests = getAllPhoneRequests;
//# sourceMappingURL=adminRevealController.js.map