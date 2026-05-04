"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const ModelSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    brandId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Brand', required: true },
    categoryIds: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: catalogStatus_1.CATALOG_STATUS_VALUES, default: catalogStatus_1.CATALOG_STATUS.ACTIVE },
    suggestedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, default: null },
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
// INDEXES
ModelSchema.index({ categoryIds: 1, brandId: 1, name: 1 }, {
    name: 'idx_model_categories_brand_name',
    unique: true,
    collation: { locale: 'en', strength: 2 },
    partialFilterExpression: { isDeleted: false, status: { $in: [catalogStatus_1.CATALOG_STATUS.ACTIVE, catalogStatus_1.CATALOG_STATUS.PENDING] } }
});
// Many-to-Many Indexes
ModelSchema.index({ categoryIds: 1 }, { name: 'idx_model_categoryIds' });
ModelSchema.index({ isActive: 1 }, { name: 'idx_model_isActive' });
ModelSchema.index({ isDeleted: 1 }, { name: 'idx_model_isDeleted' });
ModelSchema.index({ brandId: 1 }, { name: 'idx_model_brandId' });
/**
 * ATLAS-ONLY INDEXES (Drift)
 * The following indexes exist in Atlas but are not strictly enforced by Mongoose:
 * - model_brand_category_idx: { brandId: 1, categoryId: 1 }
 */
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
ModelSchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
ModelSchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
const db_1 = require("@core/config/db");
const ProductModel = (0, db_1.getUserConnection)().models.Model || (0, db_1.getUserConnection)().model('Model', ModelSchema);
exports.default = ProductModel;
//# sourceMappingURL=Model.js.map