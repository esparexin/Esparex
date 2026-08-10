import { Schema, Document, Query, Aggregate, PipelineStage } from 'mongoose';

export interface ISoftDeleteDocument extends Document {
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

const softDeletePlugin = (schema: Schema) => {
    // Add fields to schema
    schema.add({
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date }
    });

    // Strategy: Filter out isDeleted: true by default in common query methods
    const applyQueryFilter = function (this: Query<unknown, unknown>) {
        const options = (this.getOptions ? this.getOptions() : {}) as { withDeleted?: boolean };
        if (options?.withDeleted) {
            return;
        }

        // Apply filter
        this.where({ isDeleted: { $ne: true } });
    };

    schema.pre<Query<unknown, unknown>>('find', applyQueryFilter);
    schema.pre<Query<unknown, unknown>>('findOne', applyQueryFilter);
    schema.pre<Query<unknown, unknown>>('findOneAndUpdate', applyQueryFilter);
    schema.pre<Query<unknown, unknown>>('updateOne', applyQueryFilter);
    schema.pre<Query<unknown, unknown>>('updateMany', applyQueryFilter);
    schema.pre<Query<unknown, unknown>>('countDocuments', applyQueryFilter);

    // Special handling for aggregate to filter at the beginning of the pipeline
    schema.pre<Aggregate<unknown>>('aggregate', function () {
        const options = (this.options || {}) as { withDeleted?: boolean };
        if (options.withDeleted) {
            return;
        }

        const pipeline = this.pipeline();
        const softDeleteFilter = { isDeleted: { $ne: true } };
        const firstStage = pipeline[0] as { $geoNear?: { query?: Record<string, unknown> }; $search?: unknown; $vectorSearch?: unknown; $match?: { $text?: unknown } } | undefined;

        // Preserve operators that must remain first in pipeline.
        if (firstStage?.$geoNear) {
            firstStage.$geoNear.query = firstStage.$geoNear.query
                ? { $and: [firstStage.$geoNear.query, softDeleteFilter] }
                : softDeleteFilter;
        } else if (firstStage?.$search || firstStage?.$vectorSearch || firstStage?.$match?.$text) {
            // Atlas search/vector search or native text search must be first stage.
            pipeline.splice(1, 0, { $match: softDeleteFilter } as PipelineStage);
        } else {
            pipeline.unshift({ $match: softDeleteFilter } as PipelineStage);
        }
    });

    // Soft Delete Instance Method
    // Also sets isActive=false if the field exists, preventing the
    // isActive=true + isDeleted=true data integrity corruption.
    schema.methods.softDelete = function (this: { isDeleted: boolean; deletedAt: Date | undefined; isActive?: boolean; save(): Promise<unknown> }) {
        this.isDeleted = true;
        this.deletedAt = new Date();
        if ('isActive' in this) this.isActive = false;
        return this.save();
    };

    // Restore Instance Method
    schema.methods.restore = function (this: { isDeleted: boolean; deletedAt: Date | undefined; save(): Promise<unknown> }) {
        this.isDeleted = false;
        this.deletedAt = undefined;
        return this.save();
    };
};

export default softDeletePlugin;
