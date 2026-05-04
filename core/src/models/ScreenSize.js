"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ScreenSizeSchema = new mongoose_1.Schema({
    size: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    brandId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Brand' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
// Hard-unique index to prevent duplicate configurations
ScreenSizeSchema.index({ size: 1, categoryId: 1, brandId: 1 }, {
    name: 'idx_screensize_size_category_brand',
    unique: true,
    partialFilterExpression: { isDeleted: false }
});
ScreenSizeSchema.index({ categoryId: 1 }, { name: 'idx_screensize_categoryId' });
ScreenSizeSchema.index({ brandId: 1 }, { name: 'idx_screensize_brandId' });
ScreenSizeSchema.index({ isActive: 1 }, { name: 'idx_screensize_isActive' });
ScreenSizeSchema.index({ isDeleted: 1 }, { name: 'idx_screensize_isDeleted' });
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
ScreenSizeSchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
ScreenSizeSchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
(0, schemaOptions_1.applyToJSONTransform)(ScreenSizeSchema);
const userConnection = (0, db_1.getUserConnection)();
const ScreenSize = userConnection.models.ScreenSize || userConnection.model('ScreenSize', ScreenSizeSchema);
exports.default = ScreenSize;
//# sourceMappingURL=ScreenSize.js.map