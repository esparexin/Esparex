/**
 * Shared category filter utilities.
 *
 * These predicates were previously duplicated across brands, spare-parts-catalog,
 * screen-sizes, and service-types pages. Centralised here as the SSOT.
 */

export interface AssignableCategory {
    id: string;
    isActive: boolean;
    status?: string;
}

/**
 * Returns true for any category that can be assigned to master data entries
 * (brands, spare parts, screen sizes, service types).
 *
 * A category is assignable when it is active and not in a rejected/inactive state.
 */
export function isAssignable(category: AssignableCategory): boolean {
    return (
        category.isActive &&
        category.status !== "inactive" &&
        category.status !== "rejected"
    );
}

/**
 * Filters and returns only the assignable categories from a list.
 */
export function filterAssignableCategories<T extends AssignableCategory>(
    categories: T[]
): T[] {
    return categories.filter(isAssignable);
}

/**
 * Returns a Set of IDs for quick O(1) membership checks.
 */
export function assignableCategoryIdSet(categories: AssignableCategory[]): Set<string> {
    return new Set(categories.filter(isAssignable).map(c => c.id));
}
