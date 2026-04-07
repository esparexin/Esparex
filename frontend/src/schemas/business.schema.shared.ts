import { z } from "zod";
import { CONTACT_LIMITS } from "@shared/constants/fieldLimits";

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

const validateBusinessUploadSelection = (
    file: File,
    allowedMimeTypes: readonly string[],
    typeLabel: string,
): string | null => {
    if (file.size > BUSINESS_UPLOAD_MAX_BYTES) {
        return `File size must be less than ${BUSINESS_UPLOAD_MAX_MB}MB`;
    }
    if (!allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number])) {
        return `Only supported ${typeLabel} file types are allowed`;
    }
    return null;
};

export const validateBusinessImageSelection = (file: File): string | null =>
    validateBusinessUploadSelection(file, BUSINESS_IMAGE_MIME_TYPES, "image");

export const validateBusinessDocumentSelection = (file: File): string | null =>
    validateBusinessUploadSelection(file, BUSINESS_DOCUMENT_MIME_TYPES, "document");

export const sanitizedBusinessText = (text: string) => {
    const excessiveSpecialChars = /[!@#$%^&*()_+=\[\]{};:'"<>,.?/\\|`~]{3,}/.test(text);
    const suspiciousPatterns = /xss|sql|script|select|drop|insert|exec/i.test(text);
    return !excessiveSpecialChars && !suspiciousPatterns;
};

const requiredBusinessFields = {
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
        .max(2000, "Description must be less than 2000 characters")
        .refine(sanitizedBusinessText, "Description contains invalid characters"),

    contactNumber: z
        .string()
        .transform((value) => value.replace(/\D/g, "").slice(-10))
        .refine(
            (value) => CONTACT_LIMITS.PHONE.PATTERN.test(value),
            "Contact number must be a valid 10-digit Indian mobile starting with 6-9",
        ),

    email: z.string().email("Please enter a valid email address").max(100, "Email must be less than 100 characters"),

    fullAddress: z
        .string()
        .trim()
        .min(15, "Enter the complete business address")
        .max(300, "Business address must be less than 300 characters")
        .refine((value) => /\b\d{6}\b/.test(value), "Enter full address including 6-digit pincode"),

    currentLocationDisplay: z
        .string()
        .trim()
        .min(1, "Use current location to continue"),

    currentLocationSource: z.enum(["auto"]).optional().or(z.literal("")),

    currentLocationCity: z.string().trim().max(50, "Detected city must be less than 50 characters").optional().or(z.literal("")),

    currentLocationState: z.string().trim().max(50, "Detected state must be less than 50 characters").optional().or(z.literal("")),

    currentLocationCountry: z.string().trim().max(50, "Detected country must be less than 50 characters").optional().or(z.literal("")),

    coordinates: z
        .object({
            type: z.literal("Point"),
            coordinates: z.tuple([z.number(), z.number()]),
        })
        .readonly()
        .nullable()
        .refine((value) => value !== null, "Use current location to continue"),
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
