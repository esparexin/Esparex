"use strict";
/**
 * Catalog Controllers - Re-export Index
 *
 * This index file maintains backward compatibility by re-exporting all functions
 * from the split catalog controllers. Routes can continue importing from this
 * single point of entry while functions are organized into focused controllers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryHealth = exports.runHierarchyRepair = exports.getHierarchyTree = exports.getHierarchyReport = exports.deleteScreenSize = exports.toggleScreenSizeStatus = exports.updateScreenSize = exports.createScreenSize = exports.getScreenSizeById = exports.getScreenSizes = exports.deleteServiceType = exports.toggleServiceTypeStatus = exports.updateServiceType = exports.createServiceType = exports.getServiceTypeById = exports.getServiceTypes = exports.getSparePartById = exports.toggleSparePartStatus = exports.deleteSparePart = exports.updateSparePart = exports.createSparePart = exports.getSpareParts = exports.ensureModel = exports.toggleModelStatus = exports.rejectModel = exports.approveModel = exports.deleteModel = exports.updateModel = exports.createModel = exports.getModelBySlug = exports.getModelById = exports.getModels = exports.rejectBrand = exports.approveBrand = exports.deleteBrand = exports.toggleBrandStatus = exports.updateBrand = exports.createBrand = exports.getBrandBySlug = exports.getBrandById = exports.getBrands = exports.deleteCategory = exports.toggleCategoryStatus = exports.updateCategory = exports.createCategory = exports.updateCategorySchema = exports.getCategorySchema = exports.getCategoryById = exports.getCategoryCounts = exports.getCategories = void 0;
exports.sendCatalogError = exports.asModel = exports.getAdminActorId = exports.hasAdminAccess = void 0;
// Export all category functions
var catalogCategoryController_1 = require("./catalogCategoryController");
Object.defineProperty(exports, "getCategories", { enumerable: true, get: function () { return catalogCategoryController_1.getCategories; } });
Object.defineProperty(exports, "getCategoryCounts", { enumerable: true, get: function () { return catalogCategoryController_1.getCategoryCounts; } });
Object.defineProperty(exports, "getCategoryById", { enumerable: true, get: function () { return catalogCategoryController_1.getCategoryById; } });
Object.defineProperty(exports, "getCategorySchema", { enumerable: true, get: function () { return catalogCategoryController_1.getCategorySchema; } });
Object.defineProperty(exports, "updateCategorySchema", { enumerable: true, get: function () { return catalogCategoryController_1.updateCategorySchema; } });
Object.defineProperty(exports, "createCategory", { enumerable: true, get: function () { return catalogCategoryController_1.createCategory; } });
Object.defineProperty(exports, "updateCategory", { enumerable: true, get: function () { return catalogCategoryController_1.updateCategory; } });
Object.defineProperty(exports, "toggleCategoryStatus", { enumerable: true, get: function () { return catalogCategoryController_1.toggleCategoryStatus; } });
Object.defineProperty(exports, "deleteCategory", { enumerable: true, get: function () { return catalogCategoryController_1.deleteCategory; } });
// Export all brand and model functions
var catalogBrandModelController_1 = require("./catalogBrandModelController");
Object.defineProperty(exports, "getBrands", { enumerable: true, get: function () { return catalogBrandModelController_1.getBrands; } });
Object.defineProperty(exports, "getBrandById", { enumerable: true, get: function () { return catalogBrandModelController_1.getBrandById; } });
Object.defineProperty(exports, "getBrandBySlug", { enumerable: true, get: function () { return catalogBrandModelController_1.getBrandBySlug; } });
Object.defineProperty(exports, "createBrand", { enumerable: true, get: function () { return catalogBrandModelController_1.createBrand; } });
Object.defineProperty(exports, "updateBrand", { enumerable: true, get: function () { return catalogBrandModelController_1.updateBrand; } });
Object.defineProperty(exports, "toggleBrandStatus", { enumerable: true, get: function () { return catalogBrandModelController_1.toggleBrandStatus; } });
Object.defineProperty(exports, "deleteBrand", { enumerable: true, get: function () { return catalogBrandModelController_1.deleteBrand; } });
Object.defineProperty(exports, "approveBrand", { enumerable: true, get: function () { return catalogBrandModelController_1.approveBrand; } });
Object.defineProperty(exports, "rejectBrand", { enumerable: true, get: function () { return catalogBrandModelController_1.rejectBrand; } });
Object.defineProperty(exports, "getModels", { enumerable: true, get: function () { return catalogBrandModelController_1.getModels; } });
Object.defineProperty(exports, "getModelById", { enumerable: true, get: function () { return catalogBrandModelController_1.getModelById; } });
Object.defineProperty(exports, "getModelBySlug", { enumerable: true, get: function () { return catalogBrandModelController_1.getModelBySlug; } });
Object.defineProperty(exports, "createModel", { enumerable: true, get: function () { return catalogBrandModelController_1.createModel; } });
Object.defineProperty(exports, "updateModel", { enumerable: true, get: function () { return catalogBrandModelController_1.updateModel; } });
Object.defineProperty(exports, "deleteModel", { enumerable: true, get: function () { return catalogBrandModelController_1.deleteModel; } });
Object.defineProperty(exports, "approveModel", { enumerable: true, get: function () { return catalogBrandModelController_1.approveModel; } });
Object.defineProperty(exports, "rejectModel", { enumerable: true, get: function () { return catalogBrandModelController_1.rejectModel; } });
Object.defineProperty(exports, "toggleModelStatus", { enumerable: true, get: function () { return catalogBrandModelController_1.toggleModelStatus; } });
Object.defineProperty(exports, "ensureModel", { enumerable: true, get: function () { return catalogBrandModelController_1.ensureModel; } });
// Export all spare parts functions
var catalogSparePartController_1 = require("./catalogSparePartController");
Object.defineProperty(exports, "getSpareParts", { enumerable: true, get: function () { return catalogSparePartController_1.getSpareParts; } });
Object.defineProperty(exports, "createSparePart", { enumerable: true, get: function () { return catalogSparePartController_1.createSparePart; } });
Object.defineProperty(exports, "updateSparePart", { enumerable: true, get: function () { return catalogSparePartController_1.updateSparePart; } });
Object.defineProperty(exports, "deleteSparePart", { enumerable: true, get: function () { return catalogSparePartController_1.deleteSparePart; } });
Object.defineProperty(exports, "toggleSparePartStatus", { enumerable: true, get: function () { return catalogSparePartController_1.toggleSparePartStatus; } });
Object.defineProperty(exports, "getSparePartById", { enumerable: true, get: function () { return catalogSparePartController_1.getSparePartById; } });
// Export all reference (services + screen sizes) functions
var catalogReferenceController_1 = require("./catalogReferenceController");
Object.defineProperty(exports, "getServiceTypes", { enumerable: true, get: function () { return catalogReferenceController_1.getServiceTypes; } });
Object.defineProperty(exports, "getServiceTypeById", { enumerable: true, get: function () { return catalogReferenceController_1.getServiceTypeById; } });
Object.defineProperty(exports, "createServiceType", { enumerable: true, get: function () { return catalogReferenceController_1.createServiceType; } });
Object.defineProperty(exports, "updateServiceType", { enumerable: true, get: function () { return catalogReferenceController_1.updateServiceType; } });
Object.defineProperty(exports, "toggleServiceTypeStatus", { enumerable: true, get: function () { return catalogReferenceController_1.toggleServiceTypeStatus; } });
Object.defineProperty(exports, "deleteServiceType", { enumerable: true, get: function () { return catalogReferenceController_1.deleteServiceType; } });
Object.defineProperty(exports, "getScreenSizes", { enumerable: true, get: function () { return catalogReferenceController_1.getScreenSizes; } });
Object.defineProperty(exports, "getScreenSizeById", { enumerable: true, get: function () { return catalogReferenceController_1.getScreenSizeById; } });
Object.defineProperty(exports, "createScreenSize", { enumerable: true, get: function () { return catalogReferenceController_1.createScreenSize; } });
Object.defineProperty(exports, "updateScreenSize", { enumerable: true, get: function () { return catalogReferenceController_1.updateScreenSize; } });
Object.defineProperty(exports, "toggleScreenSizeStatus", { enumerable: true, get: function () { return catalogReferenceController_1.toggleScreenSizeStatus; } });
Object.defineProperty(exports, "deleteScreenSize", { enumerable: true, get: function () { return catalogReferenceController_1.deleteScreenSize; } });
// Export governance functions
var catalogGovernanceController_1 = require("./catalogGovernanceController");
Object.defineProperty(exports, "getHierarchyReport", { enumerable: true, get: function () { return catalogGovernanceController_1.getHierarchyReport; } });
Object.defineProperty(exports, "getHierarchyTree", { enumerable: true, get: function () { return catalogGovernanceController_1.getHierarchyTree; } });
Object.defineProperty(exports, "runHierarchyRepair", { enumerable: true, get: function () { return catalogGovernanceController_1.runHierarchyRepair; } });
Object.defineProperty(exports, "getCategoryHealth", { enumerable: true, get: function () { return catalogGovernanceController_1.getCategoryHealth; } });
// Export shared utilities
var shared_1 = require("./shared");
Object.defineProperty(exports, "hasAdminAccess", { enumerable: true, get: function () { return shared_1.hasAdminAccess; } });
Object.defineProperty(exports, "getAdminActorId", { enumerable: true, get: function () { return shared_1.getAdminActorId; } });
Object.defineProperty(exports, "asModel", { enumerable: true, get: function () { return shared_1.asModel; } });
Object.defineProperty(exports, "sendCatalogError", { enumerable: true, get: function () { return shared_1.sendCatalogError; } });
//# sourceMappingURL=index.js.map