import React from "react";
import { X, Loader2 } from "@/icons/IconRegistry";
import { cn } from "@/components/ui/utils";
import {
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
    const titleId = React.useId();

    if (fullScreen) {
        return (
            <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
                <DialogContent
                    hideClose
                    className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-dvh max-h-none rounded-none border-none p-0 bg-white flex flex-col overflow-hidden"
                    style={{ zIndex: Z_INDEX.listingModal }}
                >
                    <header className="shrink-0 bg-white border-b border-slate-200 flex items-center px-4 h-14 sm:px-6">
                        <div className="flex items-center w-full max-w-4xl mx-auto">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close modal"
                                className="h-11 w-11 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex-1 flex items-baseline gap-2 ml-1">
                                <DialogTitle id={titleId} className="font-bold text-foreground text-base leading-none">
                                    {title}
                                </DialogTitle>
                                {subtitle && (
                                    <span aria-current="step" className="text-[10px] sm:text-xs font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                        {subtitle}
                                    </span>
                                )}
                            </div>
                        </div>
                    </header>
                    <div className="flex-1 flex flex-col w-full mx-auto max-w-4xl overflow-hidden">
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
                className={cn(
                    "fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-full max-h-none border-none p-0 bg-white flex flex-col overflow-hidden",
                    "sm:fixed sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
                    "sm:w-full sm:max-w-xl sm:h-auto sm:max-h-[75dvh]",
                    "sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                )}
                style={{ zIndex: Z_INDEX.listingModal }}
            >
                <header className="shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex items-baseline gap-2">
                        <DialogTitle id={titleId} className="font-bold text-foreground text-base leading-none">
                            {title}
                        </DialogTitle>
                        {subtitle && (
                            <span aria-current="step" className="text-[10px] sm:text-xs font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {subtitle}
                            </span>
                        )}
                    </div>
                </header>
                <div className="flex-1 flex flex-col overflow-hidden">
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
            className={cn("flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-5", className)}
        >
            {children}
        </div>
    );
}

export function ListingModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <footer className={cn("shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4 sticky bottom-0 z-10", className)}>
            {children}
        </footer>
    );
}

export function ListingModalLoading() {
    return (
        <Dialog open={true}>
            <DialogContent
                hideClose
                className="fixed inset-0 top-0 left-0 translate-x-0 translate-y-0 w-full max-w-none h-full max-h-none border-none p-0 bg-white flex flex-col overflow-hidden sm:fixed sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-lg sm:h-auto sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                style={{ zIndex: Z_INDEX.listingModal }}
            >
                <DialogTitle className="sr-only">Loading modal</DialogTitle>
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
                    <Spinner size="md" />
                </div>
            </DialogContent>
        </Dialog>
    );
}
