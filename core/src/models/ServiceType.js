"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ServiceTypeSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    categoryIds: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Category' }],
        validate: {
            validator: (val) => val && val.length > 0,
            message: 'Service type must be mapped to at least one category'
        }
    },
    filters: { type: Array, default: [] },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */
ServiceTypeSchema.index({ categoryIds: 1 }, { name: 'idx_servicetype_categoryIds' });
ServiceTypeSchema.index({ isActive: 1 }, { name: 'idx_servicetype_isActive' });
ServiceTypeSchema.index({ isDeleted: 1 }, { name: 'idx_servicetype_isDeleted' });
ServiceTypeSchema.index({ name: 1, categoryIds: 1 }, {
    name: 'idx_servicetype_name_category_unique',
    unique: true,
    partialFilterExpression: { isDeleted: false }
});
const softDeletePlugin_1 = __importDefault(require("@core/utils/softDeletePlugin"));
ServiceTypeSchema.plugin(softDeletePlugin_1.default);
// Apply safe query scope plugin (adds .active() and .includeDeleted() chain methods)
const safeSoftDeleteQuery_1 = require("@core/utils/safeSoftDeleteQuery");
ServiceTypeSchema.plugin(safeSoftDeleteQuery_1.installSafeSoftDeleteQuery);
const db_1 = require("@core/config/db");
const schemaOptions_1 = require("@core/utils/schemaOptions");
const ServiceType = (0, db_1.getUserConnection)().models.ServiceType || (0, db_1.getUserConnection)().model('ServiceType', ServiceTypeSchema);
(0, schemaOptions_1.applyToJSONTransform)(ServiceTypeSchema);
exports.default = ServiceType;
//# sourceMappingURL=ServiceType.js.map