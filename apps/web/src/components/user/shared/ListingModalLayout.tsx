import React from "react";
import { X } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Spinner,
  Z_INDEX,
} from "@esparex/ui";

interface ListingModalLayoutProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    fullScreen?: boolean;
    children: React.ReactNode;
}

export function ListingModalLayout({ title, subtitle, onClose, fullScreen, children }: ListingModalLayoutProps) {
    if (fullScreen) {
        return (
            <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent
                    hideClose
                    className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-dvh max-h-none rounded-none border-none p-0 bg-background text-foreground flex flex-col overflow-hidden"
                    style={{ zIndex: Z_INDEX.listingModal }}
                >
                    <header className="shrink-0 bg-background border-b border-border flex items-center px-4 h-14 sm:px-6">
                        <div className="flex items-center w-full max-w-2xl mx-auto">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="h-9 w-9 -ml-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                            <div className="flex-1 flex items-center gap-2.5 ml-2">
                                <DialogTitle className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                                    {title}
                                </DialogTitle>
                                {subtitle && (
                                    <span aria-current="step" className="text-tiny sm:text-xs font-bold text-blue-700 bg-blue-50/90 px-2.5 py-0.5 rounded-full border border-blue-200/60 uppercase tracking-wide">
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 flex flex-col w-full mx-auto max-w-2xl overflow-hidden">
                        {children}
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent
                hideClose
                variant="bottomSheet"
                style={{ zIndex: Z_INDEX.listingModal }}
            >
                <header className="shrink-0 bg-white border-b border-slate-100 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2.5 min-w-0">
                        <DialogTitle className="font-bold text-slate-900 text-base sm:text-lg tracking-tight truncate">
                            {title}
                        </DialogTitle>
                        {subtitle && (
                            <span aria-current="step" className="self-start sm:self-auto text-tiny sm:text-xs font-semibold text-blue-700 bg-blue-50/90 px-2 py-0.5 sm:px-2.5 rounded-full border border-blue-200/60 uppercase tracking-wide truncate max-w-full">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                    {children}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function ListingModalBody({
    children,
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
    return (
        <div
            {...props}
            className={cn("flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5 space-y-4", className)}
        >
            {children}
        </div>
    );
}

export function ListingModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <footer className={cn("shrink-0 bg-white border-t border-slate-100 px-4 py-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:px-6 sm:py-4 sticky bottom-0 z-20 shadow-lg shadow-slate-900/5", className)}>
            {children}
        </footer>
    );
}

export function ListingModalLoading() {
    return (
        <Dialog open={true}>
            <DialogContent
                hideClose
                className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-full max-h-none border-none p-0 bg-white flex flex-col overflow-hidden sm:fixed sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md md:max-w-[540px] sm:h-auto sm:max-h-[85dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-200/80"
                style={{ zIndex: Z_INDEX.listingModal }}
            >
                <DialogTitle className="sr-only">Loading modal</DialogTitle>
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2 min-h-[200px]">
                    <Spinner size="md" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
