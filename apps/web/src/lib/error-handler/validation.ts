import { createFileUploadError } from "./factories";
import type { EsparexError } from "./types";

export interface FileValidationOptions { maxSizeBytes?: number; allowedTypes?: string[]; allowedExtensions?: string[]; }

export const validateFile = (file: File, options: FileValidationOptions = {}): { valid: boolean; error?: EsparexError } => {
  const { maxSizeBytes = 5 * 1024 * 1024, allowedTypes = ["image/jpeg", "image/png", "image/webp"], allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"] } = options;
  if (file.size > maxSizeBytes) return { valid: false, error: createFileUploadError("tooLarge", file.name, file.size) };
  if (!allowedTypes.includes(file.type)) { const ext = file.name.split(".").pop()?.toLowerCase(); if (!ext || !allowedExtensions.includes(`.${ext}`)) return { valid: false, error: createFileUploadError("invalidType", file.name) }; }
  return { valid: true };
};

export const sanitizeInput = (input: string, maxLength?: number): string => {
  let s = input.trim().replace(/[<>]/g, "");
  if (maxLength && s.length > maxLength) s = s.substring(0, maxLength);
  return s;
};

/**
 * Sanitizes an upload filename to prevent path traversal (`..`), path separators (`/`, `\`),
 * and control characters, while preserving valid file extension and Unicode characters.
 */
export const sanitizeFileName = (filename: string): string => {
  if (typeof filename !== "string" || !filename.trim()) return "unnamed-file";

  const lastDotIndex = filename.lastIndexOf(".");
  let name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";

  name = name
    .replace(/\.\./g, "")
    .replace(/[:/\\]/g, "_")
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/_+/g, "_")
    .replace(/^[_.\-\s]+/, "")
    .trim();

  const safeName = name || "unnamed-file";
  return `${safeName}${ext.toLowerCase()}`;
};
