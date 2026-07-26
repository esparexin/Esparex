"use client";

import { useState, useCallback, type DragEvent, type KeyboardEvent } from "react";

interface UseImageDropzoneOptions {
    onUpload: (files: File[]) => void;
    disabled?: boolean;
    accept?: string;
}

export function useImageDropzone({ onUpload, disabled = false }: UseImageDropzoneOptions) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        setIsDraggingOver(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    }, []);

    const handleDrop = useCallback((e: DragEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files).filter((file) =>
                file.type.startsWith("image/")
            );
            if (filesArray.length > 0) {
                onUpload(filesArray);
            }
        }
    }, [disabled, onUpload]);

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLElement>) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            const input = e.currentTarget.querySelector("input[type='file']") as HTMLInputElement | null;
            input?.click();
        }
    }, [disabled]);

    return {
        isDraggingOver,
        dropzoneProps: {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
            onKeyDown: handleKeyDown,
        },
    };
}
