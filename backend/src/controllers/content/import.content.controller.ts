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
        const { type, data } = req.body;
        if (!type || !data || !Array.isArray(data)) {
            return sendErrorResponse(req, res, 400, 'Invalid request format. Type and data array required.');
        }

        let result;
        switch (type) {
            case 'categories':
                result = await bulkImportService.importCategories(data);
                break;
            case 'brands':
                result = await bulkImportService.importBrands(data);
                break;
            case 'models':
                result = await bulkImportService.importModels(data);
                break;
            case 'locations':
                result = await bulkImportService.importLocations(data);
                break;
            default:
                return sendErrorResponse(req, res, 400, `Invalid import type: ${type}.`);
        }

        res.status(200).json(respond({
            success: true,
            message: `Bulk import for ${type} processed successfully`,
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
        const { devices } = req.body;
        if (!devices || !Array.isArray(devices)) {
            return sendErrorResponse(req, res, 400, 'Invalid format. Devices array required.');
        }

        const result = await bulkImportService.seedDevices(devices);

        res.status(200).json(respond({
            success: true,
            message: 'Device seeding processed',
            data: result
        }));
    } catch (error: unknown) {
        sendErrorResponse(req, res, 500, error instanceof Error ? error.message : 'Failed to seed devices');
    }
};
