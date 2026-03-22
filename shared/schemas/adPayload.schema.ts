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


const objectId = z.string().regex(/^[0-9a-f]{24}$/i, 'Invalid ObjectId');
const optionalObjectId = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    },
    objectId.optional()
);

const optionalTrimmedString = z.preprocess(
    (value) => {
        if (typeof value !== 'string') return value;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().optional()
);




/* ────────────────────────────────────────────── */
/* BASE SCHEMA (NO refine / NO transform)        */
/* ────────────────────────────────────────────── */
export const BaseAdPayloadSchema = z.object({
    categoryId: optionalObjectId, // Canonical
    sparePartId: optionalObjectId, // Canonical — matches Ad.sparePartId model field
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

    price: z.number().min(0, 'Price must be at least 0'),
    images: z
        .array(z.string())
        .min(MIN_AD_IMAGES, `At least ${MIN_AD_IMAGES} image is required`)
        .max(MAX_AD_IMAGES, `Maximum ${MAX_AD_IMAGES} images allowed`),

    // Retired. Canonical location id must be nested under location.locationId.
    locationId: z.never().optional(),
    location: LocationMetaSchema,


    spareParts: z
        .array(objectId)
        .max(MAX_AD_SPARE_PARTS, `Maximum ${MAX_AD_SPARE_PARTS} spare parts allowed`)
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
