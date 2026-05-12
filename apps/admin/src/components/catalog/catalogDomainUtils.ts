type CategoryLinkedEntity = {
    categoryIds?: string[] | null;
    approvalStatus?: string | null;
    isActive?: boolean;
    isDeleted?: boolean;
};

type NamedCategory = {
    id?: string | null;
    name?: string | null;
    isActive?: boolean;
    approvalStatus?: string | null;
};

export type CatalogTaxonomyLifecycleStatus = "live" | "inactive" | "pending" | "rejected";

export function deriveTaxonomyLifecycleStatus(entity: {
    approvalStatus?: string | null;
    isActive?: boolean;
    isDeleted?: boolean;
}): CatalogTaxonomyLifecycleStatus {
    const approvalStatus = (entity.approvalStatus || "").toLowerCase();
    if (approvalStatus === "pending") return "pending";
    if (approvalStatus === "rejected") return "rejected";
    if (entity.isDeleted || entity.isActive === false) return "inactive";
    return "live";
}

export function getEntityCategoryIds(entity: CategoryLinkedEntity): string[] {
    if (Array.isArray(entity.categoryIds) && entity.categoryIds.length > 0) {
        return entity.categoryIds.filter(Boolean);
    }
    return [];
}

export function getUniqueIds(ids: string[]): string[] {
    return Array.from(new Set(ids));
}

export function toCategoryOptions(categories: NamedCategory[]): { id: string; name: string }[] {
    return categories.flatMap((category) =>
        category.id ? [{ id: category.id, name: category.name || category.id }] : []
    );
}

export function splitAssignableCategoryIds(categoryIds: string[], assignableIdSet: Set<string | undefined>) {
    const assignable = categoryIds.filter((id) => assignableIdSet.has(id));
    return {
        assignableCategoryIds: assignable,
        archivedCategoryCount: categoryIds.length - assignable.length,
    };
}

export function resolveModalAssignableCategoryState(
    entity: CategoryLinkedEntity,
    assignableIdSet: Set<string | undefined>
) {
    const categoryIds = getUniqueIds(getEntityCategoryIds(entity));
    return splitAssignableCategoryIds(categoryIds, assignableIdSet);
}

export function hasCategoryOverlap(
    entity: CategoryLinkedEntity | undefined,
    selectedCategoryIds: string[]
): boolean {
    if (!entity) return true;
    const linkedCategoryIds = getEntityCategoryIds(entity);
    return selectedCategoryIds.some((categoryId) => linkedCategoryIds.includes(categoryId));
}

export function validateRequiredCategoryIds(categoryIds: string[]): string | null {
    if (categoryIds.length === 0) return "At least one category is required";
    return null;
}

function getInvalidCategoryHint(category: NamedCategory | undefined): string {
    if (!category) return " (Missing)";
    if (!category.isActive) return " (Inactive)";
    if ((category.approvalStatus || "").toLowerCase() === "rejected") return " (Rejected)";
    return " (Invalid Type)";
}

export function buildSpareCategoryDisplayRows(
    categories: NamedCategory[],
    assignableCategories: NamedCategory[],
    selectedCategoryIds: string[],
    assignableIdSet: Set<string | undefined>
) {
    return getUniqueIds([
        ...assignableCategories.flatMap((category) => (category.id ? [category.id] : [])),
        ...selectedCategoryIds,
    ])
        .map((id) => {
            const category = categories.find((item) => item.id === id);
            const isInvalid = !assignableIdSet.has(id);
            return {
                id,
                name: category?.name || id,
                isInvalid,
                errorHint: isInvalid ? getInvalidCategoryHint(category) : "",
            };
        })
        .sort((left, right) => {
            if (left.isInvalid && !right.isInvalid) return -1;
            if (!left.isInvalid && right.isInvalid) return 1;
            return (left.name || "").localeCompare(right.name || "");
        });
}
