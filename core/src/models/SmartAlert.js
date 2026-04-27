"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAlert = void 0;
const mongoose_1 = require("mongoose");
const db_1 = require("@core/config/db");
const SmartAlertSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', required: true },
    name: { type: String },
    criteria: {
        keywords: { type: String },
        categoryId: { type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Category' },
        brandId: { type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Brand' },
        modelId: { type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Model' },
        minPrice: { type: Number },
        maxPrice: { type: Number },
        condition: { type: String },
    },
    coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number] },
    },
    radiusKm: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    notificationChannels: [{ type: String }],
    lastTriggeredAt: { type: Date },
    expiresAt: { type: Date },
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
SmartAlertSchema.index({ userId: 1 }, { name: 'idx_smartalert_userId_idx' });
SmartAlertSchema.index({ coordinates: '2dsphere' }, { name: 'idx_smartalert_geo_2dsphere' });
SmartAlertSchema.index({ isActive: 1, expiresAt: 1 }, { name: 'idx_smartalert_user_active_idx' });
exports.SmartAlert = (0, db_1.getUserConnection)().models.SmartAlert || (0, db_1.getUserConnection)().model('SmartAlert', SmartAlertSchema);
exports.default = exports.SmartAlert;
//# sourceMappingURL=SmartAlert.js.map