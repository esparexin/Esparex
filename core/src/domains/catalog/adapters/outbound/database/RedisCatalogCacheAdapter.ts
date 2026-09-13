import { CatalogCachePort, InvalidateCatalogCacheOptions } from '../../..';
import { clearCachePattern } from '../../../../../utils/redisCache';
import logger from '../../../../../utils/logger';

export class RedisCatalogCacheAdapter implements CatalogCachePort {
    async invalidateCatalogCache(opts?: InvalidateCatalogCacheOptions): Promise<void> {
        try {
            if (!opts || (!opts.categoryIds?.length && !opts.brandIds?.length)) {
                await Promise.all([
                    clearCachePattern('catalog:*'),
                    clearCachePattern('master:*'),
                ]);
            } else {
                const patterns = new Set<string>();
                
                if (opts.categoryIds) {
                    opts.categoryIds.forEach(id => {
                        patterns.add(`catalog:brands:${id}`);
                        patterns.add(`catalog:models:*category=${id}*`);
                        patterns.add(`catalog:spare-parts:${id}:*`);
                    });
                    patterns.add('catalog:list:category:*');
                    patterns.add('catalog:categories:*');
                    patterns.add('catalog:list:brand:*');
                    patterns.add('catalog:list:model:*');
                    patterns.add('catalog:list:sparepart:*');
                    patterns.add('catalog:list:*');
                }
                
                if (opts.brandIds) {
                    opts.brandIds.forEach(id => {
                        patterns.add(`catalog:models:*brand=${id}*`);
                    });
                    patterns.add('catalog:list:brand:*');
                    patterns.add('catalog:list:model:*');
                    patterns.add('catalog:list:sparepart:*');
                    patterns.add('catalog:list:*');
                }

                // ALWAYS clear "all" caches, because adding a brand/model affects the global unfiltered views
                patterns.add('catalog:brands:all');
                patterns.add('catalog:models:*category=all*');
                patterns.add('catalog:spare-parts:all:*');
                patterns.add('catalog:counts:*');
                patterns.add('catalog:list:*');

                await Promise.all(Array.from(patterns).map(p => clearCachePattern(p)));
            }
            logger.info('Catalog cache invalidated via adapter', { opts });
        } catch (error) {
            logger.error('Failed to invalidate catalog cache via adapter', { 
                error: error instanceof Error ? error.message : String(error) 
            });
        }
    }
}
