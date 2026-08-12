import { Request, Response } from "express";
import { getPublicActiveGoogleAdPlacements } from "@esparex/core/services/GoogleAdsService";

export const getPublicGoogleAdPlacements = async (req: Request, res: Response) => {
    try {
        const placements = await getPublicActiveGoogleAdPlacements();
        res.status(200).json({
            success: true,
            data: placements,
        });
    } catch (error: unknown) {
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : "Failed to fetch public ad placements",
        });
    }
};
