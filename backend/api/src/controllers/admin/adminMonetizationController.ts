import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { MonetizationService } from '@esparex/core';
import {
    createAdCampaignSchema,
    updateAdCampaignSchema,
    monetizationSystemStateSchema,
    AdCampaignItem,
} from '@esparex/contracts';

const getErrorMessage = (error: unknown, fallback: string): string =>
    error instanceof Error ? error.message : fallback;

export const getCampaigns = async (_req: Request, res: Response): Promise<void> => {
    try {
        const campaigns = await MonetizationService.getAdminCampaigns();
        res.status(200).json({ success: true, data: campaigns });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error, 'Failed to fetch campaigns') });
    }
};

export const createCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = createAdCampaignSchema.parse(req.body);
        const created = await MonetizationService.createCampaign(validated as Partial<AdCampaignItem>);
        res.status(201).json({ success: true, data: created });
    } catch (error: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(error, 'Failed to create campaign') });
    }
};

export const updateCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        if (!isValidObjectId(id)) {
            res.status(400).json({ success: false, message: 'Invalid campaign ID' });
            return;
        }
        const validated = updateAdCampaignSchema.parse(req.body);
        const updated = await MonetizationService.updateCampaign(id, validated as Partial<AdCampaignItem>);
        if (!updated) {
            res.status(404).json({ success: false, message: 'Campaign not found' });
            return;
        }
        res.status(200).json({ success: true, data: updated });
    } catch (error: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(error, 'Failed to update campaign') });
    }
};

export const deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = String(req.params.id);
        if (!isValidObjectId(id)) {
            res.status(400).json({ success: false, message: 'Invalid campaign ID' });
            return;
        }
        const deleted = await MonetizationService.deleteCampaign(id);
        if (!deleted) {
            res.status(404).json({ success: false, message: 'Campaign not found' });
            return;
        }
        res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error, 'Failed to delete campaign') });
    }
};

export const getMonetizationConfig = async (_req: Request, res: Response): Promise<void> => {
    try {
        const config = await MonetizationService.getMonetizationConfig();
        res.status(200).json({ success: true, data: config });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: getErrorMessage(error, 'Failed to fetch monetization config') });
    }
};

export const updateMonetizationConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const validated = monetizationSystemStateSchema.partial().parse(req.body);
        const updated = await MonetizationService.updateMonetizationConfig(validated);
        res.status(200).json({ success: true, data: updated });
    } catch (error: unknown) {
        res.status(400).json({ success: false, message: getErrorMessage(error, 'Failed to update monetization config') });
    }
};
