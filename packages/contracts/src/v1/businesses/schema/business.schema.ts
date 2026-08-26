import { z } from 'zod';
import { BUSINESS_LIMITS, CONTACT_LIMITS, TEXT_LIMITS } from '../../common/constants/fieldLimits';
import { coordinatesSchema } from '../../common/schema/coordinates.schema';
import { ID_PROOF_TYPE_VALUES } from '../../identity/enums/idProofType';

const FULL_ADDRESS_PINCODE_PATTERN = /\b[1-9]\d{5}\b/;

export const businessPhoneSchema = z.string()
    .transform((val) => val.replace(/\D/g, '').slice(-10))
    .refine(
        (val) => CONTACT_LIMITS.PHONE.PATTERN.test(val),
        'Invalid mobile number (must be a 10-digit Indian mobile starting with 6–9)'
    );

export const businessLocationSchema = z.object({
    locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID').optional(),
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
    display: z.string().trim().max(150).optional(),
    city: z.string().trim().max(50).optional(),
    state: z.string().trim().max(50).optional(),
    country: z.string().trim().max(50).optional(),
    pincode: z.union([
        z.string().regex(BUSINESS_LIMITS.PINCODE.PATTERN, BUSINESS_LIMITS.PINCODE.ERROR_FORMAT),
        z.literal(''),
    ]).optional(),
    coordinates: coordinatesSchema,
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
    description: z.string()
        .trim()
        .min(20, 'Description must be at least 20 characters')
        .max(2000, 'Description must be 2000 characters or fewer')
        .optional(),
    businessTypes: z.array(z.string().trim().min(2).max(50)).min(1, 'Select at least one business type').optional(),
    location: businessLocationSchema,
    mobile: businessPhoneSchema.optional(),
    email: z.string().email('Invalid email format').max(CONTACT_LIMITS.EMAIL.MAX).toLowerCase(),
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
    images: z.array(z.string())
        .min(BUSINESS_LIMITS.IMAGES.MIN, BUSINESS_LIMITS.IMAGES.ERROR_MIN)
        .max(BUSINESS_LIMITS.IMAGES.MAX, BUSINESS_LIMITS.IMAGES.ERROR_MAX),
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
