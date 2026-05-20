import mongoose, { Schema, Document, Model } from 'mongoose';
import { CATALOG_STATUS, CATALOG_STATUS_VALUES, type CatalogStatusValue } from '../constants/enums/catalogStatus';
import {
    CATALOG_APPROVAL_STATUS,
    CATALOG_APPROVAL_STATUS_VALUES,
    type CatalogApprovalStatusValue,
} from '../constants/enums/catalogApprovalStatus';
import softDeletePlugin from '../utils/softDeletePlugin';
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
import { getUserConnection } from '../config/db';

export interface IVariant extends Document {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
    modelId: mongoose.Types.ObjectId;
    categoryIds: mongoose.Types.ObjectId[];
    isActive: boolean;
    approvalStatus: CatalogApprovalStatusValue;
    status: CatalogStatusValue;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const VariantSchema = new Schema<IVariant>(
    {
        name: { type: String, required: true, trim: true },
        displayName: { type: String, required: true, trim: true },
        canonicalName: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true },
        aliases: { type: [String], default: [] },
        synonyms: { type: [String], default: [] },
        modelId: { type: Schema.Types.ObjectId, ref: 'Model', required: true },
        categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        isActive: { type: Boolean, default: true },
        approvalStatus: {
            type: String,
            enum: CATALOG_APPROVAL_STATUS_VALUES,
            default: CATALOG_APPROVAL_STATUS.APPROVED,
        },
        status: {
            type: String,
            enum: CATALOG_STATUS_VALUES,
            default: CATALOG_STATUS.ACTIVE,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
        },
        toObject: { virtuals: true, versionKey: false },
    }
);

VariantSchema.plugin(softDeletePlugin);
VariantSchema.plugin(installSafeSoftDeleteQuery);

VariantSchema.pre('validate', function () {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose Document lacks index signature; cast is safe within pre-validate scope
    const mutableDoc = this as any;
    
    if (!mutableDoc.canonicalName && mutableDoc.displayName) {
        mutableDoc.canonicalName = mutableDoc.displayName;
    }
    
    if (!mutableDoc.approvalStatus) {
        mutableDoc.approvalStatus = CATALOG_APPROVAL_STATUS.APPROVED;
    }

    mutableDoc.name = mutableDoc.displayName;
});

VariantSchema.index({ modelId: 1 }, { name: 'idx_variant_modelId' });
VariantSchema.index({ categoryIds: 1 }, { name: 'idx_variant_categoryIds' });
VariantSchema.index({ isActive: 1 }, { name: 'idx_variant_isActive' });
VariantSchema.index({ approvalStatus: 1, isActive: 1 }, { name: 'idx_variant_approval_active' });
VariantSchema.index({ isDeleted: 1 }, { name: 'idx_variant_isDeleted' });
VariantSchema.index(
    { modelId: 1, slug: 1 },
    {
        name: 'idx_variant_model_slug_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);

const VariantModel: Model<IVariant> =
    (getUserConnection().models.Variant as Model<IVariant> | undefined) ||
    getUserConnection().model<IVariant>('Variant', VariantSchema);

export default VariantModel;
