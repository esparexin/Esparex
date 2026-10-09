"use client";

import { useEffect, useState } from "react";
import { type EmailTemplateDTO, type EmailTemplatePreviewDTO } from "@esparex/contracts";
import {
    Button,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    Badge,
    Spinner,
    Monitor,
    Smartphone,
} from "@esparex/ui";

interface EmailTemplatePreviewModalProps {
    template: EmailTemplateDTO | null;
    isOpen: boolean;
    onClose: () => void;
    onGetPreview: (key: EmailTemplateDTO["key"]) => Promise<EmailTemplatePreviewDTO | null>;
}

export function EmailTemplatePreviewModal({
    template,
    isOpen,
    onClose,
    onGetPreview,
}: EmailTemplatePreviewModalProps) {
    const [preview, setPreview] = useState<EmailTemplatePreviewDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
    const [prevKey, setPrevKey] = useState<string | null>(null);

    const currentKey = isOpen && template ? template.key : null;
    if (currentKey !== prevKey) {
        setPrevKey(currentKey);
        setPreview(null);
        setLoading(Boolean(currentKey));
    }

    useEffect(() => {
        if (!isOpen || !template) return;
        let isMounted = true;

        void onGetPreview(template.key).then((res) => {
            if (isMounted) {
                setPreview(res);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, [isOpen, template, onGetPreview]);

    if (!template) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col h-[85vh]">
                <DialogHeader className="p-4 border-b border-border bg-card/60 flex-shrink-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <DialogTitle className="text-body-lg font-semibold text-foreground">
                                    {template.name}
                                </DialogTitle>
                                <Badge variant="secondary" className="text-caption uppercase">
                                    {template.category}
                                </Badge>
                                {template.isCustomized && (
                                    <Badge variant="outline" className="text-caption border-primary/40 text-primary">
                                        Customized
                                    </Badge>
                                )}
                            </div>
                            <DialogDescription className="text-caption text-muted-foreground">
                                {template.description}
                            </DialogDescription>
                        </div>

                        {/* Viewport Width Switcher */}
                        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-md border border-border">
                            <Button
                                type="button"
                                size="sm"
                                variant={previewMode === "desktop" ? "default" : "ghost"}
                                className="h-7 px-2.5 text-caption gap-1.5"
                                onClick={() => setPreviewMode("desktop")}
                                aria-label="Desktop viewport preview"
                            >
                                <Monitor className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Desktop</span>
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant={previewMode === "mobile" ? "default" : "ghost"}
                                className="h-7 px-2.5 text-caption gap-1.5"
                                onClick={() => setPreviewMode("mobile")}
                                aria-label="Mobile viewport preview"
                            >
                                <Smartphone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Mobile</span>
                            </Button>
                        </div>
                    </div>

                    {/* Active Subject Banner */}
                    <div className="mt-3 px-3 py-2 bg-muted/40 rounded border border-border text-caption flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="font-semibold text-muted-foreground uppercase text-tiny tracking-wider">
                            Subject:
                        </span>
                        <span className="text-foreground font-medium truncate">
                            {preview?.subject || template.subject}
                        </span>
                    </div>
                </DialogHeader>

                {/* Preview Frame Area */}
                <div className="flex-1 bg-muted/20 overflow-y-auto p-4 flex items-start justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
                            <Spinner className="w-6 h-6 animate-spin" />
                            <span className="text-caption">Rendering live HTML preview...</span>
                        </div>
                    ) : preview?.html ? (
                        <div
                            className={`transition-all duration-200 shadow-md border border-border rounded-lg overflow-hidden bg-white w-full ${
                                previewMode === "desktop" ? "max-w-[640px]" : "max-w-[375px]"
                            }`}
                        >
                            <iframe
                                title={`Preview for ${template.name}`}
                                srcDoc={preview.html}
                                className="w-full h-[600px] border-0"
                                sandbox="allow-same-origin"
                            />
                        </div>
                    ) : (
                        <div className="text-center py-16 text-caption text-muted-foreground">
                            No preview content available.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
