"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReportStatus = exports.resolveReport = exports.getReportedAdById = exports.getReportedAds = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logger_1 = __importDefault(require("@esparex/core/utils/logger"));
const adminLogger_1 = require("@esparex/core/utils/adminLogger");
const StatusMutationService_1 = require("@esparex/core/services/StatusMutationService");
const actor_1 = require("@shared/enums/actor");
const adStatus_1 = require("@shared/enums/adStatus");
const reportStatus_1 = require("@shared/enums/reportStatus");
const requestParams_1 = require("@esparex/core/utils/requestParams");
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const ReportService_1 = require("@esparex/core/services/ReportService");
const AdDetailService_1 = require("@esparex/core/services/ad/AdDetailService");
const getReportedAds = async (req, res) => {
    try {
        const { status, reason, q } = req.query;
        const { page, limit, skip } = (0, adminBaseController_1.getPaginationParams)(req);
        const reportedResult = await (0, AdDetailService_1.getReportedAdsAggregation)({
            status: typeof status === 'string' ? status : undefined,
            reason: typeof reason === 'string' ? reason : undefined,
            search: typeof q === 'string' ? q : undefined
        }, { skip, limit });
        const data = reportedResult.data;
        const total = reportedResult.total;
        (0, adminBaseController_1.sendPaginatedResponse)(res, data, total, page, limit);
    }
    catch (err) {
        logger_1.default.error('GET_REPORTED_ADS_ERROR', err);
        (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.getReportedAds = getReportedAds;
const getReportedAdById = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id)
            return;
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Invalid Report ID', 400);
        }
        const report = await (0, ReportService_1.getAdminReportById)(id);
        if (!report)
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Report not found', 404);
        (0, adminBaseController_1.sendSuccessResponse)(res, report);
    }
    catch (err) {
        (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.getReportedAdById = getReportedAdById;
const resolveReport = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id)
            return;
        const { action, note } = req.body;
        const report = await (0, ReportService_1.findReportForUpdate)(id);
        if (!report)
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Report not found', 404);
        if (action === 'take_down') {
            if (!report.adId) {
                return (0, adminBaseController_1.sendAdminError)(req, res, 'Cannot take down: report has no legacy adId', 400);
            }
            await (0, StatusMutationService_1.mutateStatus)({
                domain: 'ad',
                entityId: report.adId.toString(),
                toStatus: adStatus_1.AD_STATUS.REJECTED,
                actor: { type: actor_1.ACTOR_TYPE.ADMIN, id: req.user._id.toString() },
                reason: `Taken down via report: ${report.reason}. ${note || ''}`,
                patch: {
                    rejectionReason: `Taken down via report: ${report.reason}. ${note || ''}`
                }
            });
            report.status = reportStatus_1.REPORT_STATUS.RESOLVED;
        }
        else if (action === 'dismiss') {
            report.status = reportStatus_1.REPORT_STATUS.DISMISSED;
        }
        else if (action === 'warn_user') {
            report.status = reportStatus_1.REPORT_STATUS.REVIEWED;
        }
        report.resolution = note;
        report.resolvedBy = new mongoose_1.default.Types.ObjectId(req.user._id);
        report.resolvedAt = new Date();
        await (0, ReportService_1.saveReport)(report);
        await (0, adminLogger_1.logAdminAction)(req, 'RESOLVE_REPORT', 'Report', id, { action, note });
        (0, adminBaseController_1.sendSuccessResponse)(res, report, 'Report resolved successfully');
    }
    catch (err) {
        (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.resolveReport = resolveReport;
const updateReportStatus = async (req, res) => {
    try {
        const id = (0, requestParams_1.getSingleParam)(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id)
            return;
        const reportBody = req.body;
        const status = typeof reportBody.status === 'string' ? reportBody.status.trim().toLowerCase() : '';
        const note = typeof reportBody.note === 'string' ? reportBody.note.trim() : undefined;
        if (![reportStatus_1.REPORT_STATUS.RESOLVED, reportStatus_1.REPORT_STATUS.DISMISSED].includes(status)) {
            return (0, adminBaseController_1.sendAdminError)(req, res, `Invalid report status. Allowed: ${reportStatus_1.REPORT_STATUS.RESOLVED}, ${reportStatus_1.REPORT_STATUS.DISMISSED}`, 400);
        }
        const report = await (0, ReportService_1.updateReportById)(id, {
            status,
            resolution: note,
            resolvedBy: new mongoose_1.default.Types.ObjectId(req.user._id),
            resolvedAt: new Date(),
        });
        if (!report)
            return (0, adminBaseController_1.sendAdminError)(req, res, 'Report not found', 404);
        await (0, adminLogger_1.logAdminAction)(req, 'UPDATE_REPORT_STATUS', 'Report', id, { status, note });
        (0, adminBaseController_1.sendSuccessResponse)(res, report, 'Report status updated successfully');
    }
    catch (err) {
        (0, adminBaseController_1.sendAdminError)(req, res, err);
    }
};
exports.updateReportStatus = updateReportStatus;
//# sourceMappingURL=adminReportsController.js.map