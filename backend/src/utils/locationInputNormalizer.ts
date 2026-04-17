import mongoose from 'mongoose';
import { hasValidCoordinateArray } from '@shared/utils/geoUtils';
import { asString } from '../services/location/LocationService.helpers';
import { toTitleCase } from './stringUtils';
import { toObjectId } from './idUtils';
import { buildHierarchyPath } from './locationHierarchyUtils';

import { LOCATION_LEVELS, type LocationLevel, normalizeLocationLevel, normalizeLocationNameForSearch, buildLocationSlug } from './locationPrimitives';

export { LOCATION_LEVELS, type LocationLevel, normalizeLocationLevel, normalizeLocationNameForSearch, buildLocationSlug };

type LocationLikeInput = {
    name?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
    district?: unknown;
    level?: unknown;
    coordinates?: unknown;
    aliases?: unknown;
    parentId?: unknown;
    [key: string]: unknown;
};

type NormalizeLocationInputOptions = {
    resolveHierarchy?: boolean;
    ensureUnique?: boolean;
    defaultCountry?: string;
    excludeId?: unknown;
    documentId?: mongoose.Types.ObjectId;
};

export type NormalizedLocationPersistenceInput = {
    documentId: mongoose.Types.ObjectId;
    name: string;
    normalizedName: string;
    slug: string;
    city: string;
    state: string;
    country: string;
    district?: string;
    level: LocationLevel;
    aliases: string[];
    coordinates: {
        type: 'Point';
        coordinates: [number, number];
    };
    parentId: mongoose.Types.ObjectId | null;
    path: mongoose.Types.ObjectId[];
};





const loadLocationModel = async () => (await import('../models/Location')).default;
const loadHierarchyUtils = async () => import('./locationHierarchy');



const extractCoordinates = (value: unknown): [number, number] => {
    if (
        value &&
        typeof value === 'object' &&
        (value as { type?: unknown }).type === 'Point' &&
        hasValidCoordinateArray((value as { coordinates?: unknown }).coordinates)
    ) {
        return [...(value as { coordinates: [number, number] }).coordinates];
    }

    if (
        value &&
        typeof value === 'object' &&
        'coordinates' in (value as Record<string, unknown>) &&
        hasValidCoordinateArray((value as { coordinates?: unknown }).coordinates)
    ) {
        return [...((value as { coordinates: [number, number] }).coordinates)];
    }

    throw new Error('Invalid coordinates');
};

const normalizeAliases = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .map((entry) => toTitleCase(asString(entry)))
                .filter((entry): entry is string => Boolean(entry))
        )
    );
};

export const normalizeLocationInput = async (
    input: LocationLikeInput,
    options: NormalizeLocationInputOptions = {}
): Promise<NormalizedLocationPersistenceInput> => {
    const level = normalizeLocationLevel(input.level) || 'city';
    const preferredName =
        asString(input.name) ||
        (level === 'district' ? asString(input.district) : undefined) ||
        asString(input.city) ||
        '';
    const name = toTitleCase(preferredName);
    const city = toTitleCase(asString(input.city) || name);
    const state = toTitleCase(asString(input.state) || '');
    const country = toTitleCase(asString(input.country) || options.defaultCountry || 'Unknown');
    const district = toTitleCase(asString(input.district) || '');
    const coordinates = extractCoordinates(input.coordinates);
    const normalizedName = normalizeLocationNameForSearch(name);

    if (!name || !normalizedName) {
        throw new Error('Location name is required');
    }

    const slug = buildLocationSlug(name, city, state || country);
    const aliases = normalizeAliases(input.aliases);

    let parentId = toObjectId(input.parentId);
    let path: mongoose.Types.ObjectId[] = [];
    let parentLocation: { _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[] } | null = null;

    if (parentId) {
        const Location = await loadLocationModel();
        parentLocation = await Location.findOne({ _id: parentId, isActive: true })
            .select('_id path')
            .lean<{ _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[] } | null>();
        if (!parentLocation) {
            throw new Error('Invalid parent location');
        }
    } else if (options.resolveHierarchy) {
        const { resolveParentLocation } = await loadHierarchyUtils();
        parentLocation = await resolveParentLocation({
            level,
            country,
            state,
            district,
            city,
            excludeId: options.excludeId
        });
        parentId = parentLocation?._id || null;
    }

    const documentId = options.documentId || new mongoose.Types.ObjectId();
    path = buildHierarchyPath(documentId, parentLocation);

    if (options.ensureUnique) {
        const Location = await loadLocationModel();
        const duplicate = await Location.findOne({
            isActive: true,
            normalizedName,
            level,
            state,
            ...(parentId ? { parentId } : {}),
            ...(options.excludeId && mongoose.Types.ObjectId.isValid(String(options.excludeId))
                ? { _id: { $ne: new mongoose.Types.ObjectId(String(options.excludeId)) } }
                : {})
        })
            .select('_id')
            .lean();

        if (duplicate) {
            throw new Error('Duplicate location detected');
        }
    }

    return {
        documentId,
        name,
        normalizedName,
        slug,
        city,
        state,
        country,
        district: district || undefined,
        level,
        aliases,
        coordinates: {
            type: 'Point',
            coordinates
        },
        parentId,
        path
    };
};
