import logger from '@esparex/core/utils/logger';
import { Request, Response } from 'express';
import { sendErrorResponse } from "@esparex/core/utils/errorResponse";
import { respond } from "@esparex/core/utils/respond";
import {
    AIRequestBody,
    executeAiRequest,
    getAiContext,
    isAIRequestType
} from '@esparex/core/services/AiService';
import { TaxonomyAiService } from '@esparex/core/services/catalog/taxonomyAiService';
import { validateBrandSuggestion, validateModelSuggestion } from '@esparex/core/controllers/admin/catalog';

export const catalogSuggest = async (req: Request, res: Response) => {
    try {
        const { image, contextText } = getAiContext(req.body as AIRequestBody);
        if (!image && !contextText) {
            sendErrorResponse(req, res, 400, 'Image or context text is required for AI identification');
            return;
        }

        const result = await executeAiRequest({
            type: 'identify',
            context: {},
            image,
            contextText
        });

        if (result.ok) {
            res.json(respond({ success: true, data: result.data }));
            return;
        }

        sendErrorResponse(req, res, result.status, result.error, {
            ...(result.code ? { code: result.code } : {}),
            ...(result.details ? { details: result.details } : {}),
        });
    } catch (error) {
        logger.error('[AI Controller] catalogSuggest failed', { error: (error as Error).message });
        sendErrorResponse(req, res, 500, 'Internal AI processing error');
    }
};

export const generate = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            sendErrorResponse(req, res, 401, 'Unauthorized');
            return;
        }

        const body = (req.body || {}) as AIRequestBody;
        if (!isAIRequestType(body?.type)) {
            sendErrorResponse(req, res, 400, 'Unsupported AI request type');
            return;
        }

        const { context, image, contextText } = getAiContext(body);
        const result = await executeAiRequest({
            type: body.type,
            context,
            image,
            contextText
        });

        if (result.ok) {
            res.json(respond({ success: true, data: result.data }));
            return;
        }

        sendErrorResponse(req, res, result.status, result.error, {
            ...(result.code ? { code: result.code } : {}),
            ...(result.details ? { details: result.details } : {}),
        });
        return;
    } catch (error: unknown) {
        const err = error as Error;
        logger.error('AI Service Error:', err);
        sendErrorResponse(req, res, 500, 'AI Service Error');
    }
};

export const analyzeTaxonomy = async (req: Request, res: Response) => {
    try {
        const { input, brand, category } = req.body as { input: string; brand?: string; category?: string };
        if (!input || input.length < 3) {
            return sendErrorResponse(req, res, 400, 'Input text is required (min 3 chars)');
        }

        const result = await TaxonomyAiService.analyzeModel(input, brand);
        res.json(respond({ success: true, data: result }));
    } catch (error) {
        logger.error('[AI Controller] analyzeTaxonomy failed', error);
        sendErrorResponse(req, res, 500, 'Taxonomy analysis failed');
    }
};

export const suggestBrand = async (req: Request, res: Response) => {
    try {
        const { name } = req.body as { name: string };
        if (!name) return sendErrorResponse(req, res, 400, 'Brand name is required');
        
        const { cleanName } = validateBrandSuggestion(name);
        const result = await TaxonomyAiService.analyzeBrand(cleanName);
        res.json(respond({ success: true, data: result }));
    } catch (error) {
        logger.error('[AI Controller] suggestBrand failed', error);
        sendErrorResponse(req, res, 500, 'Brand suggestion analysis failed');
    }
};

export const suggestModel = async (req: Request, res: Response) => {
    try {
        const { name, brandName } = req.body as { name: string; brandName?: string };
        if (!name) return sendErrorResponse(req, res, 400, 'Model name is required');

        const { cleanName } = validateModelSuggestion(name);
        const result = await TaxonomyAiService.analyzeModel(cleanName, brandName);
        res.json(respond({ success: true, data: result }));
    } catch (error) {
        logger.error('[AI Controller] suggestModel failed', error);
        sendErrorResponse(req, res, 500, 'Model suggestion analysis failed');
    }
};
