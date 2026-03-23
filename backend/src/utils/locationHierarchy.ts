import mongoose from 'mongoose';
import Location from '../models/Location';
import { escapeRegExp } from './stringUtils';
import { LOCATION_LEVELS, type LocationLevel } from './locationInputNormalizer';
import logger from './logger';

export const HIERARCHY_LEVELS = LOCATION_LEVELS;
export type HierarchyLevel = LocationLevel;

type HierarchyLocationNode = {
    _id: mongoose.Types.ObjectId;
    level?: string;
    parentId?: mongoose.Types.ObjectId | null;
    path?: mongoose.Types.ObjectId[];
    country?: string;
    state?: string;
    district?: string;
    city?: string;
};

const asString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const toTitleCase = (value?: string): string => {
    if (!value) return '';
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

const toExactRegex = (value: string): RegExp =>
    new RegExp(`^${escapeRegExp(value)}$`, 'i');

export const normalizeHierarchyLevel = (value: unknown): HierarchyLevel | undefined => {
    const normalized = asString(value)?.toLowerCase();
    if (!normalized) return undefined;
    return (HIERARCHY_LEVELS as readonly string[]).includes(normalized)
        ? (normalized as HierarchyLevel)
        : undefined;
};

const toObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    if (
        typeof value === 'object' &&
        typeof (value as { toString?: () => string }).toString === 'function'
    ) {
        const maybeId = (value as { toString: () => string }).toString();
        if (mongoose.Types.ObjectId.isValid(maybeId)) {
            return new mongoose.Types.ObjectId(maybeId);
        }
    }
    return null;
};

export const buildHierarchyPath = (
    selfId: mongoose.Types.ObjectId,
    parent?: Pick<HierarchyLocationNode, '_id' | 'path'> | null
): mongoose.Types.ObjectId[] => {
    const chain = Array.isArray(parent?.path) && parent.path.length > 0
        ? [...parent.path, selfId]
        : parent?._id
            ? [parent._id, selfId]
            : [selfId];

    const deduped: mongoose.Types.ObjectId[] = [];
    const seen = new Set<string>();
    for (const item of chain) {
        const key = String(item);
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(item);
    }
    return deduped;
};

export const resolveParentLocation = async (params: {
    level?: unknown;
    country?: unknown;
    state?: unknown;
    district?: unknown;
    city?: unknown;
    excludeId?: unknown;
}): Promise<HierarchyLocationNode | null> => {
    const level = normalizeHierarchyLevel(params.level);
    if (!level || level === 'country') return null;

    const country = toTitleCase(asString(params.country));
    const state = toTitleCase(asString(params.state));
    const district = toTitleCase(asString(params.district));
    const city = toTitleCase(asString(params.city));
    const excludeId = toObjectId(params.excludeId);

    const baseQuery: Record<string, unknown> = { isActive: true };
    if (excludeId) {
        baseQuery._id = { $ne: excludeId };
    }

    let parentQuery: Record<string, unknown> | null = null;

    // TODO(location-migration): Deprecated flat fields — migrate to parentId/path in Sprint 2
    if (level === 'state') {
        if (!country) return null;
        parentQuery = {
            ...baseQuery,
            level: 'country',
            $or: [
                { name: toExactRegex(country) },
                { country: toExactRegex(country) },
                { city: toExactRegex(country) },
            ],
        };
    } else if (level === 'district') {
        if (!state) return null;
        // TODO(location-migration): Deprecated flat fields — migrate to parentId/path in Sprint 2
        parentQuery = {
            ...baseQuery,
            level: 'state',
            state: toExactRegex(state),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    } else if (level === 'city') {
        if (!district && !state) return null;
        // TODO(location-migration): Deprecated flat fields — migrate to parentId/path in Sprint 2
        parentQuery = district
            ? {
                ...baseQuery,
                level: 'district',
                name: toExactRegex(district),
                ...(state ? { state: toExactRegex(state) } : {}),
                ...(country ? { country: toExactRegex(country) } : {}),
            }
            : {
                ...baseQuery,
                level: 'state',
                state: toExactRegex(state || ''),
                ...(country ? { country: toExactRegex(country) } : {}),
            };
    } else if (level === 'area') {
        if (!city) return null;
        // TODO(location-migration): Deprecated flat fields — migrate to parentId/path in Sprint 2
        parentQuery = {
            ...baseQuery,
            level: 'city',
            city: toExactRegex(city),
            ...(state ? { state: toExactRegex(state) } : {}),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    } else if (level === 'village') {
        if (!city) return null;
        // TODO(location-migration): Deprecated flat fields — migrate to parentId/path in Sprint 2
        parentQuery = {
            ...baseQuery,
            level: 'area',
            city: toExactRegex(city),
            ...(state ? { state: toExactRegex(state) } : {}),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    }

    if (!parentQuery) return null;

    const parent = await Location.findOne(parentQuery)
        .select('_id level parentId path country state district city priority isPopular createdAt')
        .sort({ isPopular: -1, priority: -1, createdAt: 1 })
        .lean<HierarchyLocationNode | null>();

    return parent || null;
};

export const resolveLocationPathIds = async (
    locationId: unknown
): Promise<mongoose.Types.ObjectId[]> => {
    const objectId = toObjectId(locationId);
    if (!objectId) return [];

    const start = await Location.findById(objectId)
        .select('_id parentId path')
        .lean<HierarchyLocationNode | null>();
    if (!start?._id) return [];

    if (Array.isArray(start.path) && start.path.length > 0) {
        const containsSelf = start.path.some((entry) => String(entry) === String(start._id));
        if (containsSelf) {
            return buildHierarchyPath(start._id, { _id: start._id, path: start.path.slice(0, -1) });
        }
    }

    const visited = new Set<string>([String(start._id)]);
    const chain: mongoose.Types.ObjectId[] = [start._id];
    let currentParentId = start.parentId ?? null;

    while (currentParentId) {
        const key = String(currentParentId);
        if (visited.has(key)) {
            logger.error('Location hierarchy cycle detected', { locationId: currentParentId, visitedChain: Array.from(visited) });
            throw new Error(`Location hierarchy cycle detected at locationId: ${currentParentId}`);
        }
        visited.add(key);

        const parent = await Location.findById(currentParentId)
            .select('_id parentId path')
            .lean<HierarchyLocationNode | null>();
        if (!parent?._id) break;

        if (Array.isArray(parent.path) && parent.path.length > 0) {
            return buildHierarchyPath(start._id, parent);
        }

        chain.unshift(parent._id);
        currentParentId = parent.parentId ?? null;
    }

    return chain;
};
