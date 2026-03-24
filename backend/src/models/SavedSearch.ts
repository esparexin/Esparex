import { Schema, Model, Types, Document } from 'mongoose';
import { getUserConnection } from '../config/db';

export interface ISavedSearch extends Document {
    userId: Types.ObjectId;
    query?: string;
    categoryId?: Types.ObjectId;
    locationId?: Types.ObjectId;
    priceMin?: number;
    priceMax?: number;
    createdAt: Date;
    updatedAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        query: { type: String, trim: true, maxlength: 120 },
        categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
        locationId: { type: Schema.Types.ObjectId, ref: 'Location' },
        priceMin: { type: Number, min: 0 },
        priceMax: { type: Number, min: 0 },
    },
    { timestamps: true }
);

/* -------------------------------------------------------------------------- */
/* Indexes (Explicitly Named)                                                 */
/* -------------------------------------------------------------------------- */

SavedSearchSchema.index({ userId: 1 }, { name: 'idx_savedsearch_userId_idx' });
SavedSearchSchema.index({ categoryId: 1 }, { name: 'idx_savedsearch_categoryId_idx' });
SavedSearchSchema.index({ locationId: 1 }, { name: 'idx_savedsearch_locationId_idx' });
SavedSearchSchema.index({ userId: 1, createdAt: -1 }, { name: 'idx_savedsearch_user_freshness_idx' });

SavedSearchSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (_doc, ret) {
        const json = ret as unknown as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
        json.id = json._id?.toString();
        delete json._id;
        return json;
    }
});

const connection = getUserConnection();
const SavedSearch: Model<ISavedSearch> =
    (connection.models.SavedSearch as Model<ISavedSearch>) ||
    connection.model<ISavedSearch>('SavedSearch', SavedSearchSchema);

export default SavedSearch;
