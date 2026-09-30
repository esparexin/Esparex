/**
 * formatCatalogDisplayName — Canonical catalog display-name formatter.
 *
 * Owned by: @esparex/shared (audit F2).
 * The per-domain format modules (brand/category/model/sparePart/
 * screenSize/serviceType) are thin aliases of this single
 * implementation so the CatalogFacade namespaces keep working
 * unchanged. Do not add per-domain formatting branches here;
 * extend this one function instead.
 */
export function formatCatalogDisplayName(name?: string): string {
    if (!name) return "";
    return name.trim();
}
