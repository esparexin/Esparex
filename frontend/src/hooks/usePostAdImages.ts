"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { AdImage } from "@/components/user/post-ad/types";
import { MAX_AD_IMAGES, MAX_AD_IMAGE_BYTES } from "@shared/constants/adLimits";
import imageCompression from 'browser-image-compression';
import { notify } from "@/lib/notify";
import logger from "@/lib/logger";

const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export function usePostAdImages() {
    const [adImages, setAdImages] = useState<AdImage[]>([]);
    const adImagesRef = useRef<AdImage[]>([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    useEffect(() => {
        adImagesRef.current = adImages;
    }, [adImages]);

    const addImages = useCallback(async (files: File[]) => {
        setImageUploadError(null);
        const remaining = MAX_AD_IMAGES - adImages.length;
        if (remaining <= 0) {
            setImageUploadError(`You can upload up to ${MAX_AD_IMAGES} images.`);
            return;
        }

        const accepted = files.slice(0, remaining);
        const imageFiles = accepted.filter((file) => file.type.startsWith("image/"));

        if (imageFiles.length === 0) {
            setImageUploadError("Please select valid image files.");
            return;
        }

        if (imageFiles.length !== accepted.length) {
            setImageUploadError("Some selected files were skipped because they are not images.");
        }

        setIsUploadingImages(true);
        try {
            // Pre-process and Hash
            const processedFiles: { file: File, hash: string }[] = [];
            for (const file of imageFiles) {
                try {
                    const hash = await generateFileHash(file);
                    // Check duplicate
                    if (adImages.some(img => img.hash === hash)) {
                        setImageUploadError("⚠️ This image already uploaded. Please choose another image.");
                        continue;
                    }
                    processedFiles.push({ file, hash });
                } catch {
                    processedFiles.push({ file, hash: crypto.randomUUID() });
                }
            }

            if (processedFiles.length === 0) return; // Only duplicates were selected

            const compressedFiles = await Promise.all(
                processedFiles.map(async (item) => {
                    try {
                        const options = {
                            maxSizeMB: 4.5,
                            maxWidthOrHeight: 1920,
                            // Avoid the library's default CDN worker URL so CSP stays strict.
                            useWebWorker: false,
                        };
                        const compressed = await imageCompression(item.file, options);
                        return { file: compressed, hash: item.hash };
                    } catch (e) {
                        logger.warn("Compression failed, using original", e);
                        return item;
                    }
                })
            );

            const oversized = compressedFiles.find((item) => item.file.size > MAX_AD_IMAGE_BYTES);
            if (oversized) {
                notify.error(`Each image must be less than ${Math.floor(MAX_AD_IMAGE_BYTES / (1024 * 1024))}MB.`);
                return;
            }

            const newAdImages = compressedFiles.map(item => ({
                id: crypto.randomUUID(),
                preview: URL.createObjectURL(item.file),
                file: item.file as File,
                isRemote: false,
                hash: item.hash
            }));

            setAdImages(prev => [...prev, ...newAdImages]);
        } finally {
            setIsUploadingImages(false);
        }
    }, [adImages]);

    const removeImage = useCallback((index: number) => {
        setImageUploadError(null);
        setAdImages(prev => {
            const copy = [...prev];
            const removed = copy.splice(index, 1)[0];
            if (removed && !removed.isRemote && removed.preview) URL.revokeObjectURL(removed.preview);
            return copy;
        });
    }, []);

    // Cleanup ObjectURLs on unmount
    useEffect(() => {
        return () => {
            adImagesRef.current.forEach(img => {
                if (!img.isRemote && img.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, []);

    return {
        adImages,
        setAdImages,
        isUploadingImages,
        imageUploadError,
        setImageUploadError,
        addImages,
        removeImage,
    };
}
