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
exports.AdMediaService = void 0;
const adImageService = __importStar(require("./AdImageService"));
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * AdMediaService
 * Responsible for sanitizing, hashing, and uploading ad media.
 */
class AdMediaService {
    /**
     * Process a batch of images for an ad.
     * Sanitizes, hashes, and uploads to S3.
     */
    static async processImages(adId, images, session) {
        try {
            if (!images || images.length === 0)
                return [];
            const results = await adImageService.uploadMultipleImages(adId, images, session);
            return results.map(res => ({
                url: res.url,
                hash: res.hash
            }));
        }
        catch (error) {
            logger_1.default.error('AdMediaService: Failed to process images', { adId, error });
            throw error;
        }
    }
    /**
     * Delete all media associated with an ad.
     */
    static async deleteByAdId(adId, session) {
        await adImageService.deleteAdImages(adId, session);
    }
}
exports.AdMediaService = AdMediaService;
//# sourceMappingURL=AdMediaService.js.map