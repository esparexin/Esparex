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
