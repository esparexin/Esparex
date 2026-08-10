import { CATALOG_STATUS } from '@esparex/contracts';
import { hasCatalogPollution, assertCleanCatalogText } from '@esparex/shared';

export { hasCatalogPollution, assertCleanCatalogText };

export function normalizeCatalogCanonicalName(value: string): string {
    return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugifyCatalogValue(value: string): string {
    return normalizeCatalogCanonicalName(value)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function applyCatalogGovernanceDefaults(doc: {
    name?: string;
    displayName?: string;
    canonicalName?: string;
    slug?: string;
    approvalStatus?: string;
    status?: string;
    isActive?: boolean;
    set?: (path: string, val: unknown) => void;
} | Record<string, unknown>): void {
    const raw = doc as Record<string, unknown>;
    const displayName = typeof raw.displayName === 'string' && raw.displayName.trim()
        ? raw.displayName.trim()
        : typeof raw.name === 'string'
            ? raw.name.trim()
            : '';

    if (displayName) {
        assertCleanCatalogText('name', displayName);
        raw.name = displayName;
        raw.displayName = displayName;
    }

    if (typeof raw.canonicalName === 'string' && raw.canonicalName.trim()) {
        assertCleanCatalogText('canonicalName', raw.canonicalName);
        raw.canonicalName = normalizeCatalogCanonicalName(raw.canonicalName);
    } else if (displayName) {
        raw.canonicalName = normalizeCatalogCanonicalName(displayName);
    }

    if (typeof raw.slug === 'string' && raw.slug.trim()) {
        assertCleanCatalogText('slug', raw.slug);
        raw.slug = slugifyCatalogValue(raw.slug);
    } else if (displayName) {
        raw.slug = slugifyCatalogValue(displayName);
    }

    if (!raw.status) {
        raw.status = CATALOG_STATUS.LIVE;
    }

    for (const field of ['name', 'displayName', 'canonicalName', 'slug']) {
        if (raw[field] === '') {
            throw new Error(`${field} cannot be empty`);
        }
    }
}
