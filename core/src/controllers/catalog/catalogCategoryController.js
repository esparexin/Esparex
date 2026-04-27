"use strict";
/**
 * Catalog Category Controller
 * Handles all category-related operations
 * Extracted from catalog.content.controller.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.toggleCategoryStatus = exports.updateCategory = exports.createCategory = exports.updateCategorySchema = exports.getCategorySchema = exports.getCategoryById = exports.getCategoryCounts = exports.getCategories = void 0;
const slugify_1 = __importDefault(require("slugify"));
const db_1 = require("@core/config/db");
const contentHandler_1 = require("@core/utils/contentHandler");
const CatalogCategoryService_1 = require("@core/services/catalog/CatalogCategoryService");
const adminLogger_1 = require("@core/utils/adminLogger");
const AppError_1 = require("@core/utils/AppError");
const respond_1 = require("@core/utils/respond");
// import { categorySpecificFilters } from '../../constants/categorySchema'; // Deprecated - migrating to DB
const CatalogOrchestrator_1 = __importDefault(require("@core/services/catalog/CatalogOrchestrator"));
const categoryCanonical_1 = require("@core/utils/categoryCanonical");
// Note: constants/categorySchema was removed; category filters are now DB-stored.
const catalog_validator_1 = require("@core/validators/catalog.validator");
const shared_1 = require("./shared");
const catalogStatus_1 = require("@shared/enums/catalogStatus");
const redisCache_1 = require("@core/utils/redisCache");
// ── Generic CRUD Helpers ───────────────────────────────────────────────────
// Category operations delegated to shared.ts or CatalogOrchestrator.
/**
 * Get all categories (public paginated)
 */
const getCategories = async (req, res) => {
    const queryParams = { ...req.query };
    const rawStatus = Array.isArray(req.query.status) ? req.query.status[0] : req.query.status;
    if (rawStatus === catalogStatus_1.CATALOG_STATUS.ACTIVE || rawStatus === catalogStatus_1.CATALOG_STATUS.INACTIVE) {
        queryParams.isActive = rawStatus === catalogStatus_1.CATALOG_STATUS.ACTIVE;
        delete queryParams.status;
    }
    return (0, contentHandler_1.handlePaginatedContent)(req, res, CatalogCategoryService_1.CategoryModel, {
        searchFields: ['name', 'slug'],
        defaultSort: { name: 1 },
        publicQuery: { ...shared_1.ACTIVE_CATEGORY_QUERY },
        queryParams
    });
};
exports.getCategories = getCategories;
/**
 * Get counts of all catalog entities
 */
