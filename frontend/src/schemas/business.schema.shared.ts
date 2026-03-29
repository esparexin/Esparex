import { z } from "zod";

const ALLOWED_ID_PROOF_TYPES = ["aadhaar", "pan", "driving_license", "voter_id"] as const;

export const BUSINESS_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/heic",
    "image/heif",
] as const;

export const BUSINESS_DOCUMENT_MIME_TYPES = [
    ...BUSINESS_IMAGE_MIME_TYPES,
    "application/pdf",
] as const;

export const BUSINESS_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
export const BUSINESS_UPLOAD_MAX_MB = BUSINESS_UPLOAD_MAX_BYTES / (1024 * 1024);
export const BUSINESS_IMAGE_ACCEPT = BUSINESS_IMAGE_MIME_TYPES.join(",");
export const BUSINESS_DOCUMENT_ACCEPT = BUSINESS_DOCUMENT_MIME_TYPES.join(",");

const createBusinessFileValidator = (allowedMimeTypes: readonly string[], typeLabel: string) =>
    z.union([
        z.instanceof(File)
            .refine(
                (file) => file.size <= BUSINESS_UPLOAD_MAX_BYTES,
                `File size must be less than ${BUSINESS_UPLOAD_MAX_MB}MB`,
            )
            .refine(
                (file) => allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number]),
                `Only supported ${typeLabel} file types are allowed`,
            ),
        z
            .string()
            .min(1, "Invalid file")
            .refine((val) => val.startsWith("http") || val.startsWith("data:"), "Invalid file URL"),
    ]);

export const businessImageFileValidator = createBusinessFileValidator(BUSINESS_IMAGE_MIME_TYPES, "image");
export const businessDocumentFileValidator = createBusinessFileValidator(BUSINESS_DOCUMENT_MIME_TYPES, "document");
export const businessFileValidator = businessDocumentFileValidator;

export const sanitizedBusinessText = (text: string) => {
    const excessiveSpecialChars = /[!@#$%^&*()_+=\[\]{};:'"<>,.?/\\|`~]{3,}/.test(text);
    const suspiciousPatterns = /xss|sql|script|select|drop|insert|exec/i.test(text);
    return !excessiveSpecialChars && !suspiciousPatterns;
};

const requiredBusinessFields = {
    businessTypes: z.array(z.string()).min(1, "Select at least one business type"),

    businessName: z
        .string()
        .trim()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name must be less than 100 characters")
        .refine(sanitizedBusinessText, "Business name contains invalid characters"),

    businessDescription: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(500, "Description must be less than 500 characters")
        .refine(sanitizedBusinessText, "Description contains invalid characters"),

    contactNumber: z
        .string()
        .length(10, "Contact number must be exactly 10 digits")
        .regex(/^\d{10}$/, "Contact number must contain only digits"),

    email: z.string().email("Please enter a valid email address").max(100, "Email must be less than 100 characters"),

    shopNo: z
        .string()
        .trim()
        .min(1, "Shop/Office number is required")
        .max(50, "Shop number must be less than 50 characters"),

    street: z
        .string()
        .trim()
        .min(3, "Street address must be at least 3 characters")
        .max(100, "Street address must be less than 100 characters"),

    landmark: z.string().trim().max(100, "Landmark must be less than 100 characters").optional().or(z.literal("")),

    city: z.string().trim().min(2, "City name must be at least 2 characters").max(50, "City name must be less than 50 characters"),

    state: z.string().trim().min(2, "State name must be at least 2 characters").max(50, "State name must be less than 50 characters"),

    pincode: z.string().length(6, "Pincode must be exactly 6 digits").regex(/^\d{6}$/, "Pincode must contain only digits"),

    coordinates: z
        .object({
            type: z.literal("Point"),
            coordinates: z.tuple([z.number(), z.number()]),
        })
        .readonly()
        .nullable()
        .optional(),
};

const requiredIdProofType = z
    .string()
    .min(1, "ID Proof Type is required")
    .refine((val) => ALLOWED_ID_PROOF_TYPES.includes(val as (typeof ALLOWED_ID_PROOF_TYPES)[number]), "Invalid ID proof type");

const optionalIdProofType = z
    .string()
    .refine((val) => !val || ALLOWED_ID_PROOF_TYPES.includes(val as (typeof ALLOWED_ID_PROOF_TYPES)[number]), "Invalid ID proof type")
    .optional();

const registrationOnlyFields = {
    idProofType: requiredIdProofType,
    idProof: businessDocumentFileValidator.nullable().refine((val) => val !== null, "ID Proof is required"),
    businessProof: businessDocumentFileValidator.nullable().refine((val) => val !== null, "Business Proof is required"),
    certificates: z.array(businessDocumentFileValidator).optional(),
    shopImages: z
        .array(businessImageFileValidator)
        .min(1, "Upload at least one shop image")
        .max(5, "Maximum 5 shop images allowed")
        .refine(
            (images) =>
                images.every((img) => {
                    if (typeof img === "string") return img.length > 0;
                    return img instanceof File && img.size > 0;
                }),
            "One or more images are invalid or empty",
        ),
};

const editOnlyFields = {
    idProofType: optionalIdProofType,
    idProof: businessDocumentFileValidator.nullable().optional(),
    businessProof: businessDocumentFileValidator.nullable().optional(),
    certificates: z.array(businessDocumentFileValidator).optional(),
    shopImages: z.array(businessImageFileValidator).max(5, "Maximum 5 shop images allowed").optional(),
};

export const createBusinessRegistrationSchema = () =>
    z.object({
        ...requiredBusinessFields,
        ...registrationOnlyFields,
    });

export const createBusinessEditSchema = () =>
    z.object({
        ...requiredBusinessFields,
        ...editOnlyFields,
    });
