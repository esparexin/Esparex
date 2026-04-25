import { Request, Response } from 'express';
import mongoose from 'mongoose';
import logger from '@core/utils/logger';
import { logAdminAction } from '@core/utils/adminLogger';
import { mutateStatus } from '@core/services/StatusMutationService';
import { ACTOR_TYPE } from "@shared/enums/actor";
import { AD_STATUS } from "@shared/enums/adStatus";
import { REPORT_STATUS } from "@shared/enums/reportStatus";
import { getSingleParam } from '@core/utils/requestParams';
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError
} from '@core/utils/adminBaseController';
import {
    getAdminReportById,
    findReportForUpdate,
    saveReport,
    updateReportById,
} from '@core/services/ReportService';
import { getReportedAdsAggregation } from '@core/services/ad/AdDetailService';

export const getReportedAds = async (req: Request, res: Response) => {
    try {
        const { status, reason, q } = req.query;
        const { page, limit, skip } = getPaginationParams(req);

        const reportedResult = await getReportedAdsAggregation(
            {
                status: typeof status === 'string' ? status : undefined,
                reason: typeof reason === 'string' ? reason : undefined,
                search: typeof q === 'string' ? q : undefined
            },
            { skip, limit }
        );
        const data = reportedResult.data as unknown[];
        const total = reportedResult.total;

        sendPaginatedResponse(res, data, total, page, limit);
    } catch (err) {
        logger.error('GET_REPORTED_ADS_ERROR', err);
        sendAdminError(req, res, err);
    }
};

export const getReportedAdById = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendAdminError(req, res, 'Invalid Report ID', 400);
        }

        const report = await getAdminReportById(id);

        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        sendSuccessResponse(res, report);
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const resolveReport = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;
        const { action, note } = req.body as { action?: string; note?: string };

        const report = await findReportForUpdate(id);
        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        if (action === 'take_down') {
            if (!report.adId) {
                return sendAdminError(req, res, 'Cannot take down: report has no legacy adId', 400);
            }
            await mutateStatus({
                domain: 'ad',
                entityId: report.adId.toString(),
                toStatus: AD_STATUS.REJECTED,
                actor: { type: ACTOR_TYPE.ADMIN, id: req.user!._id.toString() },
                reason: `Taken down via report: ${report.reason}. ${note || ''}`,
                patch: {
                    rejectionReason: `Taken down via report: ${report.reason}. ${note || ''}`
                }
            });
            report.status = REPORT_STATUS.RESOLVED;
        } else if (action === 'dismiss') {
            report.status = REPORT_STATUS.DISMISSED;
        } else if (action === 'warn_user') {
            report.status = REPORT_STATUS.REVIEWED;
        }

        report.resolution = note;
        report.resolvedBy = new mongoose.Types.ObjectId(req.user!._id as string);
        report.resolvedAt = new Date();
        await saveReport(report);

        await logAdminAction(req, 'RESOLVE_REPORT', 'Report', id, { action, note });
        sendSuccessResponse(res, report, 'Report resolved successfully');
    } catch (err) {
        sendAdminError(req, res, err);
    }
};

export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid Report ID' });
        if (!id) return;

        const reportBody = req.body as { status?: unknown; note?: unknown };
        const status = typeof reportBody.status === 'string' ? reportBody.status.trim().toLowerCase() : '';
        const note = typeof reportBody.note === 'string' ? reportBody.note.trim() : undefined;

        if (![REPORT_STATUS.RESOLVED as string, REPORT_STATUS.DISMISSED as string].includes(status)) {
            return sendAdminError(req, res, `Invalid report status. Allowed: ${REPORT_STATUS.RESOLVED}, ${REPORT_STATUS.DISMISSED}`, 400);
        }

        const report = await updateReportById(id, {
            status,
            resolution: note,
            resolvedBy: new mongoose.Types.ObjectId(req.user!._id as string),
            resolvedAt: new Date(),
        });
        if (!report) return sendAdminError(req, res, 'Report not found', 404);

        await logAdminAction(req, 'UPDATE_REPORT_STATUS', 'Report', id, { status, note });
        sendSuccessResponse(res, report, 'Report status updated successfully');
    } catch (err: unknown) {
        sendAdminError(req, res, err);
    }
};
