import slugify from 'slugify';

export const LOCATION_LEVELS = ['country', 'state', 'district', 'city', 'area', 'village'] as const;
export type LocationLevel = (typeof LOCATION_LEVELS)[number];

const asString = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (value === undefined || value === undefined) return '';
    return String(value);
};

export const normalizeLocationLevel = (value: unknown): LocationLevel | undefined => {
    const normalized = asString(value).toLowerCase();
    if (!normalized) return undefined;
    return (LOCATION_LEVELS as readonly string[]).includes(normalized)
        ? (normalized as LocationLevel)
        : undefined;
};

export const normalizeLocationNameForSearch = (value: unknown): string => {
    const source = asString(value);
    return slugify(source, {
        lower: true,
        strict: true,
        trim: true,
        replacement: ''
    });
};

export const buildLocationSlug = (...parts: Array<unknown>): string =>
    slugify(
        parts
            .map((part) => asString(part))
            .filter((part): part is string => Boolean(part))
            .join('-'),
        {
            lower: true,
            strict: true,
            trim: true
        }
    );
