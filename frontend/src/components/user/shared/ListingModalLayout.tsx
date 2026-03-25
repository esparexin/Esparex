import React from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";

interface ListingModalLayoutProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function ListingModalLayout({ title, onClose, children }: ListingModalLayoutProps) {
    return (
        <div
            onClick={onClose}
            className={cn(
                "fixed inset-0 z-[1001] flex flex-col bg-white overflow-hidden font-inter",
                "sm:bg-slate-900/40 sm:backdrop-blur-md",
                "sm:items-center sm:justify-center sm:p-6 sm:cursor-pointer"
            )}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "flex flex-col bg-white flex-1 overflow-hidden sm:cursor-default",
                    "sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh]",
                    "sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10"
                )}
            >
                <header
                    className={cn(
                        "shrink-0 bg-white border-b border-slate-200",
                        "flex items-center px-4 h-14",
                        "sm:gap-3 sm:px-5 sm:h-auto sm:py-4"
                    )}
                >
                    <div className="flex items-center w-full sm:contents">
                        <div className="w-10 sm:w-auto flex items-center justify-start shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close"
                                className="h-9 w-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <h1
                            className={cn(
                                "font-bold text-slate-900 text-base leading-none",
                                "flex-1 text-center",
                                "sm:flex-none sm:text-left"
                            )}
                        >
                            {title}
                        </h1>
                        <div className="w-10 sm:hidden" />
                    </div>
                </header>
                {children}
            </div>
        </div>
    );
}

export function ListingModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn("flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5", className)}>
            {children}
        </div>
    );
}

export function ListingModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <footer className={cn("shrink-0 bg-white border-t border-slate-100 p-4 sm:px-5 sm:py-4", className)}>
            {children}
        </footer>
    );
}

export function ListingModalLoading() {
    return (
        <div className="fixed inset-0 z-[1001] flex flex-col bg-white overflow-hidden font-inter sm:bg-slate-900/40 sm:backdrop-blur-md sm:items-center sm:justify-center sm:p-6">
            <div className="flex flex-col bg-white flex-1 overflow-hidden sm:flex-none sm:w-full sm:max-w-lg sm:max-h-[90dvh] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-900/10">
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            </div>
        </div>
    );
}
