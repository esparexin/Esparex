"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@esparex/ui";
import { Camera, FileText, Upload, Trash2 } from "@esparex/ui";
import { useIsMobileDevice } from "@/hooks/useMobile";

export interface UploadSourcePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCamera: () => void;
    onGallery: () => void;
    onRemovePhoto?: () => void;
    variant?: "listing" | "profile" | "document";
    showRemoveOption?: boolean;
    title?: string;
    cameraLabel?: string;
    galleryLabel?: string;
}

export function UploadSourcePicker({
    open,
    onOpenChange,
    onCamera,
    onGallery,
    onRemovePhoto,
    variant = "listing",
    showRemoveOption = false,
    title,
    cameraLabel,
    galleryLabel,
}: UploadSourcePickerProps) {
    const isMobileDevice = useIsMobileDevice();

    const defaultTitle = 
        variant === "profile" 
            ? "Profile Photo Options" 
            : variant === "document" 
                ? "Upload Document" 
                : "Add Photos";

    const defaultCameraLabel = "Take Photo";
    const defaultGalleryLabel = variant === "document" ? "Choose File" : "Choose from Gallery";

    const effectiveTitle = title || defaultTitle;
    const effectiveCameraLabel = cameraLabel || defaultCameraLabel;
    const effectiveGalleryLabel = galleryLabel || defaultGalleryLabel;

    const handleCameraSelect = () => {
        onOpenChange(false);
        onCamera();
    };

    const handleGallerySelect = () => {
        onOpenChange(false);
        onGallery();
    };

    const handleRemoveSelect = () => {
        onOpenChange(false);
        onRemovePhoto?.();
    };

    const GalleryIcon = variant === "document" ? FileText : Upload;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                hideClose
                variant="bottomSheet"
                className="sm:!max-w-[320px] md:!max-w-[320px] border-none shadow-2xl p-0 overflow-hidden bg-card rounded-t-2xl sm:rounded-2xl"
            >
                {/* Header */}
                <DialogHeader className="px-5 py-4 border-b border-border mb-0 space-y-0 text-left">
                    <DialogTitle className="flex items-center gap-2.5 text-body-lg font-bold text-foreground">
                        <Camera className="h-5 w-5 text-primary shrink-0" />
                        <span className="truncate">{effectiveTitle}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Action Rows */}
                <div className="p-2 space-y-0.5">
                    {isMobileDevice && (
                        <button
                            type="button"
                            onClick={handleCameraSelect}
                            className="w-full flex items-center gap-3.5 px-4 h-12 rounded-xl text-left text-body font-semibold text-foreground hover:bg-muted active:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation cursor-pointer"
                        >
                            <Camera className="h-4.5 w-4.5 text-foreground-secondary shrink-0" />
                            <span>{effectiveCameraLabel}</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleGallerySelect}
                        className="w-full flex items-center gap-3.5 px-4 h-12 rounded-xl text-left text-body font-semibold text-foreground hover:bg-muted active:bg-muted/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation cursor-pointer"
                    >
                        <GalleryIcon className="h-4.5 w-4.5 text-foreground-secondary shrink-0" />
                        <span>{effectiveGalleryLabel}</span>
                    </button>

                    {showRemoveOption && onRemovePhoto && (
                        <button
                            type="button"
                            onClick={handleRemoveSelect}
                            className="w-full flex items-center gap-3.5 px-4 h-12 rounded-xl text-left text-body font-semibold text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive touch-manipulation cursor-pointer"
                        >
                            <Trash2 className="h-4.5 w-4.5 text-destructive shrink-0" />
                            <span>Remove Photo</span>
                        </button>
                    )}
                </div>

                {/* Footer Cancel */}
                <div className="p-2 pt-0 border-t border-border">
                    <button
                        type="button"
                        onClick={() => onOpenChange(false)}
                        className="w-full h-11 flex items-center justify-center rounded-xl text-body font-semibold text-foreground-subtle hover:bg-muted hover:text-foreground transition-colors touch-manipulation cursor-pointer"
                    >
                        Cancel
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
