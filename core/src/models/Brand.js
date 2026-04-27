"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Brand = void 0;
const mongoose_1 = require("mongoose");
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const BrandSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    categoryIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: Object.values(catalogStatus_1.CATALOG_STATUS), default: catalogStatus_1.CATALOG_STATUS.ACTIVE },
    suggestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    needsReview: { type: Boolean, default: false },
    // isDeleted and deletedAt are injected by softDeletePlugin below
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret;
            json.id = String(json._id);
            delete json._id;
            return json;
        }
    },
    toObject: { virtuals: true, versionKey: false }
});
// Apply soft-delete plugin (adds isDeleted, deletedAt fields + auto-filter pre-hooks + softDelete()/restore() methods)
BrandSchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
BrandSchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
// 🚀 CORE INDEXES (Aligned with Atlas ground truth in migrations)
BrandSchema.index({ categoryIds: 1 }, { name: 'idx_brand_categoryIds_idx' });
BrandSchema.index({ status: 1 }, { name: 'idx_brand_status_idx' });
BrandSchema.index({ isDeleted: 1 }, { name: 'idx_brand_isDeleted_idx' });
BrandSchema.index({ categoryIds: 1, name: 1 }, {
    unique: true,
    name: 'idx_brand_categoryIds_name_unique',
    partialFilterExpression: {
        isDeleted: false,
        // 'live' is CATALOG_STATUS.ACTIVE; 'active' kept for legacy records
        status: { $in: ['live', 'active', 'pending'] }
    },
    collation: { locale: 'en', strength: 2 }
});
BrandSchema.index({ categoryIds: 1, slug: 1 }, {
    unique: true,
    name: 'idx_brand_categoryIds_slug_unique',
    partialFilterExpression: {
        isDeleted: false,
        // 'live' is CATALOG_STATUS.ACTIVE; 'active' kept for legacy records
        status: { $in: ['live', 'active', 'pending'] }
    }
});
/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - brand_name_categoryId_text_idx: { name: 1, categoryId: 1 } (Collation: {locale: 'en', strength: 2})
 */
const db_1 = require("@core/config/db");
BrandSchema.pre('deleteOne', { document: true, query: false }, async function () {
    const Model = (0, db_1.getUserConnection)().model('Model');
    const count = await Model.countDocuments({
        brandId: this._id
    });
    if (count > 0) {
        throw new Error('Cannot delete brand with dependent models');
    }
});
exports.Brand = (0, db_1.getUserConnection)().models.Brand || (0, db_1.getUserConnection)().model('Brand', BrandSchema);
exports.default = exports.Brand;
//# sourceMappingURL=Brand.js.map