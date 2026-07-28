"use client";

import { uploadBusinessImage } from "@/lib/api/user/businesses";
import { sanitizeFileName } from "@/lib/error-handler/validation";
import type { SubmissionStatus } from "./types";

/**
 * Explicit Retry Policy helper:
 * Retries network drops, timeouts, 408, 429, 500, 502, 503, 504.
 * Fails fast for non-retryable errors (400 validation, 401 auth, 403 forbidden, 413 too large, 415 unsupported media).
 */
export function isRetryableUploadError(error: unknown): boolean {
    if (!error) return true;
    const status =
        (error as { status?: number; statusCode?: number; code?: number }).status ??
        (error as { status?: number; statusCode?: number; code?: number }).statusCode ??
        (error as { status?: number; statusCode?: number; code?: number }).code;

    if (typeof status === "number") {
        if ([400, 401, 403, 413, 415].includes(status)) {
            return false;
        }
        return [408, 429, 500, 502, 503, 504].includes(status);
    }
    return true;
}

async function uploadSingleFileWithRetry(
    file: File,
    folder: "businesses" | "documents",
    maxAttempts = 3
): Promise<string> {
    const sanitizedName = sanitizeFileName(file.name);
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });

    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await uploadBusinessImage(sanitizedFile, folder);
        } catch (err) {
            lastError = err;
            if (!isRetryableUploadError(err) || attempt === maxAttempts) {
                throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, attempt * 300));
        }
    }
    throw lastError;
}

export async function processStagedFiles(
    items: Array<File | string>,
    options?: { label?: string; onProgress?: (status: SubmissionStatus) => void }
): Promise<string[]> {
    const results: string[] = [];
    const totalUploadable = items.filter((item): item is File => item instanceof File).length;
    let uploadedCount = 0;

    for (const item of items) {
        if (!(item instanceof File)) {
            results.push(item);
            continue;
        }
        uploadedCount++;
        options?.onProgress?.({
            title: options.label || "Uploading files",
            detail: `${uploadedCount} of ${totalUploadable} file${totalUploadable === 1 ? "" : "s"} uploaded`,
        });

        const folder = item.type === "application/pdf" ? "documents" : "businesses";
        const url = await uploadSingleFileWithRetry(item, folder);
        results.push(url);
    }

    return results;
}
