// Browser-only upload validators for business registration/edit flows.
// DOM-dependent (File, MIME selection) — intentionally lives in apps/web schemas,
// not @esparex/contracts. Canonical payload ownership stays in contracts
// (BaseBusinessPayloadSchema); this module owns only upload UX validation.
import { z } from "zod";

const BUSINESS_IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
    "image/heic",
    "image/heif",
] as const;

const BUSINESS_DOCUMENT_MIME_TYPES = [
    ...BUSINESS_IMAGE_MIME_TYPES,
    "application/pdf",
] as const;

const BUSINESS_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;
const BUSINESS_UPLOAD_MAX_MB = BUSINESS_UPLOAD_MAX_BYTES / (1024 * 1024);
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
