"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installCatalogPromotionListener = installCatalogPromotionListener;
const LifecycleEventDispatcher_1 = require("../LifecycleEventDispatcher");
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Model_1 = __importDefault(require("@core/models/Model"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const logger_1 = __importDefault(require("@core/utils/logger"));
const redisCache_1 = require("@core/utils/redisCache");
/**
 * 🚀 Catalog Promotion Listener
 *
 * Objective: "Atomic Approval"
 * When an Admin approves an Ad, any linked PENDING models or brands
 * are automatically promoted to ACTIVE status.
 */
function installCatalogPromotionListener() {
    LifecycleEventDispatcher_1.lifecycleEvents.on('listing.approved', async (payload) => {
        try {
            const { listingId } = payload;
            // 1. Fetch the listing with populated catalog fields
            const ad = await Ad_1.default.findById(listingId)
                .select('modelId brandId categoryId')
                .lean();
            if (!ad)
                return;
            // 2. Atomic Model Promotion
            let catalogInvalidated = false;
            if (ad.modelId) {
                const model = await Model_1.default.findById(ad.modelId);
                if (model && model.status === catalogStatus_1.CATALOG_STATUS.PENDING) {
                    logger_1.default.info('[CatalogPromotion] Promoting pending model to ACTIVE', {
                        modelId: ad.modelId,
                        modelName: model.name,
                        triggeredByAdId: listingId
                    });
                    model.status = catalogStatus_1.CATALOG_STATUS.ACTIVE;
                    model.isActive = true;
                    await model.save();
                    catalogInvalidated = true;
                }
            }
            // 3. Atomic Brand Promotion (Safety check if user suggested a brand too)
            if (ad.brandId) {
                const brand = await Brand_1.default.findById(ad.brandId);
                if (brand && brand.status === catalogStatus_1.CATALOG_STATUS.PENDING) {
                    logger_1.default.info('[CatalogPromotion] Promoting pending brand to ACTIVE', {
                        brandId: ad.brandId,
                        brandName: brand.name,
                        triggeredByAdId: listingId
                    });
                    brand.status = catalogStatus_1.CATALOG_STATUS.ACTIVE;
                    brand.isActive = true;
                    await brand.save();
                    catalogInvalidated = true;
                }
            }
            // 4. Invalidate catalog cache if any promotion occurred
            if (catalogInvalidated) {
                await Promise.all([
                    (0, redisCache_1.clearCachePattern)('catalog:brands:*'),
                    (0, redisCache_1.clearCachePattern)('catalog:models:*'),
                ]);
                logger_1.default.info('[CatalogPromotion] Catalog cache invalidated after promotion', {
                    triggeredByAdId: listingId
                });
            }
        }
        catch (error) {
            logger_1.default.error('[CatalogPromotion] Failed to process auto-promotion:', error);
        }
    });
    logger_1.default.info('✅ CatalogPromotionListener installed (Atomic Approval enabled)');
}
//# sourceMappingURL=CatalogPromotionListener.js.map