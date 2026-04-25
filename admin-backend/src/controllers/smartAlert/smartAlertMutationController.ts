import { Request, Response } from 'express';
import { respond } from "@core/utils/respond";
import { ApiResponse } from '../../../../shared/types/Api';
import { sendErrorResponse } from "@core/utils/errorResponse";
import { AppError } from '@core/utils/AppError';
import {
    getErrorMessage,
    getRequiredAlertId,
    toAlertContract
} from './shared';
import {
    createSmartAlertMutation,
    deleteSmartAlertMutation,
    toggleSmartAlertStatusMutation,
    updateSmartAlertMutation,
} from '@core/services/smartAlert/SmartAlertMutationService';

const sendSmartAlertError = (req: Request, res: Response, error: unknown) => {
    const appError = error instanceof AppError ? error : null;
    sendErrorResponse(req, res, appError?.statusCode ?? 400, getErrorMessage(error), {
        ...(appError?.code ? { code: appError.code } : {}),
        ...(appError?.details !== undefined ? { details: appError.details } : {}),
    });
};

export const createSmartAlert = async (req: Request, res: Response) => {
    try {
        const alert = await createSmartAlertMutation({
            user: req.user,
            body: req.body as Record<string, unknown>,
        });

        res.status(201).json(respond<ApiResponse<unknown>>({
            success: true,
            data: toAlertContract(alert),
        }));
    } catch (error: unknown) {
        sendSmartAlertError(req, res, error);
    }
};

export const updateSmartAlert = async (req: Request, res: Response) => {
    try {
        const alert = await updateSmartAlertMutation({
            alertId: getRequiredAlertId(req),
            user: req.user,
            body: req.body as Record<string, unknown>,
        });

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Alert updated successfully',
            data: toAlertContract(alert),
        }));
    } catch (error: unknown) {
        sendSmartAlertError(req, res, error);
    }
};

export const deleteSmartAlert = async (req: Request, res: Response) => {
    try {
        const result = await deleteSmartAlertMutation({
            alertId: getRequiredAlertId(req),
            user: req.user,
            admin: req.admin as { id?: string; _id?: string } | undefined,
        });

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: 'Alert deleted successfully',
            data: result,
        }));
    } catch (error: unknown) {
        sendSmartAlertError(req, res, error);
    }
};

export const toggleSmartAlertStatus = async (req: Request, res: Response) => {
    try {
        const alert = await toggleSmartAlertStatusMutation({
            alertId: getRequiredAlertId(req),
            user: req.user,
        });

        res.json(respond<ApiResponse<unknown>>({
            success: true,
            message: `Alert ${alert.isActive ? 'activated' : 'deactivated'} successfully`,
            data: toAlertContract(alert),
        }));
    } catch (error: unknown) {
        sendSmartAlertError(req, res, error);
    }
};
