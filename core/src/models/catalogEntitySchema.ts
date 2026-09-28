import { Schema } from 'mongoose';
import { marketplaceTrustDefinition, marketplaceTrustBaseDefinition } from './catalogLifecycle';

/**
 * Shared catalog entity schema fields.
 * Eliminates duplicate field definitions across Brand, Model, Variant, ServiceType.
 */

export interface CatalogEntityFields {
    name: string;
    displayName: string;
    canonicalName: string;
    slug: string;
    aliases: string[];
    synonyms: string[];
}

export const catalogEntitySchemaFields = {
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    canonicalName: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    aliases: { type: [String], default: [] },
    synonyms: { type: [String], default: [] },
} satisfies Record<string, Schema['paths'][string]>;

export const catalogEntitySchemaOptions = {
    timestamps: true,
    toJSON: { virtuals: true, versionKey: false },
    toObject: { virtuals: true, versionKey: false },
};

export const catalogEntityIndexes = [
    { name: { type: 1 } },
];

export function createCatalogEntitySchema<T extends CatalogEntityFields>(
    extraFields: Record<string, Schema['paths'][string]>,
    marketplaceTrust: typeof marketplaceTrustDefinition | typeof marketplaceTrustBaseDefinition = marketplaceTrustDefinition,
    customIndexes: Schema['indexes'] = []
): Schema<T> {
    return new Schema<T>({
        ...catalogEntitySchemaFields,
        marketplaceTrust,
        ...extraFields,
    }, {
        ...catalogEntitySchemaOptions,
        indexes: [...catalogEntityIndexes.map(idx => ({ fields: idx, options: {} })), ...customIndexes],
    });
}