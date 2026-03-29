/**
 * Catalog Governance Controller
 * Handles hierarchy reporting, repairs, and category health metrics
 */

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getHierarchyTree as buildHierarchyTree, scanHierarchyIntegrity, repairHierarchy } from '../../services/catalog/CatalogHierarchyService';
import { sendSuccessResponse } from '../admin/adminBaseController';
import { sendCatalogError, hasAdminAccess } from './shared';
import Category from '../../models/Category';
import Ad from '../../models/Ad';
import Brand from '../../models/Brand';
import Model from '../../models/Model';
import { sendErrorResponse as sendContractErrorResponse } from '../../utils/errorResponse';
import { logAdminAction } from '../../utils/adminLogger';
import { IAuthUser } from '../../types/auth';

/**
 * GET /governance/hierarchy-report
 * Returns a scan of the full catalog hierarchy and integrity issues.
 */
export const getHierarchyReport = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }
        const report = await scanHierarchyIntegrity();
        sendSuccessResponse(res, report);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * GET /governance/hierarchy-tree
 * Returns the full category → brand → model tree without client-side pagination fan-out.
 */
export const getHierarchyTree = async (req: Request, res: Response) => {
    try {
        if (!hasAdminAccess(req)) {
            return sendContractErrorResponse(req, res, 403, 'Admin access required');
        }

        const tree = await buildHierarchyTree();
        sendSuccessResponse(res, tree);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * POST /governance/repair-hierarchy
 * Triggers lightweight repairs for the catalog hierarchy.
 * Restricted to super admins.
 */
export const runHierarchyRepair = async (req: Request, res: Response) => {
    try {
        const authUser = req.user as IAuthUser;
        const isSuperAdmin = authUser.role === 'super_admin';
        
        if (!isSuperAdmin) {
            return sendContractErrorResponse(req, res, 403, 'Super admin access required for catalog repair');
        }

        const summary = await repairHierarchy();
        
        await logAdminAction(req, 'CATALOG_HIERARCHY_REPAIR', 'System', undefined, {
            summary
        });

        sendSuccessResponse(res, summary, 'Catalog hierarchy repair completed');
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};

/**
 * GET /governance/categories/:id/health
 * Returns metrics and health indicators for a specific category.
 */
export const getCategoryHealth = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
            return sendContractErrorResponse(req, res, 400, 'Invalid Category ID');
        }

        const category = await Category.findById(id).lean();
        if (!category) {
            return sendContractErrorResponse(req, res, 404, 'Category not found');
        }

        const categoryId = new mongoose.Types.ObjectId(id);

        // Metrics aggregation
        const [adStats, brandCount, modelCount] = await Promise.all([
            Ad.aggregate([
                { $match: { categoryId, isDeleted: { $ne: true } } },
                { 
                    $group: { 
                        _id: null, 
                        count: { $sum: 1 }, 
                        avgQuality: { $avg: "$listingQualityScore" },
                        liveCount: { $sum: { $cond: [{ $eq: ["$status", "live"] }, 1, 0] } }
                    } 
                }
            ]),
            Brand.countDocuments({ categoryId: id, isDeleted: { $ne: true } }),
            Model.aggregate([
                {
                    $lookup: {
                        from: 'brands',
                        localField: 'brandId',
                        foreignField: '_id',
                        as: 'brand'
                    }
                },
                { $unwind: '$brand' },
                { $match: { 'brand.categoryId': categoryId, isDeleted: { $ne: true } } },
                { $count: 'total' }
            ])
        ]);

        const stats = adStats[0] || { count: 0, avgQuality: 0, liveCount: 0 };
        const totalModels = modelCount[0]?.total || 0;

        const health = {
            categoryId: id,
            categoryName: category.name,
            metrics: {
                totalAds: stats.count,
                liveAds: stats.liveCount,
                avgQualityScore: stats.avgQuality ? parseFloat(stats.avgQuality.toFixed(2)) : 0,
                totalBrands: brandCount,
                totalModels
            },
            status: category.isActive ? 'active' : 'inactive'
        };

        sendSuccessResponse(res, health);
    } catch (error) {
        sendCatalogError(req, res, error);
    }
};
