import SystemConfig, { ISystemConfig } from '../models/SystemConfig';
import redis from '../config/redis';
import logger from './logger';
import { Model } from 'mongoose';

export const SYSTEM_CONFIG_KEY = 'global';
export const SYSTEM_CONFIG_CACHE_KEY = `system:config:${SYSTEM_CONFIG_KEY}`;
const CACHE_TTL = 60; // 60 seconds

// Explicitly type the model to avoid dynamic export typing issues
const ModelObj = SystemConfig as unknown as Model<ISystemConfig>;

export const getSystemConfigDoc = async () => {
    try {
        // 1. Try Cache
        const cached = await redis.get(SYSTEM_CONFIG_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }

        // 2. Try DB
        const config = await ModelObj.findOne({ singletonKey: SYSTEM_CONFIG_KEY }).lean();

        // 3. Store in Cache if exists
        if (config) {
            await redis.set(SYSTEM_CONFIG_CACHE_KEY, JSON.stringify(config), 'EX', CACHE_TTL);
        }

        return config;
    } catch (error) {
        logger.error('[SystemConfigHelper] Cache error:', error);
        // Fallback to direct DB lookup on cache failure
        return ModelObj.findOne({ singletonKey: SYSTEM_CONFIG_KEY }).lean();
    }
};

export const ensureSystemConfig = async (defaults: Record<string, unknown> = {}) => {
    return ModelObj.findOneAndUpdate(
        { singletonKey: SYSTEM_CONFIG_KEY },
        { $setOnInsert: { singletonKey: SYSTEM_CONFIG_KEY, ...defaults } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
};

export const invalidateSystemConfigCache = async () => {
    try {
        await redis.del(SYSTEM_CONFIG_CACHE_KEY);
    } catch (error) {
        logger.error('[SystemConfigHelper] Cache invalidate error:', error);
    }
};
