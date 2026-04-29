import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '@core/services/AnalyticsService';
import { sendSuccessResponse } from '@core/utils/adminBaseController';

export const getOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const overview = await AnalyticsService.getOverview();
        return sendSuccessResponse(res, overview, "Analytics overview fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const getAdminPerformance = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
        const performance = await AnalyticsService.getAdminPerformance(days);
        return sendSuccessResponse(res, performance, "Admin performance fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = req.query.days ? parseInt(req.query.days as string, 10) : 7;
        const health = await AnalyticsService.getSystemHealth(days);
        return sendSuccessResponse(res, health, "System health fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};

export const getAnomalies = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const anomalies = await AnalyticsService.getAnomalies();
        return sendSuccessResponse(res, anomalies, "Anomalies fetched successfully", 200);
    } catch (error) {
        next(error);
    }
};
