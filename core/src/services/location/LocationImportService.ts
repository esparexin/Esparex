import mongoose from 'mongoose';
import { normalizeLocationInput } from './_shared/locationServiceBase';
import type { LocationLevel } from './_shared/locationServiceBase';
import { locationRepository } from '../../composition/location';

export interface LocationImportInput {
    name: string;
    city: string;
    state: string;
    level: LocationLevel;
    coordinates: [number, number];
    country?: string;
    isActive?: boolean;
    [key: string]: unknown;
}

export interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}

export class LocationImportService {
    static async importLocations(data: LocationImportInput[]): Promise<ImportResult> {
        const result: ImportResult = { success: 0, failed: 0, errors: [] };
         
        const ops: unknown[] = [];

        for (const item of data) {
            try {
                if (!item.name || !item.city || !item.state || !item.level || !item.coordinates) {
                    throw new Error(`Missing required fields for location: ${item.name}`);
                }

                const normalized = await normalizeLocationInput(
                    {
                        ...item,
                        coordinates: {
                            type: 'Point',
                            coordinates: item.coordinates
                        }
                    },
                    {
                        documentId: new mongoose.Types.ObjectId(),
                        resolveHierarchy: true,
                        ensureUnique: false,
                        defaultCountry: typeof item.country === 'string' ? item.country : 'Unknown'
                    }
                );

                ops.push({
                    updateOne: {
                        filter: {
                            normalizedName: normalized.normalizedName,
                            state: normalized.state,
                            level: normalized.level,
                            ...(normalized.parentId ? { parentId: normalized.parentId } : {})
                        },
                        update: {
                            $setOnInsert: { _id: normalized.documentId },
                            $set: {
                                ...item,
                                name: normalized.name,
                                normalizedName: normalized.normalizedName,
                                slug: normalized.slug,
                                city: normalized.city,
                                state: normalized.state,
                                country: normalized.country,
                                level: normalized.level,
                                parentId: normalized.parentId,
                                path: normalized.path,
                                coordinates: normalized.coordinates,
                                aliases: normalized.aliases,
                                isActive: item.isActive !== undefined ? item.isActive : true
                            }
                        },
                        upsert: true
                    }
                });
            } catch (error) {
                result.failed++;
                result.errors.push(`Failed to normalize location '${item.name}': ${String(error)}`);
            }
        }

        if (ops.length > 0) {
            try {
                 
                const bulkRes = await locationRepository.bulkWriteLocations(ops) as { upsertedCount?: number; modifiedCount?: number; matchedCount?: number };
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            } catch (error) {
                result.errors.push(`Bulk location write failed: ${String(error)}`);
            }
        }
        return result;
    }
}
