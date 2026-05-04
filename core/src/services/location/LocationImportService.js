"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationImportService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const locationInputNormalizer_1 = require("@core/utils/locationInputNormalizer");
class LocationImportService {
    static async importLocations(data) {
        const result = { success: 0, failed: 0, errors: [] };
        const Location = (await Promise.resolve().then(() => __importStar(require('@core/models/Location')))).default;
        const ops = [];
        for (const item of data) {
            try {
                if (!item.name || !item.city || !item.state || !item.level || !item.coordinates) {
                    throw new Error(`Missing required fields for location: ${item.name}`);
                }
                const normalized = await (0, locationInputNormalizer_1.normalizeLocationInput)({
                    ...item,
                    coordinates: {
                        type: 'Point',
                        coordinates: item.coordinates
                    }
                }, {
                    documentId: new mongoose_1.default.Types.ObjectId(),
                    resolveHierarchy: true,
                    ensureUnique: false,
                    defaultCountry: typeof item.country === 'string' ? item.country : 'Unknown'
                });
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
            }
            catch (error) {
                result.failed++;
                result.errors.push(`Failed to normalize location '${item.name}': ${String(error)}`);
            }
        }
        if (ops.length > 0) {
            try {
                const bulkRes = await Location.bulkWrite(ops);
                result.success = (bulkRes.upsertedCount || 0) + (bulkRes.modifiedCount || 0) + (bulkRes.matchedCount || 0);
            }
            catch (error) {
                result.errors.push(`Bulk location write failed: ${String(error)}`);
            }
        }
        return result;
    }
}
exports.LocationImportService = LocationImportService;
//# sourceMappingURL=LocationImportService.js.map