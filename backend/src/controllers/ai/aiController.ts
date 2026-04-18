import logger from '../../utils/logger';
import { Request, Response } from 'express';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';
import {
    AIRequestBody,
    executeAiRequest,
    getAiContext,
    isAIRequestType
} from '../../services/AiService';

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
