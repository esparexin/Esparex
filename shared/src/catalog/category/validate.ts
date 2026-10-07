interface AssignableCategory {
    id: string;
    isActive: boolean;
    status?: string;
}

function isAssignable(category: AssignableCategory): boolean {
    return (
        category.isActive &&
        category.status !== "inactive" &&
        category.status !== "rejected"
    );
}


export function assignableCategoryIdSet(categories: AssignableCategory[]): Set<string> {
    return new Set(categories.filter(isAssignable).map(c => c.id));
}
