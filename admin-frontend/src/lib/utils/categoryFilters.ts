import type { CategoryData } from "../api/categories";

export function filterAssignableCategories(categories: CategoryData[]) {
	return categories.filter(cat => cat.isActive !== false && !cat.isDeleted);
}

export function assignableCategoryIdSet(categories: CategoryData[]) {
	return new Set(
		filterAssignableCategories(categories).map(cat => cat.id)
	);
}
// Legacy/unsafe functions removed (dead code cleanup)
