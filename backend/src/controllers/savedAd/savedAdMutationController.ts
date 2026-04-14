import { Request, Response } from 'express';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SavedAdRequest, getUserId } from './shared';
import { saveAd as saveAdService, unsaveAd as unsaveAdService } from '../../services/SavedAdService';

export const saveAd = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const { adId } = req.body;

        const finalAdId = adId || savedAdReq.params.adId;

        if (!finalAdId) {
            return sendErrorResponse(req, res, 400, 'Ad ID is required');
        }

        const result = await saveAdService(userId, finalAdId);
        if (!result) {
            return sendErrorResponse(req, res, 404, 'Ad not found');
        }

        res.status(201).json(respond({ success: true, message: 'Ad saved successfully' }));
    } catch (error: unknown) {
        const duplicateKey = typeof error === 'object'
            && error !== null
            && 'code' in error
            && (error as { code?: unknown }).code === 11000;
        if (duplicateKey) {
            return sendErrorResponse(req, res, 400, 'Ad already saved');
        }
        sendErrorResponse(req, res, 500, 'Failed to save ad');
    }
};

export const unsaveAd = async (req: Request, res: Response) => {
    try {
        const savedAdReq = req as SavedAdRequest;
        const userId = getUserId(savedAdReq);
        if (!userId) return sendErrorResponse(req, res, 401, 'Unauthorized');
        const adId = savedAdReq.params.adId as string;
        await unsaveAdService(userId, adId);
        res.json(respond({ success: true, message: 'Ad removed from saved' }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to unsave ad');
    }
};
