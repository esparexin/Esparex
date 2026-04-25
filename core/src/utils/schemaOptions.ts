import { Schema } from 'mongoose';

/**
 * Applies the standard toJSON transform to a given Mongoose schema.
 * This converts the internal _id ObjectId to a string 'id', removes the _id and __v fields,
 * and enables virtuals on the resulting JSON object.
 *
 * @param schema The mongoose schema to configure
 */
export const applyToJSONTransform = (schema: Schema): void => {
    schema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret as Record<string, unknown> & { _id?: { toString(): string }; id?: string };
            json.id = json._id?.toString();
            delete json._id;
            return json;
        }
    });
};
