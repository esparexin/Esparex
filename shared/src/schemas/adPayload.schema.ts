import { z } from 'zod';
import { LocationMetaSchema } from './location.schema';
import { validatedTextSchema } from './text.schema';
import {
    MIN_AD_IMAGES,
    MAX_AD_IMAGES,
    MIN_AD_TITLE_CHARS,
    MAX_AD_TITLE_CHARS,
    MIN_AD_DESCRIPTION_CHARS,
    MAX_AD_DESCRIPTION_CHARS,
    MAX_AD_SPARE_PARTS,
} from '../constants/adLimits';
import { LISTING_TYPE_VALUES } from '../enums/listingType';


import { optionalTrimmedStringSchema as optionalTrimmedString } from './common.schemas';

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
    /** @deprecated UI no longer surfaces sparePartId. Kept for API backward compatibility. */
    sparePartId: optionalObjectId,
    serviceTypeIds: z.array(optionalObjectId).optional(), // Unified support for service types
    brandId: optionalObjectId, // Canonical
    modelId: optionalObjectId, // Canonical

    screenSize: optionalTrimmedString,
    listingType: z.enum(LISTING_TYPE_VALUES).optional(),
    attributes: z.record(z.string(), z.unknown()).optional(),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    title: validatedTextSchema({
        fieldName: 'Title',
        minLength: MIN_AD_TITLE_CHARS,
        maxLength: MAX_AD_TITLE_CHARS,
        strictMode: true,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),

    // Uses centralized text validation (bans profanity, gibberish, etc.)
    description: validatedTextSchema({
        fieldName: 'Description',
        minLength: MIN_AD_DESCRIPTION_CHARS,
        maxLength: MAX_AD_DESCRIPTION_CHARS,
        strictMode: false,
        checkBannedWords: true,
        checkGibberish: true,
        checkQuality: true
    }),

    price: z.preprocess(
        (val) => (typeof val === 'string' ? parseFloat(val) : val),
        z.number().min(0, 'Price must be at least 0').max(10_000_000, 'Price cannot exceed ₹1 crore')
    ),
    images: z
        .array(z.string())
        .min(MIN_AD_IMAGES, `At least ${MIN_AD_IMAGES} image is required`)
        .max(MAX_AD_IMAGES, `Maximum ${MAX_AD_IMAGES} images allowed`),

    // locationId: z.never().optional(), // Canonical location id must be nested under location.locationId.
    locationId: z.string().optional(),
    location: LocationMetaSchema,


    spareParts: z
        .array(objectId)
        .max(MAX_AD_SPARE_PARTS, `Maximum ${MAX_AD_SPARE_PARTS} spare parts allowed`)
        .optional(),
    deviceCondition: z.enum(['power_on', 'power_off']).optional(),
    isFree: z.boolean().default(false),

    // Admin / service-listing fields (used by admin detail/update views)
    condition: z.enum(['new', 'used', 'refurbished']).optional(),
    priceMin: z.number().min(0).max(10_000_000).optional(),
    priceMax: z.number().min(0).max(10_000_000).optional(),
    diagnosticFee: z.number().min(0).optional(),
    deviceType: z.string().max(50).optional(),
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
