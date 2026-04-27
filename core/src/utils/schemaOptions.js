"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyToJSONTransform = void 0;
/**
 * Applies the standard toJSON transform to a given Mongoose schema.
 * This converts the internal _id ObjectId to a string 'id', removes the _id and __v fields,
 * and enables virtuals on the resulting JSON object.
 *
 * @param schema The mongoose schema to configure
 */
const applyToJSONTransform = (schema) => {
    schema.set('toJSON', {
        virtuals: true,
        versionKey: false,
        transform: function (_doc, ret) {
            const json = ret;
            json.id = json._id?.toString();
            delete json._id;
            return json;
        }
    });
};
exports.applyToJSONTransform = applyToJSONTransform;
//# sourceMappingURL=schemaOptions.js.map