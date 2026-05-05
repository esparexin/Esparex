import { ICategory } from '../models/Category';
import { CatalogImportService } from './catalog/CatalogImportService';
import { LocationImportService } from './location/LocationImportService';

interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

interface LocationImportInput {
    name: string;
    city: string;
    state: string;
    level: string;
    coordinates: [number, number];
    isActive?: boolean;
    [key: string]: unknown;
}

interface DeviceSeedInput {
    type: string;
    brand: string;
    name: string;
    specs?: Record<string, unknown>;
}

export const bulkImportService = {
    importCategories: async (data: Partial<ICategory>[]): Promise<ImportResult> => {
        return CatalogImportService.importCategories(data);
    },

    importBrands: async (data: { name: string, categories: string[] }[]): Promise<ImportResult> => {
        return CatalogImportService.importBrands(data);
    },

    importModels: async (data: { name: string, brand: string, category?: string }[]): Promise<ImportResult> => {
        return CatalogImportService.importModels(data);
    },

    importLocations: async (data: LocationImportInput[]): Promise<ImportResult> => {
        return LocationImportService.importLocations(data);
    },

    seedDevices: async (devices: DeviceSeedInput[]): Promise<ImportResult> => {
        return CatalogImportService.seedDevices(devices);
    }
};
