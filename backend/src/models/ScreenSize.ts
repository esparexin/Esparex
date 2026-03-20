import { Schema, Document, Model } from 'mongoose';

export interface IScreenSize extends Document {
    size: string; // e.g., "32\"", "43\"", "55\""
    name: string; // Human readable
    value: number; // e.g., 24 (for sorting)
    categoryId: Document['_id']; // REQUIRED
    brandId?: Document['_id']; // OPTIONAL
    isActive: boolean;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const ScreenSizeSchema: Schema = new Schema({
    size: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: Number, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brandId: { type: Schema.Types.ObjectId, ref: 'Brand' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

// Hard-unique index to prevent duplicate configurations
ScreenSizeSchema.index(
    { size: 1, categoryId: 1, brandId: 1 },
    {
        name: 'idx_screensize_size_category_brand',
        unique: true,
        partialFilterExpression: { isDeleted: false }
    }
);

ScreenSizeSchema.index({ categoryId: 1 }, { name: 'idx_screensize_categoryId' });
ScreenSizeSchema.index({ brandId: 1 }, { name: 'idx_screensize_brandId' });
ScreenSizeSchema.index({ isActive: 1 }, { name: 'idx_screensize_isActive' });
ScreenSizeSchema.index({ isDeleted: 1 }, { name: 'idx_screensize_isDeleted' });

import softDeletePlugin from '../utils/softDeletePlugin';
ScreenSizeSchema.plugin(softDeletePlugin);

import { getAdminConnection } from '../config/db';
// toJSON Transform - Convert _id to id
ScreenSizeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const adminConnection = getAdminConnection();

const ScreenSize: Model<IScreenSize> = (
    adminConnection.models.ScreenSize as Model<IScreenSize>
) || adminConnection.model<IScreenSize>('ScreenSize', ScreenSizeSchema);

export default ScreenSize;
