import { Request, Response } from 'express';
import { bulkImportService } from '../../services/BulkImportService';
import { sendErrorResponse } from '../../utils/errorResponse';
import { respond } from '../../utils/respond';

/**
 * ImportContentController
 * ---------------------------------------------------------
 * Handles bulk data ingestion for platform content.
 * Keeps boot-time and maintenance utilities isolated from operational tasks.
 * ---------------------------------------------------------
 */

export const bulkImport = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body as { type?: unknown; data?: unknown[] };
        if (!type || !data || !Array.isArray(data)) {
            return sendErrorResponse(req, res, 400, 'Invalid request format. Type and data array required.');
        }

        let result;
        switch (type) {
            case 'categories':
                result = await bulkImportService.importCategories(data as Parameters<typeof bulkImportService.importCategories>[0]);
                break;
            case 'brands':
                result = await bulkImportService.importBrands(data as Parameters<typeof bulkImportService.importBrands>[0]);
                break;
            case 'models':
                result = await bulkImportService.importModels(data as Parameters<typeof bulkImportService.importModels>[0]);
                break;
            case 'locations':
                result = await bulkImportService.importLocations(data as Parameters<typeof bulkImportService.importLocations>[0]);
                break;
            default:
                return sendErrorResponse(req, res, 400, `Invalid import type: ${String(type)}.`);
        }

        res.status(200).json(respond({
            success: true,
            message: `Bulk import for ${String(type)} processed successfully`,
            data: result
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to import content');
    }
};

/**
 * Seed Devices
 * Dedicated endpoint for the Master Data Seeder
 */
export const seedDevices = async (req: Request, res: Response) => {
    try {
        const { devices } = req.body as { devices?: unknown[] };
        if (!devices || !Array.isArray(devices)) {
            return sendErrorResponse(req, res, 400, 'Invalid format. Devices array required.');
        }

        const result = await bulkImportService.seedDevices(devices as Parameters<typeof bulkImportService.seedDevices>[0]);

        res.status(200).json(respond({
            success: true,
            message: 'Device seeding processed',
            data: result
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to seed devices');
    }
};
