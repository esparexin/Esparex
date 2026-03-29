/**
 * Catalog Controllers - Re-export Index
 * 
 * This index file maintains backward compatibility by re-exporting all functions
 * from the split catalog controllers. Routes can continue importing from this
 * single point of entry while functions are organized into focused controllers.
 */

// Export all category functions
export {
    getCategories,
    getCategoryCounts,
    getCategoryById,
    getCategorySchema,
    updateCategorySchema,
    createCategory,
    updateCategory,
    toggleCategoryStatus,
    deleteCategory
} from './catalogCategoryController';

// Export all brand and model functions
export {
    getBrands,
    getBrandById,
    getBrandBySlug,
    createBrand,
    updateBrand,
    toggleBrandStatus,
    deleteBrand,
    approveBrand,
    rejectBrand,
    getModels,
    getModelById,
    getModelBySlug,
    createModel,
    updateModel,
    deleteModel,
    approveModel,
    rejectModel,
    ensureModel
} from './catalogBrandModelController';

// Export all spare parts functions
export {
    getSpareParts,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    getSparePartById
} from './catalogSparePartController';

// Export all reference (services + screen sizes) functions
export {
    getServiceTypes,
    getServiceTypeById,
    createServiceType,
    updateServiceType,
    toggleServiceTypeStatus,
    deleteServiceType,
    getScreenSizes,
    getScreenSizeById,
    createScreenSize,
    updateScreenSize,
    deleteScreenSize
} from './catalogReferenceController';

// Export governance functions
export {
    getHierarchyReport,
    getHierarchyTree,
    runHierarchyRepair,
    getCategoryHealth
} from './catalogGovernanceController';

// Export shared utilities
export { hasAdminAccess, getAdminActorId, asModel, sendCatalogError } from './shared';
export type { CatalogRequest, QueryRecord } from './shared';
