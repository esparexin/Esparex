import { Schema } from 'mongoose';

/**
 * Global Mongoose Serialization Plugin
 * 
 * Automatically enables virtuals for `toJSON` and `toObject` serialization
 * globally across all schemas. It securely maps `_id` to `id` and strips
 * internal fields like `_id` and `__v` to ensure API responses are clean
 * and compatible with the ESPAREX frontend.
 * 
 * This prevents the bug where simple `.toObject()` without configurations
 * drops vital `id` fields breaking UI components.
 */
export function mongooseSerializationPlugin(schema: Schema) {
    const transform = (_doc: unknown, ret: any) => {
        if (ret._id) {
            ret.id = typeof ret._id.toString === 'function' ? ret._id.toString() : String(ret._id);
            delete ret._id;
        }
        delete ret.__v;
        return ret;
    };

    // If the schema already defines a toJSON/toObject with its own custom transform, we might want to preserve it,
    // or wrap it. But since this applies globally, typical usage dictates setting the defaults.
    // We will merge with existing if present.

    const setupOptions = (method: 'toJSON' | 'toObject') => {
        const existingOpts = schema.get(method) || {};
        const existingTransform = existingOpts.transform;

        schema.set(method, {
            virtuals: true,
            versionKey: false,
            ...existingOpts,
            transform: (doc: any, ret: any, options: any) => {
                // Run schema-specific transform first
                let processedRet = ret;
                if (typeof existingTransform === 'function') {
                    processedRet = existingTransform(doc, ret, options) || ret;
                }
                // Apply global transform second to fill gaps and clean _id / __v
                return transform(doc, processedRet);
            }
        });
    };

    setupOptions('toJSON');
    setupOptions('toObject');
}
