import { Schema, Document, Model, Types } from 'mongoose';
import softDeletePlugin from '../utils/softDeletePlugin';
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
import { getUserConnection } from '../config/db';

export interface ITaxonomyAlias extends Document {
    alias: string;
    canonicalAlias: string;
    entityType: 'category' | 'brand' | 'model' | 'variant' | 'service_type' | 'screen_size' | 'spare_part';
    entityId: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const TaxonomyAliasSchema = new Schema<ITaxonomyAlias>(
    {
        alias: { type: String, required: true, trim: true },
        canonicalAlias: { type: String, required: true, trim: true, lowercase: true },
        entityType: {
            type: String,
            enum: ['category', 'brand', 'model', 'variant', 'service_type', 'screen_size', 'spare_part'],
            required: true,
        },
        entityId: { type: Schema.Types.ObjectId, required: true },
    },
    { timestamps: true }
);

TaxonomyAliasSchema.plugin(softDeletePlugin);
TaxonomyAliasSchema.plugin(installSafeSoftDeleteQuery);

TaxonomyAliasSchema.pre('validate', function () {
    const doc = this as unknown as { alias?: string; canonicalAlias?: string };
    if (!doc.canonicalAlias && typeof doc.alias === 'string') {
        doc.canonicalAlias = doc.alias.trim().toLowerCase();
    }
});

TaxonomyAliasSchema.index(
    { canonicalAlias: 1, entityType: 1, entityId: 1 },
    {
        name: 'idx_taxonomy_alias_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);
TaxonomyAliasSchema.index({ entityType: 1, entityId: 1 }, { name: 'idx_taxonomy_alias_entity' });

const TaxonomyAliasModel: Model<ITaxonomyAlias> =
    (getUserConnection().models.TaxonomyAlias as Model<ITaxonomyAlias> | undefined) ||
    getUserConnection().model<ITaxonomyAlias>('TaxonomyAlias', TaxonomyAliasSchema);

export default TaxonomyAliasModel;
