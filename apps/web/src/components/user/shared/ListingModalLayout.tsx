import React from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Z_INDEX } from "@/lib/zIndexConfig";

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
            <div className="flex flex-col bg-white min-h-dvh">
                <header className="shrink-0 bg-white border-b border-slate-200 flex items-center px-4 h-14 sm:px-6">
                    <div className="flex items-center w-full max-w-4xl mx-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 w-11 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex-1 flex items-baseline gap-2 ml-1">
                            <h1 className="font-bold text-foreground text-base leading-none">
                                {title}
                            </h1>
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
            </div>
        );
    }

    return (
        <div
            onClick={onClose}
            style={{ zIndex: Z_INDEX.listingModal }}
            className={cn(
                "fixed inset-0 flex flex-col bg-white overflow-hidden",
                "sm:bg-slate-900/40 sm:backdrop-blur-md sm:items-center sm:justify-center sm:p-6 sm:cursor-pointer"
            )}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "flex flex-col bg-white flex-1 overflow-hidden sm:cursor-default",
                    "sm:flex-none sm:w-full sm:max-w-xl sm:max-h-[75dvh]",
                    "sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                )}
            >
                <header className="shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                    <div className="flex-1 flex items-baseline gap-2">
                        <h1 className="font-bold text-foreground text-base leading-none">
                            {title}
                        </h1>
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
            </div>
        </div>
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
        <div style={{ zIndex: Z_INDEX.listingModal }} className="fixed inset-0 flex flex-col bg-white overflow-hidden sm:bg-slate-900/40 sm:backdrop-blur-md sm:items-center sm:justify-center sm:p-6">
            <div className="flex flex-col bg-white flex-1 overflow-hidden sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10">
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-foreground-subtle" />
                </div>
            </div>
        </div>
    );
}
