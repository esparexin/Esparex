import React from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { Z_INDEX } from "@/lib/zIndexConfig";

interface ListingModalLayoutProps {
    title: string;
    subtitle?: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function ListingModalLayout({ title, subtitle, onClose, children }: ListingModalLayoutProps) {
    return (
        <>
            {/* Mobile full-screen (< 1024px) */}
            <div className="flex flex-col bg-white min-h-dvh lg:hidden" aria-hidden="true">
                <header className="shrink-0 bg-white border-b border-slate-200 flex items-center px-4 h-14 sm:px-6">
                    <div className="flex items-center w-full max-w-4xl mx-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="h-11 w-11 -ml-2 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
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
                <div className="flex-1 flex flex-col w-full mx-auto max-w-4xl">
                    {children}
                </div>
            </div>

            {/* Desktop modal (>= 1024px) */}
            <div
                onClick={onClose}
                style={{ zIndex: Z_INDEX.listingModal }}
                className="hidden lg:flex fixed inset-0 bg-slate-900/40 backdrop-blur-md items-center justify-center p-6 cursor-pointer"
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex flex-col bg-white w-full max-w-5xl max-h-[90dvh] rounded-2xl shadow-2xl border border-slate-900/10 cursor-default overflow-hidden"
                >
                    <header className="shrink-0 bg-white border-b border-slate-200 flex items-center gap-3 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="h-11 w-11 rounded-full flex items-center justify-center text-muted-foreground hover:bg-slate-100 hover:text-foreground transition-colors shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="flex-1 flex items-baseline gap-2">
                            <h1 className="font-bold text-foreground text-base leading-none">
                                {title}
                            </h1>
                            {subtitle && (
                                <span aria-current="step" className="text-xs font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded uppercase tracking-wider">
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
        </>
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
            className={cn("flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5", className)}
        >
            {children}
        </div>
    );
}

export function ListingModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <footer className={cn("shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4 max-sm:sticky max-sm:bottom-0 max-sm:z-10", className)}>
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
