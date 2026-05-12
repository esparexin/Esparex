import { Request, Response } from 'express';
import { TaxonomyAiService } from '../../../services/catalog/taxonomyAiService';
import { sendSuccessResponse, respond } from '../../../utils/respond';
import { sendErrorResponse } from '../../../utils/errorResponse';
import Brand from '../../../models/Brand';
import ProductModel from '../../../models/Model';
import logger from '../../../utils/logger';

export const analyzeBrandSuggestion = async (req: Request, res: Response) => {
    try {
        const { name } = req.body as { name?: string };
        if (!name) return sendErrorResponse(req, res, 400, 'Name is required');

        const result = await TaxonomyAiService.analyzeBrand(name);
        if (!result) return sendErrorResponse(req, res, 500, 'AI analysis failed');

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('[TaxonomyAiController] analyzeBrandSuggestion failed', { error });
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};

export const analyzeModelSuggestion = async (req: Request, res: Response) => {
    try {
        const { name, brandContext } = req.body as { name?: string, brandContext?: string };
        if (!name) return sendErrorResponse(req, res, 400, 'Name is required');

        const result = await TaxonomyAiService.analyzeModel(name, brandContext);
        if (!result) return sendErrorResponse(req, res, 500, 'AI analysis failed');

        sendSuccessResponse(res, result);
    } catch (error) {
        logger.error('[TaxonomyAiController] analyzeModelSuggestion failed', { error });
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};

export const getAiAnalysisQueue = async (req: Request, res: Response) => {
    try {
        const pendingBrands = await Brand.find({ 'aiAnalysis.confidence': { $exists: true }, approvalStatus: 'pending' }).sort({ createdAt: -1 });
        const pendingModels = await ProductModel.find({ 'aiAnalysis.confidence': { $exists: true }, approvalStatus: 'pending' }).sort({ createdAt: -1 });

        sendSuccessResponse(res, { brands: pendingBrands, models: pendingModels });
    } catch (error) {
        logger.error('[TaxonomyAiController] getAiAnalysisQueue failed', { error });
        sendErrorResponse(req, res, 500, 'Internal server error');
    }
};
