"use client";

import { useEffect, useState } from "react";

const IMAGE_URL_PATTERN = /\.(avif|heic|heif|jpe?g|png|webp)(?:$|[?#])/i;

export function isImageAsset(file: File | string | null | undefined) {
    if (!file) return false;
    if (file instanceof File) {
        return file.type.startsWith("image/");
    }
    return file.startsWith("data:image/") || IMAGE_URL_PATTERN.test(file);
}

export function useFilePreviewUrl(file: File | string | null | undefined) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(typeof file === "string" ? file : null);

    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        if (typeof file === "string") {
            setPreviewUrl(file);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [file]);

    return previewUrl;
}

export function getBusinessFileName(file: File | string | null | undefined) {
    if (!file) return "No file selected";
    if (file instanceof File) return file.name;

    try {
        const pathname = new URL(file, "https://placeholder.local").pathname;
        const lastSegment = pathname.split("/").filter(Boolean).pop();
        return lastSegment || "Uploaded file";
    } catch {
        return "Uploaded file";
    }
}

export function getBusinessFileMeta(file: File | string | null | undefined) {
    if (!file) return "";
    if (file instanceof File) {
        return `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    }
    return "Already uploaded";
}
