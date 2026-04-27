"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLocationScope = exports.resolveLocationPathIds = exports.resolveParentLocation = exports.normalizeStateLabel = exports.resolveLocationSummary = exports.loadHierarchyMapForLocations = exports.buildLocationSummary = exports.toLocationIdString = exports.asString = exports.HIERARCHY_LEVELS = exports.buildHierarchyPath = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Location_1 = __importDefault(require("@core/models/Location"));
const stringUtils_1 = require("./stringUtils");
const locationPrimitives_1 = require("./locationPrimitives");
const idUtils_1 = require("./idUtils");
/**
 * Builds a canonical location hierarchy path (array of ObjectIds) from self to root.
 * NOTE: The implementation below produces [root...parent, self] order.
 */
const buildHierarchyPath = (selfId, parent) => {
    const chain = Array.isArray(parent?.path) && parent.path.length > 0
        ? [...parent.path, selfId]
        : parent?._id
            ? [parent._id, selfId]
            : [selfId];
    const deduped = [];
    const seen = new Set();
    for (const item of chain) {
        const key = String(item);
        if (seen.has(key))
            continue;
        seen.add(key);
        deduped.push(item);
    }
    return deduped;
};
exports.buildHierarchyPath = buildHierarchyPath;
const logger_1 = __importDefault(require("./logger"));
exports.HIERARCHY_LEVELS = locationPrimitives_1.LOCATION_LEVELS;
const asString = (value) => {
    if (typeof value !== 'string')
        return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};
