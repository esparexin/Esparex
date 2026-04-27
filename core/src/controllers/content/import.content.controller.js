"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDevices = exports.bulkImport = void 0;
const BulkImportService_1 = require("@core/services/BulkImportService");
const errorResponse_1 = require("@core/utils/errorResponse");
const respond_1 = require("@core/utils/respond");
/**
 * ImportContentController
 * ---------------------------------------------------------
 * Handles bulk data ingestion for platform content.
 * Keeps boot-time and maintenance utilities isolated from operational tasks.
 * ---------------------------------------------------------
 */
const bulkImport = async (req, res) => {
    try {
        const { type, data } = req.body;
        if (!type || !data || !Array.isArray(data)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Invalid request format. Type and data array required.');
        }
        let result;
        switch (type) {
            case 'categories':
                result = await BulkImportService_1.bulkImportService.importCategories(data);
                break;
            case 'brands':
                result = await BulkImportService_1.bulkImportService.importBrands(data);
                break;
            case 'models':
                result = await BulkImportService_1.bulkImportService.importModels(data);
                break;
            case 'locations':
                result = await BulkImportService_1.bulkImportService.importLocations(data);
                break;
            default:
                return (0, errorResponse_1.sendErrorResponse)(req, res, 400, `Invalid import type: ${String(type)}.`);
        }
        res.status(200).json((0, respond_1.respond)({
            success: true,
            message: `Bulk import for ${String(type)} processed successfully`,
            data: result
        }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, error instanceof Error ? error.message : 'Failed to import content');
    }
};
exports.bulkImport = bulkImport;
/**
 * Seed Devices
 * Dedicated endpoint for the Master Data Seeder
 */
const seedDevices = async (req, res) => {
    try {
        const { devices } = req.body;
        if (!devices || !Array.isArray(devices)) {
            return (0, errorResponse_1.sendErrorResponse)(req, res, 400, 'Invalid format. Devices array required.');
        }
        const result = await BulkImportService_1.bulkImportService.seedDevices(devices);
        res.status(200).json((0, respond_1.respond)({
            success: true,
            message: 'Device seeding processed',
            data: result
        }));
    }
    catch (error) {
        (0, errorResponse_1.sendErrorResponse)(req, res, 500, error instanceof Error ? error.message : 'Failed to seed devices');
    }
};
exports.seedDevices = seedDevices;
//# sourceMappingURL=import.content.controller.js.map