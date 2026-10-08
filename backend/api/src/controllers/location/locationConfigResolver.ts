import { getSystemConfigDoc } from "@esparex/core";
import type { LocationResponseLike } from '@esparex/core';

// ─── Location config resolver (P4 extract-before-split from locationController) ─
// Single owner for controller-level location configuration + center parsing.
// Verbatim move; the controller stays responsible for HTTP concerns only.

export type LocationLike = LocationResponseLike;

export type LocationConfig = {
    autoCompleteMinChars: number;
    maxSearchRadius: number;
    enableReverseGeocoding: boolean;
    enableAutoComplete: boolean;
};

const DEFAULT_LOCATION_CONFIG: LocationConfig = {
    autoCompleteMinChars: 2,
    maxSearchRadius: 100,
    enableReverseGeocoding: true,
    enableAutoComplete: true,
};

const LOCATION_CONFIG_TTL_MS = 60 * 1000;
let cachedLocationConfig: { data: LocationConfig; timestamp: number } | null = null;

export const getLocationConfig = async (): Promise<LocationConfig> => {
    if (cachedLocationConfig && Date.now() - cachedLocationConfig.timestamp < LOCATION_CONFIG_TTL_MS) {
        return cachedLocationConfig.data;
    }

    try {
        const configDoc = await getSystemConfigDoc();
        const rawLocation = (configDoc as { location?: Record<string, unknown> } | null)?.location || {};

        const data: LocationConfig = {
            autoCompleteMinChars: Number(rawLocation.autoCompleteMinChars) || DEFAULT_LOCATION_CONFIG.autoCompleteMinChars,
            maxSearchRadius: Number(rawLocation.maxSearchRadius) || DEFAULT_LOCATION_CONFIG.maxSearchRadius,
            enableReverseGeocoding: typeof rawLocation.enableReverseGeocoding === 'boolean'
                ? rawLocation.enableReverseGeocoding
                : DEFAULT_LOCATION_CONFIG.enableReverseGeocoding,
            enableAutoComplete: typeof rawLocation.enableAutoComplete === 'boolean'
                ? rawLocation.enableAutoComplete
                : DEFAULT_LOCATION_CONFIG.enableAutoComplete
        };

        cachedLocationConfig = { data, timestamp: Date.now() };
        return data;
    } catch {
        return DEFAULT_LOCATION_CONFIG;
    }
};

export const toConfiguredCenter = (value: unknown): { lat?: number; lng?: number } | undefined => {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    return {
        lat: typeof record.lat === 'number' ? record.lat : undefined,
        lng: typeof record.lng === 'number' ? record.lng : undefined,
    };
};
