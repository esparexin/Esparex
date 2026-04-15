import mongoose from 'mongoose';
import Location from '../models/Location';
import { escapeRegExp, toTitleCase } from './stringUtils';
import { LOCATION_LEVELS, type LocationLevel, normalizeLocationLevel } from './locationInputNormalizer';
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

    let district = findHierarchyName('district');
    if (!district && currentLevel === 'district') {
        district = ownName;
    }

    const country = asString(location.country) || findHierarchyName('country') || '';

    return {
        id: toLocationIdString(location._id) || '',
        name: ownName,
        city,
        district,
        state,
        country,
        level: currentLevel,
    };
};

export const loadHierarchyMapForLocations = async (
    locations: Array<CanonicalLocationDoc | null | undefined>
) => {
    const hierarchyIds = new Set<string>();

    for (const location of locations) {
        if (!location) continue;

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
    }

    const hierarchyLocations = hierarchyIds.size > 0
        ? await Location.find({ _id: { $in: Array.from(hierarchyIds) } })
            .select('_id name country level parentId path')
            .lean<CanonicalLocationDoc[]>()
        : [];

    return new Map(
        hierarchyLocations.map((entry) => [String(entry._id), entry])
    );
};

export const resolveLocationSummary = async (location: CanonicalLocationDoc | null | undefined) => {
    if (!location) return null;
    const hierarchyMap = await loadHierarchyMapForLocations([location]);

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

const equalsIgnoreCase = (left: string | undefined, right: string | undefined) => {
    if (!left || !right) return false;
    return left.trim().toLowerCase() === right.trim().toLowerCase();
};



export const resolveParentLocation = async (params: {
    level?: unknown;
    country?: unknown;
    state?: unknown;
    district?: unknown;
    city?: unknown;
    excludeId?: unknown;
}): Promise<HierarchyLocationNode | null> => {
    const level = normalizeLocationLevel(params.level);
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
            throw new Error(`Location hierarchy cycle detected at locationId: ${String(currentParentId)}`);
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

export const resolveLocationScope = async (params: {
    country?: unknown;
    state?: unknown;
    district?: unknown;
    city?: unknown;
}) => {
    const country = toTitleCase(asString(params.country));
    const state = toTitleCase(asString(params.state));
    const district = toTitleCase(asString(params.district));
    const city = toTitleCase(asString(params.city));

    const deepestLevel = city
        ? 'city'
        : district
            ? 'district'
            : state
                ? 'state'
                : country
                    ? 'country'
                    : null;

    if (!deepestLevel) {
        return {
            rootIds: null as mongoose.Types.ObjectId[] | null,
            locationIds: null as mongoose.Types.ObjectId[] | null,
            filters: { country, state, district, city },
        };
    }

    if (deepestLevel === 'country' && country) {
        const countryLocationIds = await Location.find({
            isActive: true,
            country: toExactRegex(country),
        }).distinct('_id');

        return {
            rootIds: countryLocationIds.map((value) => value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value))),
            locationIds: countryLocationIds.map((value) => value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value))),
            filters: { country, state, district, city },
        };
    }

    const query: Record<string, unknown> = {
        isActive: true,
        level: deepestLevel,
    };

    if (deepestLevel === 'state' && state) {
        query.name = toExactRegex(state);
        if (country) {
            query.country = toExactRegex(country);
        }
    } else if (deepestLevel === 'district' && district) {
        query.name = toExactRegex(district);
        if (country) {
            query.country = toExactRegex(country);
        }
    } else if (deepestLevel === 'city' && city) {
        query.name = toExactRegex(city);
        if (country) {
            query.country = toExactRegex(country);
        }
    }

    const candidates = await Location.find(query)
        .select('_id name country level parentId path')
        .lean<CanonicalLocationDoc[]>();

    if (candidates.length === 0) {
        return {
            rootIds: [] as mongoose.Types.ObjectId[],
            locationIds: [] as mongoose.Types.ObjectId[],
            filters: { country, state, district, city },
        };
    }

    const hierarchyMap = await loadHierarchyMapForLocations(candidates);
    const matchedRootIds = candidates
        .filter((candidate) => {
            const summary = buildLocationSummary(candidate, hierarchyMap);
            if (country && !equalsIgnoreCase(summary.country, country)) return false;
            if (state && !equalsIgnoreCase(summary.state, state)) return false;
            if (district && !equalsIgnoreCase(summary.district, district)) return false;
            if (city && !equalsIgnoreCase(summary.city, city)) return false;
            return true;
        })
        .map((candidate) => candidate._id)
        .filter((value): value is mongoose.Types.ObjectId => value instanceof mongoose.Types.ObjectId || mongoose.Types.ObjectId.isValid(String(value)))
        .map((value) => value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value)));

    if (matchedRootIds.length === 0) {
        return {
            rootIds: [] as mongoose.Types.ObjectId[],
            locationIds: [] as mongoose.Types.ObjectId[],
            filters: { country, state, district, city },
        };
    }

    const locationIds = await Location.find({
        isActive: true,
        $or: [
            { _id: { $in: matchedRootIds } },
            { path: { $in: matchedRootIds } },
        ],
    }).distinct('_id');

    return {
        rootIds: matchedRootIds,
        locationIds: locationIds.map((value) => value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value))),
        filters: { country, state, district, city },
    };
};
