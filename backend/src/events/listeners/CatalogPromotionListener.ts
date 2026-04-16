import { lifecycleEvents } from '../LifecycleEventDispatcher';
import Ad from '../../models/Ad';
import Model from '../../models/Model';
import Brand from '../../models/Brand';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import logger from '../../utils/logger';
import { clearCachePattern } from '../../utils/redisCache';

/**
 * 🚀 Catalog Promotion Listener
 * 
 * Objective: "Atomic Approval"
 * When an Admin approves an Ad, any linked PENDING models or brands 
 * are automatically promoted to ACTIVE status.
 */

export function installCatalogPromotionListener() {
    lifecycleEvents.on('listing.approved', async (payload) => {
        try {
            const { listingId } = payload;
            
            // 1. Fetch the listing with populated catalog fields
            const ad = await Ad.findById(listingId)
                .select('modelId brandId categoryId')
                .lean();

            if (!ad) return;

            // 2. Atomic Model Promotion
            let catalogInvalidated = false;
            if (ad.modelId) {
                const model = await Model.findById(ad.modelId);
                if (model && model.status === CATALOG_STATUS.PENDING) {
                    logger.info('[CatalogPromotion] Promoting pending model to ACTIVE', {
                        modelId: ad.modelId,
                        modelName: model.name,
                        triggeredByAdId: listingId
                    });
                    
                    model.status = CATALOG_STATUS.ACTIVE;
                    model.isActive = true;
                    await model.save();
                    catalogInvalidated = true;
                }
            }

            // 3. Atomic Brand Promotion (Safety check if user suggested a brand too)
            if (ad.brandId) {
                const brand = await Brand.findById(ad.brandId);
                if (brand && brand.status === CATALOG_STATUS.PENDING) {
                    logger.info('[CatalogPromotion] Promoting pending brand to ACTIVE', {
                        brandId: ad.brandId,
                        brandName: brand.name,
                        triggeredByAdId: listingId
                    });
                    
                    brand.status = CATALOG_STATUS.ACTIVE;
                    brand.isActive = true;
                    await brand.save();
                    catalogInvalidated = true;
                }
            }

            // 4. Invalidate catalog cache if any promotion occurred
            if (catalogInvalidated) {
                await Promise.all([
                    clearCachePattern('catalog:brands:*'),
                    clearCachePattern('catalog:models:*'),
                ]);
                logger.info('[CatalogPromotion] Catalog cache invalidated after promotion', {
                    triggeredByAdId: listingId
                });
            }

        } catch (error) {
            logger.error('[CatalogPromotion] Failed to process auto-promotion:', error);
        }
    });

    logger.info('✅ CatalogPromotionListener installed (Atomic Approval enabled)');
}
