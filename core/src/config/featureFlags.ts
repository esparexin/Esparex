import logger from '../utils/logger';
import { getCache, setCache } from '../infrastructure/cache/redisCache';

export enum FeatureFlag {
    ENABLE_AD_ORCHESTRATOR = 'ENABLE_AD_ORCHESTRATOR',
    ENABLE_SPAREPARTS_SNAPSHOT = 'ENABLE_SPAREPARTS_SNAPSHOT',
    ENABLE_FAILSAFE_FRAUD = 'ENABLE_FAILSAFE_FRAUD',
    ENABLE_LIGHTWEIGHT_LISTING = 'ENABLE_LIGHTWEIGHT_LISTING',
    ENABLE_AD_LISTINGTYPE_NULL_COMPAT = 'ENABLE_AD_LISTINGTYPE_NULL_COMPAT',
    USE_ADMIN_CATALOG_READS = 'USE_ADMIN_CATALOG_READS',
    ENABLE_ATLAS_CATALOG_SEARCH = 'ENABLE_ATLAS_CATALOG_SEARCH',
    ENABLE_BEHAVIORAL_RANKING_GOVERNANCE = 'ENABLE_BEHAVIORAL_RANKING_GOVERNANCE',
    ENABLE_RANKING_REPLAY_EVALUATION = 'ENABLE_RANKING_REPLAY_EVALUATION'
}

const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
    [FeatureFlag.ENABLE_AD_ORCHESTRATOR]: true,
    [FeatureFlag.ENABLE_SPAREPARTS_SNAPSHOT]: false,
    [FeatureFlag.ENABLE_FAILSAFE_FRAUD]: true,
    [FeatureFlag.ENABLE_LIGHTWEIGHT_LISTING]: false,
    [FeatureFlag.ENABLE_AD_LISTINGTYPE_NULL_COMPAT]: true,
    [FeatureFlag.USE_ADMIN_CATALOG_READS]: false,
    [FeatureFlag.ENABLE_ATLAS_CATALOG_SEARCH]: false,
    [FeatureFlag.ENABLE_BEHAVIORAL_RANKING_GOVERNANCE]: false,
    [FeatureFlag.ENABLE_RANKING_REPLAY_EVALUATION]: false,
};

let warnedProductionAdminCatalogReads = false;

const isProductionCatalogReadSwitchBlocked = (): boolean => {
    const runtimeEnv = (process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.VERCEL_ENV || process.env.RENDER_ENV || '').trim().toLowerCase();
    const isProductionRuntime =
        process.env.NODE_ENV === 'production' &&
        (!runtimeEnv || runtimeEnv === 'production' || runtimeEnv === 'prod');

    return isProductionRuntime;
};

/**
 * Get feature flag value with hierarchy: Env -> Cache -> Default.
 * Feature flags are intentionally not backed by SystemConfig.
 */
export const isEnabled = async (flag: FeatureFlag): Promise<boolean> => {
    if (flag === FeatureFlag.USE_ADMIN_CATALOG_READS && isProductionCatalogReadSwitchBlocked()) {
        if (!warnedProductionAdminCatalogReads && process.env[flag] === 'true') {
            warnedProductionAdminCatalogReads = true;
            logger.warn('USE_ADMIN_CATALOG_READS ignored in production runtime');
        }
        return false;
    }

    // 1. Check Environment Variable first (Hard Override)
    const envVal = process.env[flag];
    if (envVal !== undefined) {
        return envVal === 'true';
    }

    // 2. Check Redis Cache
    const cacheKey = `ff:${flag}`;
    try {
        const cached = await getCache<boolean>(cacheKey);
        if (cached !== null && cached !== undefined) {
            return cached;
        }
    } catch (err) {
        logger.warn(`Feature flag cache read failed for ${flag}`, { error: err });
    }

    // 3. Fallback to hardcoded defaults
    return DEFAULT_FLAGS[flag];
};

/**
 * Kill-switch: Force set a flag in cache.
 */
export const setFlagOverride = async (flag: FeatureFlag, value: boolean, ttlSeconds: number = 3600): Promise<void> => {
    const cacheKey = `ff:${flag}`;
    await setCache(cacheKey, value, ttlSeconds);
    logger.info(`Feature flag override set: ${flag} = ${value}`);
};
