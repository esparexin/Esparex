"use client";

import { useCallback } from "react";
import type { ListingImage } from "@/types/listing";
import { apiClient } from "@/lib/api/client";
import logger from "@/lib/logger";

interface UploadResult {
    urls: string[];
    updatedImages: ListingImage[];
}

/**
 * 🖼️ Uploads local listing images to the server and returns remote URLs.
 * Handles CSRF token acquisition and per-image error reporting.
 */
export function useImageUploader() {
    const uploadImages = useCallback(async (images: ListingImage[]): Promise<UploadResult> => {
        const updatedImages = [...images];
        const urls: string[] = [];

        const uploadPromises = updatedImages.map(async (img, idx) => {
            if (!img) return null;
            if (img.isRemote) return img.preview;
            if (typeof img.preview === 'string' && img.preview.startsWith('http')) return img.preview;
            if (!img.file) return null;

            const formData = new FormData();
            formData.append("image", img.file);
            formData.append("folder", "ads");

            try {
                const csrfToken = (await apiClient.getCsrfToken()) || "";
                const response = await fetch("/api/upload/ad-image", {
                    method: "POST",
                    headers: { "x-csrf-token": csrfToken },
                    body: formData,
                    credentials: "include",
                });
                const payload = await response.json().catch(() => ({} as { success?: boolean; url?: string; error?: string }));
                const remoteUrl = typeof payload?.url === "string" ? payload.url : "";

                if (!response.ok || !remoteUrl) {
                    throw new Error(payload?.error || "Image upload failed.");
                }

                updatedImages[idx] = {
                    ...img,
                    preview: remoteUrl,
                    isRemote: true,
                };
                return remoteUrl;
            } catch (err) {
                logger.error(`[ImageUploader] Image ${idx + 1} upload failed:`, err);
                throw new Error(`Failed to upload image ${idx + 1}. Please try again.`);
            }
        });

        const resolvedUrls = await Promise.all(uploadPromises);
        urls.push(...resolvedUrls.filter((url): url is string => Boolean(url)));

        return { urls, updatedImages };
    }, []);

    return { uploadImages };
}
