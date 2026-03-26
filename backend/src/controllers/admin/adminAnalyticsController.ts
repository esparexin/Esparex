import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { sendSuccessResponse, sendAdminError } from './adminBaseController';
import * as analyticsService from '../../services/AnalyticsService';

const getQueryString = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
    return undefined;
};


/**
 * Get time-series analytics data
 * Defaults to last 6 months
 */
export const getTimeSeriesAnalytics = async (req: Request, res: Response) => {
    try {
        const result = await analyticsService.getTimeSeriesAnalytics(6);
        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('Error fetching time-series analytics:', error);
        sendAdminError(req, res, error);
    }
};

/**
 * Get aggregated revenue summary (Daily)
 */
export const getRevenueSummary = async (req: Request, res: Response) => {
    try {
        const startDate = getQueryString(req.query.startDate);
        const endDate = getQueryString(req.query.endDate);
        const stats = await analyticsService.getRevenueSummary(startDate, endDate);
        sendSuccessResponse(res, stats);
    } catch (error) {
        sendAdminError(req, res, error);
    }
};

/**
 * Get revenue breakdown by category
 */
export const getRevenueByCategory = async (req: Request, res: Response) => {
    try {
        const startDate = getQueryString(req.query.startDate);
        const endDate = getQueryString(req.query.endDate);
        const categoryMap = await analyticsService.getRevenueByCategory(startDate, endDate);
        sendSuccessResponse(res, categoryMap);
    } catch (error) {
        sendAdminError(req, res, error);
    }
};
