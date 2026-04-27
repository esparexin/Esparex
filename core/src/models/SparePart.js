"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SparePartModel = void 0;
const mongoose_1 = require("mongoose");
const listingType_1 = require("@core/constants/enums/listingType");
const SparePartSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    listingType: {
        type: [String],
        enum: listingType_1.LISTING_TYPE_VALUES,
        default: [listingType_1.LISTING_TYPE.SPARE_PART],
    },
    categoryIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
        validate: {
            validator: (val) => val && val.length > 0,
            message: 'Spare part must be mapped to at least one category'
        }
    },
    brandId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Brand' },
    modelId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Model' },
    sortOrder: { type: Number, default: 0 },
    usageCount: { type: Number, default: 0 },
    filters: { type: Array, default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Admin' }
}, {
    timestamps: true,
    toObject: { virtuals: true, versionKey: false }
});
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
SparePartSchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
SparePartSchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
// INDEXES
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
SparePartSchema.index({ slug: 1 }, {
    name: 'idx_sparepart_slug_unique',
    unique: true,
    partialFilterExpression: { isDeleted: false }
});
SparePartSchema.index({ categoryIds: 1 }, { name: 'idx_sparepart_categoryIds' });
SparePartSchema.index({ isActive: 1 }, { name: 'idx_sparepart_isActive' });
SparePartSchema.index({ categoryIds: 1, isActive: 1 }, { name: 'idx_sparepart_categoryIds_active' });
SparePartSchema.index({ brandId: 1, modelId: 1 }, { name: 'idx_sparepart_brand_model' });
SparePartSchema.index({ sortOrder: 1 }, { name: 'idx_sparepart_sortOrder' });
SparePartSchema.index({ createdBy: 1 }, { name: 'idx_sparepart_createdBy' });
SparePartSchema.index({ isDeleted: 1 }, { name: 'idx_sparepart_isDeleted' });
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(SparePartSchema);
exports.SparePartModel = (0, db_1.getUserConnection)().models.SparePart ||
    (0, db_1.getUserConnection)().model('SparePart', SparePartSchema);
exports.default = exports.SparePartModel;
//# sourceMappingURL=SparePart.js.map