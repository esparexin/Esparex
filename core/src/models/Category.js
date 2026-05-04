"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const catalogStatus_1 = require("@core/constants/enums/catalogStatus");
const CategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    slug: { type: String, required: true },
    type: { type: String, enum: ['ad', 'spare_part', 'service', 'other'], default: 'ad', required: false },
    icon: { type: String },
    description: { type: String },
    parentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: catalogStatus_1.CATALOG_STATUS_VALUES, default: catalogStatus_1.CATALOG_STATUS.ACTIVE },
    filters: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    // Metadata-driven fields
    listingType: [{ type: String, enum: ['ad', 'service', 'spare_part'] }],
    serviceSelectionMode: { type: String, enum: ['single', 'multi'], default: 'multi' },
    hasScreenSizes: { type: Boolean, default: false }
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
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
CategorySchema.index({ slug: 1 }, {
    name: 'idx_category_slug_unique_idx',
    unique: true,
    background: true,
    partialFilterExpression: { isDeleted: false }
});
CategorySchema.index({ parentId: 1 }, { name: 'idx_category_parent' });
CategorySchema.index({ type: 1, isActive: 1 }, { name: 'idx_category_type_active' });
CategorySchema.index({ status: 1 }, { name: 'idx_category_status' });
CategorySchema.index({ isDeleted: 1, isActive: 1 }, { name: 'idx_category_isDeleted_isActive' });
CategorySchema.index({ isDeleted: 1 }, { name: 'idx_category_isDeleted' });
CategorySchema.index({ listingType: 1 }, { name: 'idx_category_listingType' });
CategorySchema.index({ name: 1 }, {
    name: 'idx_category_name_unique_ci',
    unique: true,
    collation: { locale: 'en', strength: 2 },
    partialFilterExpression: { isDeleted: false }
});
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
CategorySchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
CategorySchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
// ON-THE-FLY NORMALIZATION (Safe Migration)
// Ensures legacy uppercase types and 'post' prefixes are mapped to the new standard at runtime.
CategorySchema.post('init', function (doc) {
    if (doc.type && ['AD', 'SERVICE', 'SPARE_PART'].includes(doc.type)) {
        doc.type = doc.type.toLowerCase();
    }
});
const db_1 = require("@core/config/db");
const Category = (0, db_1.getUserConnection)().models.Category || (0, db_1.getUserConnection)().model('Category', CategorySchema);
exports.default = Category;
//# sourceMappingURL=Category.js.map