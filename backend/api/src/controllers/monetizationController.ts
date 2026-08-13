import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { MonetizationService } from '@esparex/core';
import { resolveAdRequestSchema, ResolveAdRequest } from '@esparex/contracts';

const getErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error ? error.message : fallback;

export const resolveAd = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = resolveAdRequestSchema.parse(req.body);
        const resolved = await MonetizationService.resolveAd(validated as ResolveAdRequest);
        res.status(200).json({ success: true, data: resolved });
    } catch (error: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(error, 'Failed to resolve ad') });
    }
};

export const recordImpression = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        if (!isValidObjectId(id)) {
            res.status(400).json({ success: false, message: 'Invalid campaign ID' });
            return;
        }
        await MonetizationService.recordImpression(id);
        res.status(200).json({ success: true });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error, 'Failed to record impression') });
    }
};

export const recordClick = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        if (!isValidObjectId(id)) {
            res.status(400).json({ success: false, message: 'Invalid campaign ID' });
            return;
        }
        await MonetizationService.recordClick(id);
        res.status(200).json({ success: true });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error, 'Failed to record click') });
    }
};