exports.asString = asString;
const toLocationIdString = (value) => {
    if (!value)
        return undefined;
    if (typeof value === 'string')
        return value;
    return value.toString();
};
exports.toLocationIdString = toLocationIdString;
const buildLocationSummary = (location, hierarchyMap) => {
    const ownName = (0, exports.asString)(location.name) || '';
    const currentLevel = (0, exports.asString)(location.level) || '';
    const hierarchyTrail = Array.isArray(location.path)
        ? location.path
            .map((entry) => (0, exports.toLocationIdString)(entry))
            .filter((entry) => Boolean(entry))
            .map((entry) => hierarchyMap.get(entry))
            .filter((entry) => Boolean(entry))
        : [];
    const findHierarchyName = (level) => hierarchyTrail.find((entry) => entry.level === level)?.name || '';
    let city = findHierarchyName('city');
    if (!city) {
        if (currentLevel === 'city' || currentLevel === 'district' || currentLevel === 'state' || currentLevel === 'country') {
            city = ownName;
        }
        else if (currentLevel === 'area' || currentLevel === 'village') {
            city = findHierarchyName('district') || ownName;
        }
        else {
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
    const country = (0, exports.asString)(location.country) || findHierarchyName('country') || '';
    return {
        id: (0, exports.toLocationIdString)(location._id) || '',
        name: ownName,
        city,
        district,
        state,
        country,
        level: currentLevel,
    };
};
exports.buildLocationSummary = buildLocationSummary;
const loadHierarchyMapForLocations = async (locations) => {
    const hierarchyIds = new Set();
    for (const location of locations) {
        if (!location)
            continue;
        const currentId = (0, exports.toLocationIdString)(location._id);
        if (currentId) {
            hierarchyIds.add(currentId);
        }
        for (const entry of location.path || []) {
            const entryId = (0, exports.toLocationIdString)(entry);
            if (entryId) {
                hierarchyIds.add(entryId);
            }
        }
        const parentId = (0, exports.toLocationIdString)(location.parentId);
        if (parentId) {
            hierarchyIds.add(parentId);
        }
    }
    const hierarchyLocations = hierarchyIds.size > 0
        ? await Location_1.default.find({ _id: { $in: Array.from(hierarchyIds) } })
            .select('_id name country level parentId path')
            .lean()
        : [];
    return new Map(hierarchyLocations.map((entry) => [String(entry._id), entry]));
};
exports.loadHierarchyMapForLocations = loadHierarchyMapForLocations;
const resolveLocationSummary = async (location) => {
    if (!location)
        return null;
    const hierarchyMap = await (0, exports.loadHierarchyMapForLocations)([location]);
    return (0, exports.buildLocationSummary)(location, hierarchyMap);
};
exports.resolveLocationSummary = resolveLocationSummary;
const normalizeStateLabel = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : 'Unknown';
    }
    if (value && typeof value === 'object') {
        const obj = value;
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
exports.normalizeStateLabel = normalizeStateLabel;
const toExactRegex = (value) => new RegExp(`^${(0, stringUtils_1.escapeRegExp)(value)}$`, 'i');
const equalsIgnoreCase = (left, right) => {
    if (!left || !right)
        return false;
    return left.trim().toLowerCase() === right.trim().toLowerCase();
};
const resolveParentLocation = async (params) => {
    const level = (0, locationPrimitives_1.normalizeLocationLevel)(params.level);
    if (!level || level === 'country')
        return null;
    const country = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.country));
    const state = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.state));
    const district = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.district));
    const city = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.city));
    const excludeId = (0, idUtils_1.toObjectId)(params.excludeId);
    const baseQuery = { isActive: true };
    if (excludeId) {
        baseQuery._id = { $ne: excludeId };
    }
    // All queries now use `name` (the location's own name field) + `level` instead of
    // the removed deprecated `city`/`state` flat fields.
    let parentQuery = null;
    if (level === 'state') {
        if (!country)
            return null;
        parentQuery = {
            ...baseQuery,
            level: 'country',
            $or: [
                { name: toExactRegex(country) },
                { country: toExactRegex(country) },
            ],
        };
    }
    else if (level === 'district') {
        if (!state)
            return null;
        parentQuery = {
            ...baseQuery,
            level: 'state',
            name: toExactRegex(state),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    }
    else if (level === 'city') {
        if (!district && !state)
            return null;
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
    }
    else if (level === 'area') {
        if (!city)
            return null;
        // Parent of an area is a city; `name` on a city-level doc IS the city name
        parentQuery = {
            ...baseQuery,
            level: 'city',
            name: toExactRegex(city),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    }
    else if (level === 'village') {
        if (!city)
            return null;
        // Parent of a village is an area; `name` on an area-level doc IS the area/city name
        parentQuery = {
            ...baseQuery,
            level: 'area',
            name: toExactRegex(city),
            ...(country ? { country: toExactRegex(country) } : {}),
        };
    }
    if (!parentQuery)
        return null;
    const parent = await Location_1.default.findOne(parentQuery)
        .select('_id name level parentId path country priority isPopular createdAt')
        .sort({ isPopular: -1, priority: -1, createdAt: 1 })
        .lean();
    return parent || null;
};
exports.resolveParentLocation = resolveParentLocation;
const resolveLocationPathIds = async (locationId) => {
    const objectId = (0, idUtils_1.toObjectId)(locationId);
    if (!objectId)
        return [];
    const start = await Location_1.default.findById(objectId)
        .select('_id parentId path')
        .lean();
    if (!start?._id)
        return [];
    if (Array.isArray(start.path) && start.path.length > 0) {
        const containsSelf = start.path.some((entry) => String(entry) === String(start._id));
        if (containsSelf) {
            return (0, exports.buildHierarchyPath)(start._id, { _id: start._id, path: start.path.slice(0, -1) });
        }
    }
    const visited = new Set([String(start._id)]);
    const chain = [start._id];
    let currentParentId = start.parentId ?? null;
    while (currentParentId) {
        const key = String(currentParentId);
        if (visited.has(key)) {
            logger_1.default.error('Location hierarchy cycle detected', { locationId: currentParentId, visitedChain: Array.from(visited) });
            throw new Error(`Location hierarchy cycle detected at locationId: ${String(currentParentId)}`);
        }
        visited.add(key);
        const parent = await Location_1.default.findById(currentParentId)
            .select('_id parentId path')
            .lean();
        if (!parent?._id)
            break;
        if (Array.isArray(parent.path) && parent.path.length > 0) {
            return (0, exports.buildHierarchyPath)(start._id, parent);
        }
        chain.unshift(parent._id);
        currentParentId = parent.parentId ?? null;
    }
    return chain;
};
exports.resolveLocationPathIds = resolveLocationPathIds;
const resolveLocationScope = async (params) => {
    const country = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.country));
    const state = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.state));
    const district = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.district));
    const city = (0, stringUtils_1.toTitleCase)((0, exports.asString)(params.city));
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
            rootIds: null,
            locationIds: null,
            filters: { country, state, district, city },
        };
    }
    if (deepestLevel === 'country' && country) {
        const countryLocationIds = await Location_1.default.find({
            isActive: true,
            country: toExactRegex(country),
        }).distinct('_id');
        return {
            rootIds: countryLocationIds.map((value) => value instanceof mongoose_1.default.Types.ObjectId ? value : new mongoose_1.default.Types.ObjectId(String(value))),
            locationIds: countryLocationIds.map((value) => value instanceof mongoose_1.default.Types.ObjectId ? value : new mongoose_1.default.Types.ObjectId(String(value))),
            filters: { country, state, district, city },
        };
    }
    const query = {
        isActive: true,
        level: deepestLevel,
    };
    if (deepestLevel === 'state' && state) {
        query.name = toExactRegex(state);
        if (country) {
            query.country = toExactRegex(country);
        }
    }
    else if (deepestLevel === 'district' && district) {
        query.name = toExactRegex(district);
        if (country) {
            query.country = toExactRegex(country);
        }
    }
    else if (deepestLevel === 'city' && city) {
        query.name = toExactRegex(city);
        if (country) {
            query.country = toExactRegex(country);
        }
    }
    const candidates = await Location_1.default.find(query)
        .select('_id name country level parentId path')
        .lean();
    if (candidates.length === 0) {
        return {
            rootIds: [],
            locationIds: [],
            filters: { country, state, district, city },
        };
    }
    const hierarchyMap = await (0, exports.loadHierarchyMapForLocations)(candidates);
    const matchedRootIds = candidates
        .filter((candidate) => {
        const summary = (0, exports.buildLocationSummary)(candidate, hierarchyMap);
        if (country && !equalsIgnoreCase(summary.country, country))
            return false;
        if (state && !equalsIgnoreCase(summary.state, state))
            return false;
        if (district && !equalsIgnoreCase(summary.district, district))
            return false;
        if (city && !equalsIgnoreCase(summary.city, city))
            return false;
        return true;
    })
        .map((candidate) => candidate._id)
        .filter((value) => value instanceof mongoose_1.default.Types.ObjectId || mongoose_1.default.Types.ObjectId.isValid(String(value)))
        .map((value) => value instanceof mongoose_1.default.Types.ObjectId ? value : new mongoose_1.default.Types.ObjectId(String(value)));
    if (matchedRootIds.length === 0) {
        return {
            rootIds: [],
            locationIds: [],
            filters: { country, state, district, city },
        };
    }
    const locationIds = await Location_1.default.find({
        isActive: true,
        $or: [
            { _id: { $in: matchedRootIds } },
            { path: { $in: matchedRootIds } },
        ],
    }).distinct('_id');
    return {
        rootIds: matchedRootIds,
        locationIds: locationIds.map((value) => value instanceof mongoose_1.default.Types.ObjectId ? value : new mongoose_1.default.Types.ObjectId(String(value))),
        filters: { country, state, district, city },
    };
};
exports.resolveLocationScope = resolveLocationScope;
//# sourceMappingURL=locationHierarchy.js.map