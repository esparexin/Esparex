"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportService = void 0;
const CatalogImportService_1 = require("./catalog/CatalogImportService");
const LocationImportService_1 = require("./location/LocationImportService");
exports.bulkImportService = {
    importCategories: async (data) => {
        return CatalogImportService_1.CatalogImportService.importCategories(data);
    },
    importBrands: async (data) => {
        return CatalogImportService_1.CatalogImportService.importBrands(data);
    },
    importModels: async (data) => {
        return CatalogImportService_1.CatalogImportService.importModels(data);
    },
    importLocations: async (data) => {
        return LocationImportService_1.LocationImportService.importLocations(data);
    },
    seedDevices: async (devices) => {
        return CatalogImportService_1.CatalogImportService.seedDevices(devices);
    }
};
//# sourceMappingURL=BulkImportService.js.map