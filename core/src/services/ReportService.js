"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoHideAdIfOverThreshold = exports.bulkResolveReports = exports.updateReportById = exports.saveReport = exports.findReportForUpdate = exports.getAdminReportById = exports.countActiveReports = exports.createReport = exports.checkBusinessExists = exports.checkUserExists = exports.checkAdExists = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Report_1 = __importDefault(require("@core/models/Report"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const User_1 = __importDefault(require("@core/models/User"));
const Business_1 = __importDefault(require("@core/models/Business"));
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
const ACTIVE_REPORT_STATUSES = ['open', 'pending', 'reviewed'];
const checkAdExists = async (adId) => {
    return Ad_1.default.findById(adId).select('_id title').lean();
};
exports.checkAdExists = checkAdExists;
const checkUserExists = async (userId) => {
    return User_1.default.exists({
        _id: new mongoose_1.default.Types.ObjectId(userId),
        isDeleted: { $ne: true },
    });
};
exports.checkUserExists = checkUserExists;
const checkBusinessExists = async (businessId) => {
    return Business_1.default.exists({
        _id: new mongoose_1.default.Types.ObjectId(businessId),
        isDeleted: { $ne: true },
    });
};
exports.checkBusinessExists = checkBusinessExists;
const createReport = async (payload) => {
    return Report_1.default.create(payload);
};
exports.createReport = createReport;
const countActiveReports = async (targetType, targetId) => {
    return Report_1.default.countDocuments({
        targetType,
        targetId,
        status: { $in: ACTIVE_REPORT_STATUSES },
    });
};
exports.countActiveReports = countActiveReports;
const getAdminReportById = async (id) => {
    return Report_1.default.findById(id)
        .populate('adId')
        .populate('reportedBy', 'firstName lastName email')
        .populate('resolvedBy', 'firstName lastName');
};
exports.getAdminReportById = getAdminReportById;
const findReportForUpdate = async (id) => {
    return Report_1.default.findById(id);
};
exports.findReportForUpdate = findReportForUpdate;
const saveReport = async (report) => {
    return report.save();
};
exports.saveReport = saveReport;
const updateReportById = async (id, fields) => {
    return Report_1.default.findByIdAndUpdate(id, fields, { new: true });
};
exports.updateReportById = updateReportById;
const bulkResolveReports = async (listingObjectId, resolvedStatus, note, actorId) => {
    // eslint-disable-next-line esparex/no-status-mutation-outside-status-mutation-service
    return Report_1.default.updateMany({
        $or: [
            { targetType: 'ad', targetId: listingObjectId },
            { adId: listingObjectId },
        ],
        status: { $in: ACTIVE_REPORT_STATUSES },
    }, {
        $set: {
            status: resolvedStatus,
            resolution: note,
            resolvedBy: new mongoose_1.default.Types.ObjectId(actorId),
            resolvedAt: new Date(),
        },
    });
};
exports.bulkResolveReports = bulkResolveReports;
const autoHideAdIfOverThreshold = async (adId, uniqueReports, threshold) => {
    if (uniqueReports < threshold)
        return;
    await Ad_1.default.findByIdAndUpdate(adId, {
        moderationStatus: 'community_hidden',
        moderationReason: `Auto-hidden: Received ${uniqueReports} community reports (threshold: ${threshold}).`,
    });
    setImmediate(() => {
        (0, redisCache_1.invalidateAdFeedCaches)().catch((err) => {
            logger_1.default.error('Failed to clear feed cache after community auto-hide', {
                error: String(err), adId: adId.toString(),
            });
        });
        (0, redisCache_1.invalidatePublicAdCache)(adId.toString()).catch((err) => {
            logger_1.default.error('Failed to clear ad cache after community auto-hide', {
                error: String(err), adId: adId.toString(),
            });
        });
    });
    logger_1.default.warn('[FeedVisibility] Ad auto-hidden by report threshold', {
        adId: adId.toString(), uniqueReports, threshold,
    });
};
exports.autoHideAdIfOverThreshold = autoHideAdIfOverThreshold;
//# sourceMappingURL=ReportService.js.map