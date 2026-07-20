import { z } from 'zod';
import { MIN_AD_IMAGES, MAX_AD_IMAGES, MAX_AD_SPARE_PARTS, MIN_AD_TITLE_CHARS, MAX_AD_TITLE_CHARS, MIN_AD_DESCRIPTION_CHARS, MAX_AD_DESCRIPTION_CHARS } from '../../common/constants/adLimits';
import { LocationMetaSchema } from '../../common/schema/location.schema';
import { validatedTextSchema } from '../../common/schema/text.schema';
import { LISTING_TYPE_VALUES } from '../enums/listingType';



const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');
const optionalObjectId = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    },
    objectId.optional()
);




/* ────────────────────────────────────────────── */
/* BASE SCHEMA (NO refine / NO transform)        */
/* ────────────────────────────────────────────── */
export const BaseAdPayloadSchema = z.object({
    categoryId: optionalObjectId, // Canonical
    sparePartId: optionalObjectId, // Canonical — matches Ad.sparePartId model field
    serviceTypeIds: z.array(optionalObjectId).optional(), // Unified support for service types
    brandId: optionalObjectId, // Canonical
    modelId: optionalObjectId, // Canonical

    screenSize: z.string(),
    listingType: z.enum(LISTING_TYPE_VALUES).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: MIN_AD_TITLE_CHARS,
        maxLength: MAX_AD_TITLE_CHARS,
        }),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: MIN_AD_DESCRIPTION_CHARS,
        maxLength: MAX_AD_DESCRIPTION_CHARS,
        }),

    price: z.preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z.number().min(0, 'Price must be at least 0').max(10_000_000, 'Price cannot exceed ₹1 crore')
    ),
    images: z
        .array(z.string())
        .min(1, `At least ${MIN_AD_IMAGES} image is required`)
        .max(MAX_AD_IMAGES, `Maximum ${MAX_AD_IMAGES} images allowed`),

    // Retired. Canonical location id must be nested under location.locationId.
    locationId: z.never().optional(),
    location: LocationMetaSchema,


    spareParts: z
        .array(objectId)
        .max(10, `Maximum ${MAX_AD_SPARE_PARTS} spare parts allowed`)
        .optional(),
    deviceCondition: z.enum(['power_on', 'power_off']).optional(),
    isFree: z.boolean().default(false),
});

/* ────────────────────────────────────────────── */
/* FULL CREATE SCHEMA (USED FOR POST AD)         */
/* ────────────────────────────────────────────── */
export const AdPayloadSchema = BaseAdPayloadSchema.superRefine((data, ctx) => {
    const hasValidLocation =
        Boolean(data.location?.locationId) &&
        Boolean(data.location?.city?.trim()) &&
        Boolean(data.location?.state?.trim()) &&
        Boolean(data.location?.coordinates);

    if (!hasValidLocation) {
        ctx.addIssue({
            path: ['location'],
            message: 'Please select a location from the dropdown menu.',
            code: z.ZodIssueCode.custom,
        });
    }

    if (!data.categoryId) {
        ctx.addIssue({
            path: ['categoryId'],
            message: 'Category is required',
            code: z.ZodIssueCode.custom,
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
export const PartialAdPayloadSchema = BaseAdPayloadSchema.partial();

/* ────────────────────────────────────────────── */
/* TYPES                                         */
/* ────────────────────────────────────────────── */
export type BaseAdPayload = z.infer<typeof BaseAdPayloadSchema>;
export type AdPayload = z.infer<typeof AdPayloadSchema>;
export type PartialAdPayload = z.infer<typeof PartialAdPayloadSchema>;
