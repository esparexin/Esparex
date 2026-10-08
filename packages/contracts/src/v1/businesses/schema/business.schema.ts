import { z } from 'zod';
import { BUSINESS_LIMITS, CONTACT_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';
import { coordinatesSchema } from '../../common/schema/coordinates.schema';
import { emailSchema, objectIdSchema, optionalTrimmedString } from '../../common/schema/common.schemas';
import { ID_PROOF_TYPE_VALUES } from '../../identity/enums/idProofType';

const FULL_ADDRESS_PINCODE_PATTERN = /\b[1-9]\d{5}\b/;

export const businessPhoneSchema = z.string()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .refine(
        (val) => CONTACT_LIMITS.PHONE.PATTERN.test(val),
        'Invalid mobile number (must be a 10-digit Indian mobile starting with 6–9)'
    );

export const businessLocationSchema = z.object({
    locationId: z.union([objectIdSchema, z.literal('')]).optional(),
    address: z.string()
        .trim()
        .min(15, 'Complete business address is required')
        .max(300, 'Business address must be 300 characters or fewer')
        .superRefine((val, ctx) => {
            const hasSixDigitNumber = /\b\d{6}\b/.test(val);
            const hasValidIndianPincode = FULL_ADDRESS_PINCODE_PATTERN.test(val);

            if (!hasSixDigitNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Address must include a valid 6-digit pincode',
                });
            } else if (!hasValidIndianPincode) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Please verify the pincode entered',
                });
            }
        }),
    display: z.union([z.string().trim().max(150), z.literal('')]).optional(),
    city: z.union([z.string().trim().max(50), z.literal('')]).optional(),
    state: z.union([z.string().trim().max(50), z.literal('')]).optional(),
    country: z.union([z.string().trim().max(50), z.literal('')]).optional(),
    pincode: z.union([
        z.string().regex(BUSINESS_LIMITS.PINCODE.PATTERN, BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
        z.literal(''),
    ]).optional(),
    // P1-9: optional at the API wire-contract level. The mobile client cannot
    // capture coordinates in its registration flow; the response DTO
    // (BusinessLocation.coordinates?) and the core service (normalizeLocation
    // with requireLocationId: false) already tolerate their absence. Web still
    // enforces location capture in its own form validation.
    coordinates: coordinatesSchema.optional(),
});

export const businessDocumentsSchema = z.object({
    idProofType: z.enum(ID_PROOF_TYPE_VALUES).optional().default('aadhaar'),
    idProof: z.array(z.string()).min(1, 'ID proof is required'),
    businessProof: z.array(z.string()).min(1, 'Business proof is required'),
    certificates: z.array(z.string()).optional()
});

export const BaseBusinessPayloadShape = {
    name: z.string()
        .trim()
        .min(TEXT_LIMITS.BUSINESS_NAME.MIN, TEXT_LIMITS.BUSINESS_NAME.ERROR_MIN)
        .max(TEXT_LIMITS.BUSINESS_NAME.MAX, TEXT_LIMITS.BUSINESS_NAME.ERROR_MAX),
    description: optionalTrimmedString(z.string().trim().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be 2000 characters or fewer')),
    businessTypes: z.array(z.string().trim().min(2).max(50)).min(1, 'Select at least one business type').optional(),
    location: businessLocationSchema,
    mobile: businessPhoneSchema.optional(),
    email: emailSchema,
    website: z.union([z.string().url('Invalid URL format').max(CONTACT_LIMITS.WEBSITE.MAX), z.literal('')]).optional(),
    gstNumber: z.union([
        z.string().regex(BUSINESS_LIMITS.GST.PATTERN, BUSINESS_LIMITS.GST.ERROR_FORMAT),
        z.literal(''),
    ]).optional(),
    registrationNumber: z.union([
        z.string().trim().min(BUSINESS_LIMITS.REGISTRATION.MIN, BUSINESS_LIMITS.REGISTRATION.ERROR_MIN).max(BUSINESS_LIMITS.REGISTRATION.MAX, BUSINESS_LIMITS.REGISTRATION.ERROR_MAX),
        z.literal(''),
    ]).optional(),
    workingHours: z.unknown().optional(),
    // P1-9: optional at the API wire-contract level. The mobile client has no
    // shop-image upload step in its registration flow; the response DTO
    // (Business.images?) and the core service (falls back to existing images)
    // already tolerate absence. When provided, at least one image is required.
    images: z.array(z.string())
        .min(BUSINESS_LIMITS.IMAGES.MIN, BUSINESS_LIMITS.IMAGES.ERROR_MIN)
        .max(BUSINESS_LIMITS.IMAGES.MAX, BUSINESS_LIMITS.IMAGES.ERROR_MAX)
        .optional(),
    documents: businessDocumentsSchema
};

export const BaseBusinessPayloadSchema = z.object(BaseBusinessPayloadShape);

export const CreateBusinessPayloadSchema = BaseBusinessPayloadSchema.strict()
    .refine((data) => !!data.mobile, {
        message: 'Mobile number is required',
        path: ['mobile']
    });

export const UpdateBusinessPayloadSchema = BaseBusinessPayloadSchema.partial().extend({
    location: businessLocationSchema.partial().optional(),
    documents: businessDocumentsSchema.partial().optional(),
    images: z.array(z.string()).max(BUSINESS_LIMITS.IMAGES.MAX, BUSINESS_LIMITS.IMAGES.ERROR_MAX).optional(),
    businessTypes: z.array(z.string().trim().min(2).max(50)).min(1, 'Select at least one business type').optional(),
}).strict();

export type BaseBusinessPayload = z.infer<typeof BaseBusinessPayloadSchema>;
export type CreateBusinessPayload = z.infer<typeof CreateBusinessPayloadSchema>;
export type UpdateBusinessPayload = z.infer<typeof UpdateBusinessPayloadSchema>;
