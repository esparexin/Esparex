import slugify from 'slugify';
import {
    TAXONOMY_APPROVAL_STATUS,
    type TaxonomyApprovalStatusValue,
} from '../../constants/enums/taxonomyApprovalStatus';

type NullableDate = Date | string | null | undefined;

const toTrimmedString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    return undefined;
};

export const normalizeToken = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFKC')
        .replace(/-/g, ' ')
        .replace(/[^a-z0-9\s]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

export const normalizeCatalogCanonicalName = (value: string): string =>
    normalizeToken(value);

export const normalizeCatalogList = (values: unknown): string[] => {
    if (!Array.isArray(values)) return [];
    const seen = new Set<string>();
    const output: string[] = [];

    for (const value of values) {
        const next = toTrimmedString(value);
        if (!next) continue;
        const normalized = normalizeToken(next);
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        output.push(next);
    }

    return output;
};

export const buildCatalogSlug = (value: string): string =>
    slugify(value, { lower: true, strict: true, trim: true });

export const deriveApprovalStatus = ({
    approvalStatus,
    isActive,
    fallback = TAXONOMY_APPROVAL_STATUS.APPROVED,
}: {
    approvalStatus?: unknown;
    isActive?: unknown;
    fallback?: TaxonomyApprovalStatusValue;
}): TaxonomyApprovalStatusValue => {
    const explicit = toTrimmedString(approvalStatus)?.toLowerCase();
    if (
        explicit === TAXONOMY_APPROVAL_STATUS.PENDING ||
        explicit === TAXONOMY_APPROVAL_STATUS.APPROVED ||
        explicit === TAXONOMY_APPROVAL_STATUS.REJECTED
    ) {
        return explicit;
    }

    if (typeof isActive === 'boolean') {
        return isActive ? TAXONOMY_APPROVAL_STATUS.APPROVED : TAXONOMY_APPROVAL_STATUS.PENDING;
    }

    return fallback;
};

export const isTaxonomyEntityLive = ({
    approvalStatus,
    isActive,
    deletedAt,
    isDeleted,
}: {
    approvalStatus?: unknown;
    isActive?: unknown;
    deletedAt?: NullableDate;
    isDeleted?: unknown;
}): boolean => {
    return (
        approvalStatus === TAXONOMY_APPROVAL_STATUS.APPROVED &&
        isActive === true &&
        (deletedAt === null || deletedAt === undefined) &&
        isDeleted !== true
    );
};

export const TAXONOMY_PUBLIC_VISIBILITY_QUERY = {
    approvalStatus: TAXONOMY_APPROVAL_STATUS.APPROVED,
    isActive: true,
    isDeleted: { $ne: true } as Record<string, unknown>,
    deletedAt: null,
};

export const applyTaxonomyNamingDefaults = <
    T extends {
        name?: unknown;
        displayName?: unknown;
        canonicalName?: unknown;
        slug?: unknown;
        aliases?: unknown;
        synonyms?: unknown;
    }
>(
    payload: T
) => {
    const sourceName =
        toTrimmedString(payload.displayName) ??
        toTrimmedString(payload.name) ??
        toTrimmedString(payload.canonicalName);

    if (!sourceName) {
        return;
    }

    payload.displayName = sourceName;
    payload.canonicalName = normalizeCatalogCanonicalName(sourceName);
    payload.slug = toTrimmedString(payload.slug) ?? buildCatalogSlug(sourceName);
    payload.aliases = normalizeCatalogList(payload.aliases);
    payload.synonyms = normalizeCatalogList(payload.synonyms);
};

/* -------------------------------------------------------------------------- */
/* ADVANCED SEARCH & GOVERNANCE                                                */
/* -------------------------------------------------------------------------- */

export const TAXONOMY_GOVERNANCE_THRESHOLDS = {
    FUZZY_MATCH_CONFIDENCE: 0.85,
    PENDING_AGING_DAYS: 30,
    DUPLICATE_CANDIDATE_COUNT: 10,
    SEARCH_MISS_RATE_ALERT: 0.15,
};

/**
 * Simple Levenshtein distance for fuzzy matching
 */
export const getLevenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }

    return matrix[b.length][a.length];
};

export const calculateFuzzyConfidence = (a: string, b: string): number => {
    const distance = getLevenshteinDistance(normalizeToken(a), normalizeToken(b));
    const maxLength = Math.max(a.length, b.length);
    if (maxLength === 0) return 1.0;
    return 1.0 - distance / maxLength;
};

/**
 * Checks if a new suggestion might be a duplicate of an existing entity
 */
export const isDuplicateSuggestion = (
    suggestedName: string,
    existingEntities: Array<{ name: string; aliases?: string[]; canonicalName?: string }>
): { isDuplicate: boolean; matchedWith?: string; confidence: number } => {
    const normalizedSuggested = normalizeToken(suggestedName);

    for (const entity of existingEntities) {
        // 1. Exact match on canonical name
        if (entity.canonicalName === normalizedSuggested || normalizeToken(entity.name) === normalizedSuggested) {
            return { isDuplicate: true, matchedWith: entity.name, confidence: 1.0 };
        }

        // 2. Exact match on aliases
        if (entity.aliases?.some(alias => normalizeToken(alias) === normalizedSuggested)) {
            return { isDuplicate: true, matchedWith: entity.name, confidence: 1.0 };
        }

        // 3. Fuzzy match
        const confidence = calculateFuzzyConfidence(entity.name, suggestedName);
        if (confidence >= TAXONOMY_GOVERNANCE_THRESHOLDS.FUZZY_MATCH_CONFIDENCE) {
            return { isDuplicate: true, matchedWith: entity.name, confidence };
        }
    }

    return { isDuplicate: false, confidence: 0 };
};
