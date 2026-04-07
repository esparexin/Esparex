import { useState } from "react";
import Image from "next/image";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { validateBusinessDocumentSelection } from "@/schemas/business.schema.shared";
import {
    getBusinessFileMeta,
    getBusinessFileName,
    isImageAsset,
    useFilePreviewUrl,
} from "./useFilePreviewUrl";

interface FileUploadCardProps {
    title: string;
    description: string;
    file: File | string | null;
    onUpload: (file: File) => void;
    onRemove: () => void;
    accept?: string;
    helperText?: string;
    error?: string;
}

export function FileUploadCard({
    title,
    description,
    file,
    onUpload,
    onRemove,
    accept,
    helperText,
    error,
}: FileUploadCardProps) {
    const [localError, setLocalError] = useState<string | null>(null);
    const previewUrl = useFilePreviewUrl(file);
    const showImagePreview = isImageAsset(file) && Boolean(previewUrl);
    const effectiveError = error || localError || undefined;

    return (
        <div
            className={cn(
                "rounded-2xl border p-5 transition-colors",
                effectiveError ? "border-red-200 bg-red-50/30" : "border-slate-200 bg-white",
            )}
        >
            <div className="space-y-1">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
                    </div>
                    {file && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {file instanceof File ? "Ready" : "Attached"}
                        </span>
                    )}
                </div>
                {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
            </div>

            {file ? (
                <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    {showImagePreview && previewUrl ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <Image
                                src={previewUrl}
                                alt={title}
                                fill
                                unoptimized
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-white">
                            <FileText className="h-7 w-7 text-slate-500" />
                        </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {getBusinessFileName(file)}
                        </p>
                        <p className="text-xs font-medium text-slate-500">
                            {getBusinessFileMeta(file)}
                        </p>
                        <p className="text-xs leading-5 text-slate-500">
                            {file instanceof File
                                ? "This file is staged locally and will upload securely when you submit the form."
                                : "This file is already attached to your business profile until you replace it."}
                        </p>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            setLocalError(null);
                            onRemove();
                        }}
                        className="h-11 w-11 shrink-0 rounded-full text-rose-500 hover:bg-rose-50"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition-colors hover:border-blue-400 hover:bg-blue-50">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm">
                        <Upload className="h-6 w-6 text-slate-500" />
                    </div>
                    <span className="text-sm font-semibold text-slate-900">Choose file</span>
                    <span className="mt-1 text-xs leading-5 text-slate-500">
                        Pick a clear scan or photo. It will upload when you submit this form.
                    </span>
                    <input
                        id={`reg-${title.toLowerCase().replace(/\s+/g, "-")}`}
                        name={`reg-${title.toLowerCase().replace(/\s+/g, "-")}`}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => {
                            const selectedFile = e.target.files?.[0];
                            if (!selectedFile) return;
                            const validationError = validateBusinessDocumentSelection(selectedFile);
                            if (validationError) {
                                setLocalError(validationError);
                                e.currentTarget.value = "";
                                return;
                            }
                            setLocalError(null);
                            onUpload(selectedFile);
                            e.currentTarget.value = "";
                        }}
                    />
                </label>
            )}

            {effectiveError && <p className="mt-3 text-xs font-medium text-red-600">{effectiveError}</p>}
        </div>
    );
}
