import { CATALOG_STATUS, hasCatalogPollution, assertCleanCatalogText } from '@esparex/shared';

export { hasCatalogPollution, assertCleanCatalogText };

export function normalizeCatalogCanonicalName(value: string): string {
    return (value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function slugifyCatalogValue(value: string): string {
    return normalizeCatalogCanonicalName(value)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function applyCatalogGovernanceDefaults(doc: Record<string, unknown>): void {
    const displayName = typeof doc.displayName === 'string' && doc.displayName.trim()
        ? doc.displayName.trim()
        : typeof doc.name === 'string'
            ? doc.name.trim()
            : '';

    if (displayName) {
        assertCleanCatalogText('name', displayName);
        doc.name = displayName;
        doc.displayName = displayName;
    }

    if (typeof doc.canonicalName === 'string' && doc.canonicalName.trim()) {
        assertCleanCatalogText('canonicalName', doc.canonicalName);
        doc.canonicalName = normalizeCatalogCanonicalName(doc.canonicalName);
    } else if (displayName) {
        doc.canonicalName = normalizeCatalogCanonicalName(displayName);
    }

    if (typeof doc.slug === 'string' && doc.slug.trim()) {
        assertCleanCatalogText('slug', doc.slug);
        doc.slug = slugifyCatalogValue(doc.slug);
    } else if (displayName) {
        doc.slug = slugifyCatalogValue(displayName);
    }

    if (!doc.status) {
        doc.status = CATALOG_STATUS.LIVE;
    }

    for (const field of ['name', 'displayName', 'canonicalName', 'slug']) {
        if (doc[field] === '') {
            throw new Error(`${field} cannot be empty`);
        }
    }
}
