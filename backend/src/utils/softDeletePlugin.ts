import { Schema, Document } from 'mongoose';

export interface ISoftDeleteDocument extends Document {
    isDeleted: boolean;
    deletedAt?: Date;
    softDelete(): Promise<this>;
    restore(): Promise<this>;
}

interface SoftDeleteQueryContext {
    getOptions: () => { withDeleted?: boolean };
    where: (filter: Record<string, unknown>) => void;
}

interface SoftDeleteAggregateContext {
    options?: { withDeleted?: boolean };
    pipeline: () => Record<string, unknown>[];
}

const softDeletePlugin = (schema: Schema) => {
    // Add fields to schema
    schema.add({
        isDeleted: { type: Boolean, default: false },
        deletedAt: { type: Date }
    });

    // Strategy: Filter out isDeleted: true by default in common query methods
    const queryMethods = [
        'find',
        'findOne',
        'findOneAndUpdate',
        'updateOne',
        'updateMany',
        'countDocuments'
    ];

    queryMethods.forEach((method) => {
        schema.pre(method as never, function (this: SoftDeleteQueryContext, next?: (err?: Error) => void) {
            // Check if we explicitly want to include deleted items
            const options = this.getOptions();
            if (options && options.withDeleted) {
                return next ? next() : Promise.resolve();
            }

            // Apply filter
            this.where({ isDeleted: { $ne: true } });

            if (next) next();
        });
    });

    // Special handling for aggregate to filter at the beginning of the pipeline
    schema.pre('aggregate' as never, function (this: SoftDeleteAggregateContext, next?: (err?: Error) => void) {
        const options = this.options || {};
        if (options.withDeleted) {
            return next ? next() : Promise.resolve();
        }

        const pipeline = this.pipeline();
        const softDeleteFilter = { isDeleted: { $ne: true } };
        const firstStage = pipeline[0];

        // Preserve operators that must remain first in pipeline.
        const geoNearStage = firstStage?.$geoNear as { query?: Record<string, unknown> } | undefined;
        if (geoNearStage) {
            geoNearStage.query = geoNearStage.query
                ? { $and: [geoNearStage.query, softDeleteFilter] }
                : softDeleteFilter;
        } else if (firstStage?.$search || firstStage?.$vectorSearch || (firstStage?.$match as any)?.$text) {
            // Atlas search/vector search or native text search must be first stage.
            pipeline.splice(1, 0, { $match: softDeleteFilter });
        } else {
            pipeline.unshift({ $match: softDeleteFilter });
        }

        if (next) next();
    });

    // Soft Delete Instance Method
    // Also sets isActive=false if the field exists, preventing the
    // isActive=true + isDeleted=true data integrity corruption.
    schema.methods.softDelete = function () {
        this.isDeleted = true;
        this.deletedAt = new Date();
        if ('isActive' in this) this.isActive = false;
        return this.save();
    };

    // Restore Instance Method
    schema.methods.restore = function () {
        this.isDeleted = false;
        this.deletedAt = undefined;
        return this.save();
    };
};

export default softDeletePlugin;
