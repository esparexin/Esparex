"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialSparePartPayloadSchema = exports.SparePartPayloadSchema = exports.BaseSparePartPayloadSchema = void 0;
/**
 * Spare Part Listing Payload Schema — shared between backend controller and frontend form.
 *
 * Backend controller: validates req.body on POST /api/v1/spare-part-listings
 * Frontend form: extends BaseSparePartPayloadSchema for UI-only fields before upload
 *
 * Field name SSOT: 'title' (not 'partName' — partPayload.schema.ts was legacy and is now deleted)
 */
const zod_1 = require("zod");
const text_schema_1 = require("./text.schema");
const objectIdSchema = zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId format');
exports.BaseSparePartPayloadSchema = zod_1.z.object({
    categoryId: objectIdSchema,
    sparePartId: objectIdSchema,
    brandId: objectIdSchema.optional(),
    title: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Title',
        minLength: 5,
        maxLength: 120,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
    }),
    description: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Description',
        minLength: 20,
        maxLength: 2000,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true,
    }),
    price: zod_1.z.number().min(0, 'Price must be at least 0').max(10_000_000, 'Price cannot exceed ₹1 crore'),
    images: zod_1.z.array(zod_1.z.string()).min(1, 'At least one image is required').max(10, 'Maximum 10 images allowed'),
});
/** Full create schema — used by backend POST handler */
exports.SparePartPayloadSchema = exports.BaseSparePartPayloadSchema;
/** Partial update schema — used by backend PATCH handler */
exports.PartialSparePartPayloadSchema = exports.BaseSparePartPayloadSchema.partial();
//# sourceMappingURL=sparePartPayload.schema.js.map