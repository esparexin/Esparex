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

const normalizeToken = (value: string): string =>
    value
        .toLowerCase()
        .normalize('NFKC')
        .replace(/[^a-z0-9\s-]+/g, ' ')
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
