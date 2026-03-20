import { Request, Response } from 'express';
import { sendSuccessResponse } from './adminBaseController';

/**
 * 🩺 CODE HEALTH CONTROLLER (STUB)
 * Purpose: Provide placeholders for frontend code-health features.
 */

export const getCodeHealth = async (req: Request, res: Response) => {
    sendSuccessResponse(res, {
        score: 85,
        totalFiles: 120,
        duplicateLines: 412,
        unusedVariables: 28,
        lastScan: new Date().toISOString()
    });
};

export const runCodeHealthScan = async (req: Request, res: Response) => {
    sendSuccessResponse(res, {
        message: "Code health scan initiated",
        jobId: "scan_" + Date.now()
    });
};

export const getDeadCodeReport = async (req: Request, res: Response) => {
    sendSuccessResponse(res, {
        findings: [
            { id: "1", type: "unused_function", path: "src/utils/legacy.ts", name: "oldHelper", severity: "low" },
            { id: "2", type: "unused_import", path: "src/controllers/admin/adminAdsController.ts", name: "User", severity: "low" }
        ]
    });
};

export const approveDeadCodeRemoval = async (req: Request, res: Response) => {
    sendSuccessResponse(res, { message: "Action approved" });
};

export const removeApprovedDeadCode = async (req: Request, res: Response) => {
    sendSuccessResponse(res, { message: "Cleanup completed", count: 2 });
};

export const getScanHistory = async (req: Request, res: Response) => {
    sendSuccessResponse(res, []);
};

export const getWhitelist = async (req: Request, res: Response) => {
    sendSuccessResponse(res, []);
};

export const addToWhitelist = async (req: Request, res: Response) => {
    sendSuccessResponse(res, { message: "Added to whitelist" });
};

export const removeFromWhitelist = async (req: Request, res: Response) => {
    sendSuccessResponse(res, { message: "Removed from whitelist" });
};