const getCategoryCounts = async (req, res) => {
    try {
        const CACHE_KEY = 'catalog:counts:overview';
        const cached = await (0, redisCache_1.getCache)(CACHE_KEY);
        if (cached) {
            (0, respond_1.sendSuccessResponse)(res, cached);
            return;
        }
        const counts = await (0, CatalogCategoryService_1.getCatalogEntityCounts)();
        // Cache for 1 hour — catalog counts change infrequently
        await (0, redisCache_1.setCache)(CACHE_KEY, counts, redisCache_1.CACHE_TTLS.CATEGORIES);
        (0, respond_1.sendSuccessResponse)(res, counts);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getCategoryCounts = getCategoryCounts;
/**
 * Get single category by ID
 */
const getCategoryById = async (req, res) => {
    try {
        // Admin route always uses validateObjectId middleware — ObjectId lookup only.
        const category = await (0, CatalogCategoryService_1.findCategoryById)(req.params.id);
        if (!category) {
            return (0, shared_1.sendCatalogError)(req, res, 'Category not found', 404);
        }
        (0, respond_1.sendSuccessResponse)(res, category);
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getCategoryById = getCategoryById;
/**
 * Get category schema with merged filters (hardcoded + database)
 */
const getCategorySchema = async (req, res) => {
    try {
        const id = req.params.id;
        const category = await (0, CatalogCategoryService_1.findCategoryById)(id);
        if (!category) {
            return (0, shared_1.sendCatalogError)(req, res, 'Category not found', 404);
        }
        const mergedFilters = category.filters || [];
        (0, respond_1.sendSuccessResponse)(res, {
            categoryId: category.id,
            categoryName: category.name,
            filters: mergedFilters
        });
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.getCategorySchema = getCategorySchema;
/**
 * Update category schema (filters)
 */
const updateCategorySchema = async (req, res) => {
    try {
        if (!(0, shared_1.hasAdminAccess)(req)) {
            return (0, shared_1.sendCatalogError)(req, res, 'Admin access required', 403);
        }
        const id = req.params.id;
        const parsed = catalog_validator_1.categorySchemaUpdateBodySchema.safeParse(req.body);
        if (!parsed.success) {
            (0, shared_1.sendValidationError)(req, res, parsed.error);
            return;
        }
        const { filters } = parsed.data;
        const category = await (0, CatalogCategoryService_1.updateCategorySchemaById)(id, filters);
        if (!category) {
            return (0, shared_1.sendCatalogError)(req, res, 'Category not found', 404);
        }
        await CatalogOrchestrator_1.default.invalidateCatalogCache();
        (0, categoryCanonical_1.clearCategoryCanonicalCache)();
        await (0, adminLogger_1.logAdminAction)(req, 'UPDATE_CATEGORY_SCHEMA', 'Category', category._id, { filters });
        (0, respond_1.sendSuccessResponse)(res, category, 'Category schema updated successfully');
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.updateCategorySchema = updateCategorySchema;
/**
 * Create new category
 */
const createCategory = async (req, res) => {
    try {
        if (!(0, shared_1.hasAdminAccess)(req))
            return (0, shared_1.sendCatalogError)(req, res, 'Admin access required', 403);
        const parsed = catalog_validator_1.categoryCreateSchema.safeParse(req.body);
        if (!parsed.success)
            return (0, shared_1.sendValidationError)(req, res, parsed.error);
        const payload = { ...parsed.data };
        payload.slug = (0, slugify_1.default)(payload.slug || payload.name, { lower: true, strict: true });
        if (!payload.slug)
            return (0, shared_1.sendCatalogError)(req, res, 'Invalid category slug', 400);
        if (payload.parentId) {
            if (!(await (0, CatalogCategoryService_1.categoryParentExists)(payload.parentId))) {
                return (0, shared_1.sendCatalogError)(req, res, 'Invalid parent category', 400);
            }
        }
        const category = await CatalogOrchestrator_1.default.createCategory({
            ...payload,
            status: payload.isActive === false ? catalogStatus_1.CATALOG_STATUS.INACTIVE : catalogStatus_1.CATALOG_STATUS.ACTIVE
        });
        (0, categoryCanonical_1.clearCategoryCanonicalCache)();
        (0, respond_1.sendSuccessResponse)(res, category, 'Category created successfully');
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.createCategory = createCategory;
/**
 * Update existing category
 */
const updateCategory = async (req, res) => {
    try {
        if (!(0, shared_1.hasAdminAccess)(req))
            return (0, shared_1.sendCatalogError)(req, res, 'Admin access required', 403);
        const categoryId = req.params.id;
        // Strip immutable/internal fields that admin frontends might send
        const PROTECTED_FIELDS = ['id', '_id', '__v', 'isDeleted', 'deletedAt', 'updatedAt', 'createdAt'];
        const mutableBody = req.body;
        for (const field of PROTECTED_FIELDS) {
            delete mutableBody[field];
        }
        const oldCategory = await (0, CatalogCategoryService_1.findCategoryById)(categoryId);
        if (!oldCategory)
            return (0, shared_1.sendCatalogError)(req, res, 'Category not found', 404);
        const parsed = catalog_validator_1.categoryUpdateSchema.safeParse(req.body);
        if (!parsed.success)
            return (0, shared_1.sendValidationError)(req, res, parsed.error);
        const payload = { ...parsed.data };
        if (payload.name || payload.slug) {
            payload.slug = (0, slugify_1.default)(payload.slug || payload.name, { lower: true, strict: true });
        }
        if (payload.slug !== undefined && payload.slug.length === 0) {
            return (0, shared_1.sendCatalogError)(req, res, 'Invalid category slug', 400);
        }
        if (payload.parentId) {
            if (payload.parentId === categoryId)
                return (0, shared_1.sendCatalogError)(req, res, 'Category cannot be its own parent', 400);
            if (!(await (0, CatalogCategoryService_1.categoryParentExists)(payload.parentId)))
                return (0, shared_1.sendCatalogError)(req, res, 'Invalid parent category', 400);
        }
        const payloadWithStatus = payload.isActive !== undefined
            ? { ...payload, status: payload.isActive ? catalogStatus_1.CATALOG_STATUS.ACTIVE : catalogStatus_1.CATALOG_STATUS.INACTIVE }
            : payload;
        const updatedCategory = await CatalogOrchestrator_1.default.updateCategory(categoryId, payloadWithStatus);
        if (!updatedCategory)
            return (0, shared_1.sendCatalogError)(req, res, 'Category not found', 404);
        (0, categoryCanonical_1.clearCategoryCanonicalCache)();
        void (0, adminLogger_1.logAdminAction)(req, 'CATEGORY_RENAME', 'Category', updatedCategory._id, {
            before: { name: oldCategory.name, slug: oldCategory.slug },
            after: { name: updatedCategory.name, slug: updatedCategory.slug }
        });
        (0, respond_1.sendSuccessResponse)(res, updatedCategory, 'Category updated successfully');
    }
    catch (error) {
        (0, shared_1.sendCatalogError)(req, res, error);
    }
};
exports.updateCategory = updateCategory;
/**
 * Toggle category active status
 */
const toggleCategoryStatus = async (req, res) => {
    return (0, shared_1.handleCatalogToggleStatus)(req, res, CatalogCategoryService_1.CategoryModel, {
        auditAction: 'TOGGLE_CATEGORY_STATUS',
        postOp: () => {
            (0, categoryCanonical_1.clearCategoryCanonicalCache)();
            void CatalogOrchestrator_1.default.invalidateCatalogCache();
        }
    });
};
exports.toggleCategoryStatus = toggleCategoryStatus;
/**
 * Delete category (soft delete with dependency check)
 */
const deleteCategory = async (req, res) => {
    const session = await (0, db_1.getAdminConnection)().startSession();
    session.startTransaction();
    try {
        if (!(0, shared_1.hasAdminAccess)(req)) {
            throw new AppError_1.AppError('Admin access required', 403, 'FORBIDDEN');
        }
        const categoryId = req.params.id;
        const category = await (0, CatalogCategoryService_1.findCategoryByIdWithSession)(categoryId, session);
        if (!category) {
            throw new AppError_1.AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
        }
        // Soft-delete the category itself, then cascade to children.
        // Single write here; cascadeCategoryDelete handles brands/models/parts/sizes.
        await (0, CatalogCategoryService_1.softDeleteCategoryById)(category._id, session);
        await CatalogOrchestrator_1.default.cascadeCategoryDelete(String(category._id), session);
        await session.commitTransaction();
        (0, categoryCanonical_1.clearCategoryCanonicalCache)();
        (0, respond_1.sendSuccessResponse)(res, null, 'Category and all dependent brands/models soft-deleted successfully');
    }
    catch (e) {
        await session.abortTransaction();
        const err = e instanceof AppError_1.AppError ? e : null;
        if (err?.code === 'FORBIDDEN') {
            return (0, shared_1.sendCatalogError)(req, res, err.message, 403);
        }
        else if (err?.code === 'CATEGORY_NOT_FOUND') {
            return (0, shared_1.sendCatalogError)(req, res, err.message, 404);
        }
        return (0, shared_1.sendCatalogError)(req, res, e);
    }
    finally {
        await session.endSession();
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=catalogCategoryController.js.map