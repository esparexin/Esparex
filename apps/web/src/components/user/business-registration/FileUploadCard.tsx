import { useState, useRef } from "react";
import Image from "next/image";
import { FileText, Upload, X } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { validateBusinessDocumentSelection } from "@/schemas/business.schema.shared";
import { UploadSourcePicker } from "@/components/user/shared/UploadSourcePicker";
import {
    getBusinessFileMeta,
    getBusinessFileName,
    isImageAsset,
    useFilePreviewUrl,
} from "./useFilePreviewUrl";

import { FormError } from "@/components/ui/FormError";

interface FileUploadCardProps {
    title: string;
    description?: string;
    file: File | string | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
    accept?: string;
    helperText?: string;
    error?: string;
}

export function FileUploadCard({
    title,
    file,
    onUpload,
    onRemove,
    accept,
    error,
}: FileUploadCardProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const previewUrl = useFilePreviewUrl(file);
    const showImagePreview = isImageAsset(file) && Boolean(previewUrl);
    const effectiveError = error || localError || undefined;

    const handleOpenPicker = () => {
        if (pickerOpen) return;
        setPickerOpen(true);
    };

    const handleCamera = () => {
        if (cameraInputRef.current) {
            cameraInputRef.current.value = "";
            cameraInputRef.current.click();
        }
    };

    const handleGallery = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileSelection = (selectedFile: File | undefined) => {
        if (!selectedFile) return;
        const validationError = validateBusinessDocumentSelection(selectedFile);
        if (validationError) {
            setLocalError(validationError);
            return;
        }
        setLocalError(null);
        onUpload(selectedFile);
    };

    return (
        <div className="space-y-1">
            <p className="text-sm font-medium text-foreground-secondary truncate">
                {title} <span className="text-destructive">*</span>
            </p>

            {file ? (
                <div className="group relative h-24 sm:h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    {showImagePreview && previewUrl ? (
                        <Image
                            src={previewUrl}
                            alt={title}
                            fill
                            unoptimized
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                            <FileText className="h-6 w-6 text-slate-400 mb-0.5" />
                            <span className="truncate text-xs font-semibold text-foreground max-w-full px-2">
                                {getBusinessFileName(file)}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                {getBusinessFileMeta(file)}
                            </span>
                        </div>
                    )}
                    <div className="absolute inset-0 flex items-start justify-between bg-gradient-to-t from-slate-900/60 via-slate-900/0 to-slate-900/0 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            Attached
                        </span>
                        <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            onClick={() => {
                                setLocalError(null);
                                onRemove();
                            }}
                            aria-label={`Remove ${title}`}
                            className="h-7 w-7 rounded-full bg-white/90 text-foreground-secondary shadow-sm hover:bg-white focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <X className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleOpenPicker}
                    aria-label={`Upload ${title}`}
                    className={cn(
                        "flex h-24 sm:h-28 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 text-center transition-all hover:border-blue-400 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation",
                        effectiveError && "border-red-300 bg-red-50/30"
                    )}
                >
                    <Upload className="mb-1.5 h-5 w-5 text-foreground-subtle" />
                    <span className="text-xs font-semibold text-foreground-secondary">Choose file</span>
                    <span className="mt-0.5 text-[11px] text-muted-foreground">PDF, JPG up to 10MB</span>
                </button>
            )}

            <input
                ref={cameraInputRef}
                id={`reg-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-camera`}
                name={`reg-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}-camera`}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                tabIndex={-1}
                aria-label={`Take photo of ${title}`}
                onChange={(e) => {
                    handleFileSelection(e.target.files?.[0]);
                    e.target.value = "";
                }}
            />

            <input
                ref={fileInputRef}
                id={`reg-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                name={`reg-${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                type="file"
                accept={accept}
                className="hidden"
                tabIndex={-1}
                aria-label={`Upload ${title}`}
                onChange={(e) => {
                    handleFileSelection(e.target.files?.[0]);
                    e.target.value = "";
                }}
            />

            <UploadSourcePicker
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                onCamera={handleCamera}
                onGallery={handleGallery}
                variant="document"
                title={`Upload ${title}`}
            />

            <FormError message={effectiveError} />
        </div>
    );
}
