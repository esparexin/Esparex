"use client";

import { useState, useCallback, type DragEvent } from "react";

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

    return {
        isDraggingOver,
        dropzoneProps: {
            onDragOver: handleDragOver,
            onDragLeave: handleDragLeave,
            onDrop: handleDrop,
        },
    };
}
