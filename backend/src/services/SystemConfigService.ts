import type { HydratedDocument } from 'mongoose';

import SystemConfig, { ISystemConfig } from '../models/SystemConfig';
import { deepMerge } from '../utils/objectUtils';
import {
    ensureSystemConfig,
    invalidateSystemConfigCache,
    SYSTEM_CONFIG_KEY,
} from '../utils/systemConfigHelper';

type ObjectLike = Record<string, unknown>;

const isObjectLike = (value: unknown): value is ObjectLike => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const hasToObject = (value: unknown): value is { toObject: () => ObjectLike } => (
    isObjectLike(value) && typeof value.toObject === 'function'
);

const SECTION_OBJECTS = [
    'ai',
    'security',
    'notifications',
    'platform',
    'featureFlags',
    'integrations',
    'location',
    'listing',
] as const;

const SECTION_ARRAYS = [
    'emailTemplates',
    'notificationTemplates',
] as const;

type SystemConfigObjectSection = (typeof SECTION_OBJECTS)[number];
type SystemConfigArraySection = (typeof SECTION_ARRAYS)[number];
export type SystemConfigSection = SystemConfigObjectSection | SystemConfigArraySection;

const ALLOWED_SECTIONS: ReadonlySet<SystemConfigSection> = new Set<SystemConfigSection>([
    ...SECTION_OBJECTS,
    ...SECTION_ARRAYS,
]);

type SystemConfigPatch = Partial<Record<SystemConfigSection, unknown>>;

export class SystemConfigValidationError extends Error {
    statusCode: number;
    code: string;

    constructor(message: string, code = 'INVALID_SYSTEM_CONFIG_PATCH', statusCode = 400) {
        super(message);
        this.name = 'SystemConfigValidationError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

const getWritableSystemConfig = async (): Promise<HydratedDocument<ISystemConfig>> => {
    const existing = await SystemConfig.findOne({ singletonKey: SYSTEM_CONFIG_KEY });
    if (existing) return existing;
    const created = await ensureSystemConfig();
    return created as HydratedDocument<ISystemConfig>;
};

export const getSystemConfigForRead = async (defaults: Record<string, unknown> = {}) => {
    return ensureSystemConfig(defaults);
};

const validatePatchPayload = (payload: unknown): SystemConfigPatch => {
    if (!isObjectLike(payload)) {
        throw new SystemConfigValidationError('Request body must be an object.', 'SYSTEM_CONFIG_BODY_INVALID');
    }

    const unknownSections = Object.keys(payload).filter(
        (key) => !ALLOWED_SECTIONS.has(key as SystemConfigSection)
    );

    if (unknownSections.length > 0) {
        throw new SystemConfigValidationError(
            `Unsupported config section(s): ${unknownSections.join(', ')}`,
            'SYSTEM_CONFIG_SECTION_UNSUPPORTED'
        );
    }

    const updates: SystemConfigPatch = {};

    for (const section of SECTION_OBJECTS) {
        const nextValue = payload[section];
        if (nextValue === undefined) continue;
        if (!isObjectLike(nextValue)) {
            throw new SystemConfigValidationError(
                `Section "${section}" must be an object.`,
                'SYSTEM_CONFIG_SECTION_TYPE_INVALID'
            );
        }
        updates[section] = nextValue;
    }

    for (const section of SECTION_ARRAYS) {
        const nextValue = payload[section];
        if (nextValue === undefined) continue;
        if (!Array.isArray(nextValue)) {
            throw new SystemConfigValidationError(
                `Section "${section}" must be an array.`,
                'SYSTEM_CONFIG_SECTION_TYPE_INVALID'
            );
        }
        updates[section] = nextValue;
    }

    const flags = updates.featureFlags;
    if (flags && isObjectLike(flags)) {
        const invalidFlagEntries = Object.entries(flags).filter(
            ([, value]) => typeof value !== 'boolean'
        );
        if (invalidFlagEntries.length > 0) {
            throw new SystemConfigValidationError(
                'featureFlags values must be boolean.',
                'SYSTEM_CONFIG_FEATURE_FLAGS_INVALID'
            );
        }
    }

    return updates;
};

const normalizeExistingSection = (value: unknown): ObjectLike => {
    if (value instanceof Map) {
        return Object.fromEntries(value.entries()) as ObjectLike;
    }
    if (hasToObject(value)) return value.toObject();
    return isObjectLike(value) ? value : {};
};

export const updateSystemConfigSections = async (payload: unknown, adminId?: string) => {
    const updates = validatePatchPayload(payload);
    const updatedSections = Object.keys(updates) as SystemConfigSection[];

    if (updatedSections.length === 0) {
        throw new SystemConfigValidationError(
            'No supported config sections were provided.',
            'SYSTEM_CONFIG_EMPTY_PATCH'
        );
    }

    const config = await getWritableSystemConfig();

    for (const section of SECTION_OBJECTS) {
        const incoming = updates[section];
        if (incoming === undefined) continue;

        const existing = normalizeExistingSection(config.get(section));
        const merged = deepMerge(existing, incoming) as ObjectLike;
        config.set(section, merged);
    }

    for (const section of SECTION_ARRAYS) {
        const incoming = updates[section];
        if (incoming === undefined) continue;
        config.set(section, incoming);
    }

    if (adminId) config.updatedBy = adminId;
    config.updatedAt = new Date();

    await config.save();
    await invalidateSystemConfigCache();

    return { config, updatedSections };
};

