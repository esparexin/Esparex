import mongoose from 'mongoose';
import Location from '../models/Location';
import { escapeRegExp, toTitleCase } from './stringUtils';
import { LOCATION_LEVELS, type LocationLevel } from './locationInputNormalizer';
import { toObjectId } from './idUtils';
import { buildHierarchyPath } from './locationHierarchyUtils';
export { buildHierarchyPath };
import logger from './logger';

export const HIERARCHY_LEVELS = LOCATION_LEVELS;
export type HierarchyLevel = LocationLevel;

type HierarchyLocationNode = {
    _id: mongoose.Types.ObjectId;
    name?: string;
    level?: string;
    parentId?: mongoose.Types.ObjectId | null;
    path?: mongoose.Types.ObjectId[];
    country?: string;
};

export const asString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

export type LocationIdLike = { toString: () => string } | string;

export type CanonicalLocationDoc = {
    _id?: LocationIdLike;
    name?: string;
    country?: string;
    level?: string;
    parentId?: LocationIdLike | null;
    path?: LocationIdLike[];
};

export const toLocationIdString = (value: LocationIdLike | null | undefined): string | undefined => {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    return value.toString();
};

export const buildLocationSummary = (
    location: CanonicalLocationDoc,
    hierarchyMap: Map<string, CanonicalLocationDoc>
) => {
    const ownName = asString(location.name) || '';
    const currentLevel = asString(location.level) || '';
    const hierarchyTrail = Array.isArray(location.path)
        ? location.path
            .map((entry) => toLocationIdString(entry))
            .filter((entry): entry is string => Boolean(entry))
            .map((entry) => hierarchyMap.get(entry))
            .filter((entry): entry is CanonicalLocationDoc => Boolean(entry))
        : [];

    const findHierarchyName = (level: string): string =>
        hierarchyTrail.find((entry) => entry.level === level)?.name || '';

    let city = findHierarchyName('city');
    if (!city) {
        if (currentLevel === 'city' || currentLevel === 'district' || currentLevel === 'state' || currentLevel === 'country') {
            city = ownName;
        } else if (currentLevel === 'area' || currentLevel === 'village') {
            city = findHierarchyName('district') || ownName;
        } else {
            city = ownName;
        }
    }

    let state = findHierarchyName('state');
    if (!state && currentLevel === 'state') {
        state = ownName;
    }

    const country = asString(location.country) || findHierarchyName('country') || '';

    return {
        id: toLocationIdString(location._id) || '',
        name: ownName,
        city,
        state,
        country,
        level: currentLevel,
    };
};

export const resolveLocationSummary = async (location: CanonicalLocationDoc | null | undefined) => {
    if (!location) return null;

    const hierarchyIds = new Set<string>();
    const currentId = toLocationIdString(location._id);
    if (currentId) {
        hierarchyIds.add(currentId);
    }
    for (const entry of location.path || []) {
        const entryId = toLocationIdString(entry);
        if (entryId) {
            hierarchyIds.add(entryId);
        }
    }
    const parentId = toLocationIdString(location.parentId);
    if (parentId) {
        hierarchyIds.add(parentId);
    }

    const hierarchyLocations = hierarchyIds.size > 0
        ? await Location.find({ _id: { $in: Array.from(hierarchyIds) } })
            .select('_id name country level')
            .lean<CanonicalLocationDoc[]>()
        : [];
    const hierarchyMap = new Map(
        hierarchyLocations.map((entry) => [String(entry._id), entry])
    );

    return buildLocationSummary(location, hierarchyMap);
};

export const normalizeStateLabel = (value: unknown): string => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : 'Unknown';
    }

    if (value && typeof value === 'object') {
        const obj = value as { state?: unknown; name?: unknown; toString?: () => string };
        if (typeof obj.state === 'string' && obj.state.trim().length > 0) {
            return obj.state.trim();
        }
        if (typeof obj.name === 'string' && obj.name.trim().length > 0) {
            return obj.name.trim();
        }
        if (typeof obj.toString === 'function') {
            const str = obj.toString().trim();
            if (str.length > 0 && str !== '[object Object]') {
                return str;
            }
        }
    }

    return 'Unknown';
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

    // All queries now use `name` (the location's own name field) + `level` instead of
    // the removed deprecated `city`/`state` flat fields.
    let parentQuery: Record<string, unknown> | null = null;

    if (level === 'state') {
        if (!country) return null;
        parentQuery = {
            ...baseQuery,
            level: 'country',
            $or: [
                { name: toExactRegex(country) },
                { country: toExactRegex(country) },
            ],
        };
    } else if (level === 'district') {
        if (!state) return null;
        parentQuery = {
            ...baseQuery,
            level: 'state',
            name: toExactRegex(state),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    } else if (level === 'city') {
        if (!district && !state) return null;
        parentQuery = district
            ? {
                ...baseQuery,
                level: 'district',
                name: toExactRegex(district),
                ...(country ? { country: toExactRegex(country) } : {}),
            }
            : {
                ...baseQuery,
                level: 'state',
                name: toExactRegex(state || ''),
                ...(country ? { country: toExactRegex(country) } : {}),
            };
    } else if (level === 'area') {
        if (!city) return null;
        // Parent of an area is a city; `name` on a city-level doc IS the city name
        parentQuery = {
            ...baseQuery,
            level: 'city',
            name: toExactRegex(city),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    } else if (level === 'village') {
        if (!city) return null;
        // Parent of a village is an area; `name` on an area-level doc IS the area/city name
        parentQuery = {
            ...baseQuery,
            level: 'area',
            name: toExactRegex(city),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    }

    if (!parentQuery) return null;

    const parent = await Location.findOne(parentQuery)
        .select('_id name level parentId path country priority isPopular createdAt')
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
