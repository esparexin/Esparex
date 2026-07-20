import { validateCatalogName } from '../common/validation';


export function validateCategoryName(name: string): { ok: boolean; reason?: string } {
    return validateCatalogName(name);
}

export interface AssignableCategory {
    id: string;
    isActive: boolean;
    status?: string;
}

export function isAssignable(category: AssignableCategory): boolean {
    return (
        category.isActive &&
        category.status !== "inactive" &&
        category.status !== "rejected"
    );
}

export function filterAssignableCategories<T extends AssignableCategory>(
    categories: T[]
): T[] {
    return categories.filter(isAssignable);
}

export function assignableCategoryIdSet(categories: AssignableCategory[]): Set<string> {
    return new Set(categories.filter(isAssignable).map(c => c.id));
}
