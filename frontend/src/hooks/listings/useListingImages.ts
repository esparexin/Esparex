"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import type { ListingImage } from "@/types/listing";
import { MAX_AD_IMAGES, MAX_AD_IMAGE_BYTES } from "@shared/constants/adLimits";
import imageCompression from 'browser-image-compression';
import { notify } from "@/lib/notify";
import logger from "@/lib/logger";

import { generateFileHash, LISTING_IMAGE_COMPRESSION_OPTIONS } from "@/utils/listings/imageUtils";

interface UseListingImagesProps {
    maxImages?: number;
    onImagesChange?: (images: ListingImage[]) => void;
}

/**
 * 🖼️ Unified Image Hook for Listings
 * Handles selection, validation, compression, and duplicate detection.
 */
export function useListingImages({ 
    maxImages = MAX_AD_IMAGES, 
    onImagesChange 
}: UseListingImagesProps = {}) {
    const [listingImages, setListingImages] = useState<ListingImage[]>([]);
    const listingImagesRef = useRef<ListingImage[]>([]);
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [imageUploadError, setImageUploadError] = useState<string | null>(null);

    useEffect(() => {
        listingImagesRef.current = listingImages;
        onImagesChange?.(listingImages);
    }, [listingImages, onImagesChange]);

    const addImages = useCallback(async (files: File[]) => {
        setImageUploadError(null);
        const currentCount = listingImagesRef.current.length;
        const remaining = maxImages - currentCount;
        
        if (remaining <= 0) {
            setImageUploadError(`You can upload up to ${maxImages} images.`);
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
            const processedFiles: { file: File, hash: string }[] = [];
            for (const file of imageFiles) {
                try {
                    const hash = await generateFileHash(file);
                    // Check duplicate across existing images
                    if (listingImagesRef.current.some(img => img.hash === hash)) {
                        setImageUploadError("⚠️ Duplicate image detected. Please choose another.");
                        continue;
                    }
                    processedFiles.push({ file, hash });
                } catch {
                    processedFiles.push({ file, hash: crypto.randomUUID() });
                }
            }

            if (processedFiles.length === 0) return;

            const compressedFiles = await Promise.all(
                processedFiles.map(async (item) => {
                    try {
                        const compressed = await imageCompression(item.file, LISTING_IMAGE_COMPRESSION_OPTIONS);
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

            const newListingImages: ListingImage[] = compressedFiles.map(item => ({
                id: crypto.randomUUID(),
                preview: URL.createObjectURL(item.file),
                file: item.file as File,
                isRemote: false,
                hash: item.hash
            }));

            setListingImages(prev => [...prev, ...newListingImages]);
        } finally {
            setIsUploadingImages(false);
        }
    }, [maxImages]);

    const removeImage = useCallback((index: number) => {
        setImageUploadError(null);
        setListingImages(prev => {
            const copy = [...prev];
            const removed = copy.splice(index, 1)[0];
            if (removed && !removed.isRemote && removed.preview) {
                URL.revokeObjectURL(removed.preview);
            }
            return copy;
        });
    }, []);

    const clearImages = useCallback(() => {
        setListingImages(prev => {
            prev.forEach(img => {
                if (!img.isRemote && img.preview) URL.revokeObjectURL(img.preview);
            });
            return [];
        });
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            listingImagesRef.current.forEach(img => {
                if (!img.isRemote && img.preview) {
                    URL.revokeObjectURL(img.preview);
                }
            });
        };
    }, []);

    return useMemo(() => ({
        listingImages,
        setListingImages,
        isUploadingImages,
        imageUploadError,
        setImageUploadError,
        addImages,
        removeImage,
        clearImages,
    }), [
        listingImages, 
        setListingImages, 
        isUploadingImages, 
        imageUploadError, 
        setImageUploadError, 
        addImages, 
        removeImage, 
        clearImages
    ]);
}
