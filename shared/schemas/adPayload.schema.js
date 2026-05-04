"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartialAdPayloadSchema = exports.AdPayloadSchema = exports.BaseAdPayloadSchema = void 0;
const zod_1 = require("zod");
const location_schema_1 = require("./location.schema");
const text_schema_1 = require("./text.schema");
const adLimits_1 = require("../constants/adLimits");
const listingType_1 = require("../enums/listingType");
const objectId = zod_1.z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');
const optionalObjectId = zod_1.z.preprocess((value) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, objectId.optional());
const optionalTrimmedString = zod_1.z.preprocess((value) => {
    if (typeof value !== 'string')
        return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}, zod_1.z.string().optional());
/* ────────────────────────────────────────────── */
/* BASE SCHEMA (NO refine / NO transform)        */
/* ────────────────────────────────────────────── */
exports.BaseAdPayloadSchema = zod_1.z.object({
    categoryId: optionalObjectId, // Canonical
    sparePartId: optionalObjectId, // Canonical — matches Ad.sparePartId model field
    brandId: optionalObjectId, // Canonical
    modelId: optionalObjectId, // Canonical
    screenSize: optionalTrimmedString,
    listingType: zod_1.z.enum(listingType_1.LISTING_TYPE_VALUES).optional(),
    attributes: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    // Uses centralized text validation (bans profanity, gibberish, etc.)
    title: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Title',
        minLength: adLimits_1.MIN_AD_TITLE_CHARS,
        maxLength: adLimits_1.MAX_AD_TITLE_CHARS,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),
    // Uses centralized text validation (bans profanity, gibberish, etc.)
    description: (0, text_schema_1.validatedTextSchema)({
        fieldName: 'Description',
        minLength: adLimits_1.MIN_AD_DESCRIPTION_CHARS,
        maxLength: adLimits_1.MAX_AD_DESCRIPTION_CHARS,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),
    price: zod_1.z.number().min(0, 'Price must be at least 0').max(10_000_000, 'Price cannot exceed ₹1 crore'),
    images: zod_1.z
        .array(zod_1.z.string())
        .min(adLimits_1.MIN_AD_IMAGES, `At least ${adLimits_1.MIN_AD_IMAGES} image is required`)
        .max(adLimits_1.MAX_AD_IMAGES, `Maximum ${adLimits_1.MAX_AD_IMAGES} images allowed`),
    // Retired. Canonical location id must be nested under location.locationId.
    locationId: zod_1.z.never().optional(),
    location: location_schema_1.LocationMetaSchema,
    spareParts: zod_1.z
        .array(objectId)
        .max(adLimits_1.MAX_AD_SPARE_PARTS, `Maximum ${adLimits_1.MAX_AD_SPARE_PARTS} spare parts allowed`)
        .optional(),
    deviceCondition: zod_1.z.enum(['power_on', 'power_off']).optional(),
    isFree: zod_1.z.boolean().default(false),
});
/* ────────────────────────────────────────────── */
/* FULL CREATE SCHEMA (USED FOR POST AD)         */
/* ────────────────────────────────────────────── */
exports.AdPayloadSchema = exports.BaseAdPayloadSchema.superRefine((data, ctx) => {
    const hasValidLocation = Boolean(data.location?.locationId) &&
        Boolean(data.location?.city?.trim()) &&
        Boolean(data.location?.state?.trim()) &&
        Boolean(data.location?.coordinates);
    if (!hasValidLocation) {
        ctx.addIssue({
            path: ['location'],
            message: 'Please select a location from the dropdown menu.',
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
    if (!data.categoryId) {
        ctx.addIssue({
            path: ['categoryId'],
            message: 'Category is required',
            code: zod_1.z.ZodIssueCode.custom,
        });
    }
    // 🔐 GOVERNANCE RULE 4: MODEL/SIZE SELECTION (RELAXED)
    // Model selection is now optional per upcoming UX requirements.
    // If brandId is present, modelId remains optional.
    // 🔐 GOVERNANCE RULE 7: SPARE PARTS (Decoupled from Power Status)
    // Spare parts are now informational metadata and no longer conditionally required based on power status.
});
/* ────────────────────────────────────────────── */
/* PARTIAL UPDATE SCHEMA (USED FOR PATCH / EDIT) */
/* ────────────────────────────────────────────── */
exports.PartialAdPayloadSchema = exports.BaseAdPayloadSchema.partial();
