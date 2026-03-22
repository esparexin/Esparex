import { Request, Response } from 'express';
import SavedAd from '../../models/SavedAd';
import Ad from '../../models/Ad';
import { respond } from '../../utils/respond';
import { sendErrorResponse } from '../../utils/errorResponse';
import { SavedAdRequest, getUserId } from './shared';
import { recordAdAnalyticsEvent } from '../../services/TrendingService';

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

        const ad = await Ad.findById(finalAdId);
        if (!ad) {
            return sendErrorResponse(req, res, 404, 'Ad not found');
        }

        await SavedAd.create({ userId, adId: finalAdId });
        void recordAdAnalyticsEvent(finalAdId, 'favorite');
        void Ad.findByIdAndUpdate(finalAdId, { $inc: { 'views.favorites': 1 } });

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
        const { adId } = savedAdReq.params;

        const deleted = await SavedAd.findOneAndDelete({ userId, adId });
        if (deleted) {
            // Decrement counter but never go below 0
            void Ad.findOneAndUpdate(
                { _id: adId, 'views.favorites': { $gt: 0 } },
                { $inc: { 'views.favorites': -1 } }
            );
        }
        res.json(respond({ success: true, message: 'Ad removed from saved' }));
    } catch {
        sendErrorResponse(req, res, 500, 'Failed to unsave ad');
    }
};
