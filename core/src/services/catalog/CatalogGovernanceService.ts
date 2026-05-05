/**
 * CatalogGovernanceService
 * DB operations for catalog governance: category health metrics.
 */

import mongoose from 'mongoose';
import Category from '../../models/Category';
import Ad from '../../models/Ad';
import Brand from '../../models/Brand';
import CatalogModel from '../../models/Model';

export async function findCategoryByIdLean(id: string) {
    return Category.findById(id).lean<{ name: string; isActive: boolean } | null>();
}

export async function getCategoryHealthMetrics(categoryId: string) {
    const objectId = new mongoose.Types.ObjectId(categoryId);
    const [adStats, brandCount, modelCount] = await Promise.all([
        Ad.aggregate([
            { $match: { categoryId: objectId, isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgQuality: { $avg: '$listingQualityScore' },
                    liveCount: { $sum: { $cond: [{ $eq: ['$status', 'live'] }, 1, 0] } }
                }
            }
        ]),
        Brand.countDocuments({ categoryId, isDeleted: { $ne: true } }),
        CatalogModel.aggregate([
            {
                $lookup: {
                    from: 'brands',
                    localField: 'brandId',
                    foreignField: '_id',
                    as: 'brand'
                }
            },
            { $unwind: '$brand' },
            { $match: { 'brand.categoryId': objectId, isDeleted: { $ne: true } } },
            { $count: 'total' }
        ])
    ]);
    return { adStats, brandCount, modelCount };
}
