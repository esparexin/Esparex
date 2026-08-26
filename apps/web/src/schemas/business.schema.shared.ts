import { z } from "zod";
import { CONTACT_LIMITS, BUSINESS_LIMITS } from "@esparex/contracts";
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

export const sanitizedBusinessText = (text: string): boolean => {
    if (!text || typeof text !== "string") return false;
    const trimmed = text.trim();
    if (trimmed.length === 0) return false;

    // Disallow excessive consecutive special punctuation (e.g. $$$$, ???? except standard formatting)
    const excessiveRepeatedSpecialChars = /[!@#$%^&*+=[\]{};:"<>/\\|`~]{4,}/.test(trimmed);
    if (excessiveRepeatedSpecialChars) return false;

    // Reject raw script or HTML tag injection payloads
    const containsHtmlOrScriptTag = /<\s*script\b[^>]*>|<\s*\/\s*script\s*>|<\s*iframe\b[^>]*>|javascript:/i.test(trimmed);
    if (containsHtmlOrScriptTag) return false;

    return true;
};

const requiredBusinessFields = {
    name: z
        .string()
        .trim()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name must be less than 100 characters")
        .refine(sanitizedBusinessText, "Business name contains invalid characters"),

    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description must be less than 2000 characters")
        .refine(sanitizedBusinessText, "Description contains invalid characters"),

    mobile: z
        .string()
        .transform((value) => value.replace(/\D/g, "").slice(-10))
        .refine(
            (value) => CONTACT_LIMITS.PHONE.PATTERN.test(value),
            "Contact number must be a valid 10-digit Indian mobile starting with 6-9",
        ),

    email: z.string().email("Please enter a valid email address").max(CONTACT_LIMITS.EMAIL.MAX, "Email must be less than 255 characters"),

    address: z
        .string()
        .trim()
        .min(15, "Enter the complete business address")
        .max(300, "Business address must be less than 300 characters")
        .superRefine((val, ctx) => {
            const hasSixDigitNumber = /\b\d{6}\b/.test(val);
            const hasValidIndianPincode = /\b[1-9]\d{5}\b/.test(val);

            if (!hasSixDigitNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Enter full address including 6-digit pincode",
                });
            } else if (!hasValidIndianPincode) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Please verify the pincode entered",
                });
            }
        }),

    currentLocationDisplay: z
        .string()
        .trim()
        .min(1, "Use current location to continue"),

    currentLocationSource: z.enum(["auto", "ip", "manual", "default"]).optional().or(z.literal("")),

    currentLocationCity: z.string().trim().max(50, "Detected city must be less than 50 characters").optional().or(z.literal("")),

    currentLocationState: z.string().trim().max(50, "Detected state must be less than 50 characters").optional().or(z.literal("")),

    currentLocationPincode: z.string().trim().max(10, "Detected pincode must be less than 10 characters").optional().or(z.literal("")),

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
    .refine((val) => !val || ALLOWED_ID_PROOF_TYPES.includes(val as (typeof ALLOWED_ID_PROOF_TYPES)[number]), "Invalid ID proof type")
    .optional()
    .default("aadhaar");

const optionalIdProofType = z
    .string()
    .refine((val) => !val || ALLOWED_ID_PROOF_TYPES.includes(val as (typeof ALLOWED_ID_PROOF_TYPES)[number]), "Invalid ID proof type")
    .optional();

const registrationOnlyFields = {
    idProofType: requiredIdProofType,
    idProof: businessDocumentFileValidator.nullable().refine((val) => val !== undefined, "ID Proof is required"),
    businessProof: businessDocumentFileValidator.nullable().refine((val) => val !== undefined, "Business Proof is required"),
    certificates: z.array(businessDocumentFileValidator).optional(),
    images: z
        .array(businessImageFileValidator)
        .min(1, "Upload at least one shop image")
        .max(BUSINESS_LIMITS.IMAGES.MAX, `Maximum ${BUSINESS_LIMITS.IMAGES.MAX} shop images allowed`)
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
    images: z.array(businessImageFileValidator).max(5, "Maximum 5 shop images allowed").optional(),
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

