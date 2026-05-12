import { Schema, Document, Model, Types } from 'mongoose';
import softDeletePlugin from '../utils/softDeletePlugin';
import { installSafeSoftDeleteQuery } from '../utils/safeSoftDeleteQuery';
import { getUserConnection } from '../config/db';

export interface ITaxonomySynonym extends Document {
    synonym: string;
    canonicalSynonym: string;
    entityType: 'category' | 'brand' | 'model' | 'variant' | 'service_type' | 'screen_size' | 'spare_part';
    entityId: Types.ObjectId;
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const TaxonomySynonymSchema = new Schema<ITaxonomySynonym>(
    {
        synonym: { type: String, required: true, trim: true },
        canonicalSynonym: { type: String, required: true, trim: true, lowercase: true },
        entityType: {
            type: String,
            enum: ['category', 'brand', 'model', 'variant', 'service_type', 'screen_size', 'spare_part'],
            required: true,
        },
        entityId: { type: Schema.Types.ObjectId, required: true },
    },
    { timestamps: true }
);

TaxonomySynonymSchema.plugin(softDeletePlugin);
TaxonomySynonymSchema.plugin(installSafeSoftDeleteQuery);

TaxonomySynonymSchema.pre('validate', function () {
    const doc = this as unknown as { synonym?: string; canonicalSynonym?: string };
    if (!doc.canonicalSynonym && typeof doc.synonym === 'string') {
        doc.canonicalSynonym = doc.synonym.trim().toLowerCase();
    }
});

TaxonomySynonymSchema.index(
    { canonicalSynonym: 1, entityType: 1, entityId: 1 },
    {
        name: 'idx_taxonomy_synonym_unique',
        unique: true,
        partialFilterExpression: { isDeleted: false },
    }
);
TaxonomySynonymSchema.index({ entityType: 1, entityId: 1 }, { name: 'idx_taxonomy_synonym_entity' });

const TaxonomySynonymModel: Model<ITaxonomySynonym> =
    (getUserConnection().models.TaxonomySynonym as Model<ITaxonomySynonym> | undefined) ||
    getUserConnection().model<ITaxonomySynonym>('TaxonomySynonym', TaxonomySynonymSchema);

export default TaxonomySynonymModel;
