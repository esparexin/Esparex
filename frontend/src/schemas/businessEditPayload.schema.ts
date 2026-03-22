import { z } from "zod";

// Reuse the same file validator from the registration schema
const fileValidator = z.union([
    z.instanceof(File).refine(
        (file) => file.size <= 5 * 1024 * 1024,
        "File size must be less than 5MB"
    ).refine(
        (file) => ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif', 'application/pdf'].includes(file.type),
        "Only JPEG, PNG, WebP, AVIF, HEIC, HEIF, and PDF files are allowed"
    ),
    z.string().min(1, "Invalid image").refine(
        (val) => val.startsWith('http') || val.startsWith('data:'),
        "Invalid image URL"
    )
]);

const sanitizedText = (text: string) => {
    const excessiveSpecialChars = /[!@#$%^&*()_+=\[\]{};:'"<>,.?/\\|`~]{3,}/.test(text);
    const suspiciousPatterns = /xss|sql|script|select|drop|insert|exec/i.test(text);
    return !excessiveSpecialChars && !suspiciousPatterns;
};

// Edit schema: document/image fields are optional — existing assets are preserved
// when the user does not upload new files.
export const businessEditSchema = z.object({
    businessTypes: z.array(z.string()).min(1, "Select at least one business type"),

    businessName: z.string()
        .trim()
        .min(3, "Business name must be at least 3 characters")
        .max(100, "Business name must be less than 100 characters")
        .refine(sanitizedText, "Business name contains invalid characters"),

    businessDescription: z.string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(500, "Description must be less than 500 characters")
        .refine(sanitizedText, "Description contains invalid characters"),

    contactNumber: z.string()
        .length(10, "Contact number must be exactly 10 digits")
        .regex(/^\d{10}$/, "Contact number must contain only digits"),

    email: z.string()
        .email("Please enter a valid email address")
        .max(100, "Email must be less than 100 characters"),

    shopNo: z.string()
        .trim()
        .min(1, "Shop/Office number is required")
        .max(50, "Shop number must be less than 50 characters"),

    street: z.string()
        .trim()
        .min(3, "Street address must be at least 3 characters")
        .max(100, "Street address must be less than 100 characters"),

    landmark: z.string()
        .trim()
        .max(100, "Landmark must be less than 100 characters")
        .optional()
        .or(z.literal("")),

    city: z.string()
        .trim()
        .min(2, "City name must be at least 2 characters")
        .max(50, "City name must be less than 50 characters"),

    state: z.string()
        .trim()
        .min(2, "State name must be at least 2 characters")
        .max(50, "State name must be less than 50 characters"),

    pincode: z.string()
        .length(6, "Pincode must be exactly 6 digits")
        .regex(/^\d{6}$/, "Pincode must contain only digits"),

    coordinates: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()])
    }).readonly().nullable().optional(),

    // Document fields are optional on edit — existing assets are preserved when null
    idProofType: z.string()
        .refine(val => !val || ['aadhaar', 'pan', 'driving_license', 'voter_id'].includes(val),
            "Invalid ID proof type")
        .optional(),

    idProof: fileValidator.nullable().optional(),

    businessProof: fileValidator.nullable().optional(),

    certificates: z.array(fileValidator).optional(),

    // Shop images optional on edit — at least 1 must exist (pre-filled from existing)
    shopImages: z.array(fileValidator)
        .max(5, "Maximum 5 shop images allowed")
        .optional(),
});

export type BusinessEditFormData = z.infer<typeof businessEditSchema>;
export type BusinessEditFormInput = z.input<typeof businessEditSchema>;
