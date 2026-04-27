"use strict";
/**
 * CatalogGovernanceService
 * DB operations for catalog governance: category health metrics.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCategoryByIdLean = findCategoryByIdLean;
exports.getCategoryHealthMetrics = getCategoryHealthMetrics;
const mongoose_1 = __importDefault(require("mongoose"));
const Category_1 = __importDefault(require("@core/models/Category"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const Brand_1 = __importDefault(require("@core/models/Brand"));
const Model_1 = __importDefault(require("@core/models/Model"));
async function findCategoryByIdLean(id) {
    return Category_1.default.findById(id).lean();
}
async function getCategoryHealthMetrics(categoryId) {
    const objectId = new mongoose_1.default.Types.ObjectId(categoryId);
    const [adStats, brandCount, modelCount] = await Promise.all([
        Ad_1.default.aggregate([
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
        Brand_1.default.countDocuments({ categoryId, isDeleted: { $ne: true } }),
        Model_1.default.aggregate([
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
//# sourceMappingURL=CatalogGovernanceService.js.map