/**
 * CatalogReferenceService
 * DB operations for ServiceType and ScreenSize reference entities.
 * Re-exports the Mongoose model instances for generic handler calls.
 */

import ServiceTypeModelImport from '../../models/ServiceType';
import ScreenSizeModelImport from '../../models/ScreenSize';
import CategoryModel from '../../models/Category';
import BrandModel from '../../models/Brand';
import AdModel from '../../models/Ad';
import { CATALOG_STATUS } from '../../../../shared/enums/catalogStatus';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { ACTIVE_CATEGORY_QUERY } from './CatalogValidationService';
import mongoose from 'mongoose';

// Re-export model instances for generic handler calls in the controller layer
export const ServiceTypeModel = ServiceTypeModelImport;
export const ScreenSizeModel = ScreenSizeModelImport;

// ─── Category slug resolution ─────────────────────────────────────────────────

/** Resolve a category by slug — no active filter (admin view). */
export const findCategoryBySlug = async (slug: string) =>
    CategoryModel.findOne({ slug });

/** Resolve a category by slug — with active filter (public view). */
export const findActiveCategoryBySlug = async (slug: string) =>
    CategoryModel.findOne({ slug, ...ACTIVE_CATEGORY_QUERY });

// ─── Service type queries ─────────────────────────────────────────────────────

export const findServiceTypeById = async (id: string) =>
    ServiceTypeModelImport.findById(id).populate('categoryIds');

// ─── Service type dependency checks ──────────────────────────────────────────

/**
 * Check whether any live ads reference the given service type.
 * Used as the checkDependencies callback in handleCatalogDelete.
 */
export const checkServiceTypeDependencies = async (id: string) => {
    const item = await ServiceTypeModelImport.findById(id);
    if (!item) return { count: 0, details: {} };

    const inUseCount = await AdModel.countDocuments({
        status: AD_STATUS.LIVE,
        $or: [
            { serviceTypeIds: item._id },
            { serviceTypes: item.name }
        ]
    });
    return { count: inUseCount, details: { services: inUseCount } };
};

// ─── Screen size queries ──────────────────────────────────────────────────────

export const findScreenSizeById = async (id: string) =>
    ScreenSizeModelImport.findById(id).populate('categoryId');

// ─── Active brand IDs for screen sizes ───────────────────────────────────────

/**
 * Return active brand documents for the screen sizes public view.
 * Note: screen sizes use the singular `categoryId` field on brand, not `categoryIds`.
 */
export const getActiveBrandsForScreenSizes = async (activeCategoryIds: string[]) =>
    BrandModel.find({
        isActive: true,
        isDeleted: { $ne: true },
        $or: [
            { status: CATALOG_STATUS.ACTIVE },
            { status: { $exists: false } }
        ],
        categoryId: { $in: activeCategoryIds }
    }).select('_id').lean();
