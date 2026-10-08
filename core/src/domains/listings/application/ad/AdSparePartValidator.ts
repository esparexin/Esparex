import { AppError } from '../../../../shared-kernel/errors/AppError';
import SparePart from '../../../../models/SparePart';
import { resolveEquivalentActiveCategoryIds } from '../../../catalog/application/services/CatalogCategoryService';

// ─── Spare-part validation (P3 extract-before-split from AdCreationService) ─
// Single owner for spare-part/category validity used during ad creation.

export const validateSparePartsForCategory = async (
    sparePartIds: string[],
    categoryId: string
): Promise<Array<{ _id: unknown; name: unknown; brandId?: unknown }>> => {
    const uniqueSparePartIds = Array.from(new Set(sparePartIds));
    if (uniqueSparePartIds.length === 0) return [];

    const equivalentCategoryIds = await resolveEquivalentActiveCategoryIds(categoryId);
    const categoryScope = equivalentCategoryIds.length > 0 ? equivalentCategoryIds : [categoryId];

    const validParts = await SparePart.find({
        _id: { $in: uniqueSparePartIds },
        categoryIds: { $in: categoryScope },
        isActive: true
    }).select('_id name brandId').lean();

    if (validParts.length !== uniqueSparePartIds.length) {
        throw new AppError('One or more selected spare parts are invalid for the selected category.', 400);
    }

    return validParts;
};
