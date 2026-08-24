"use client";

import { AlertCircle, Search, Target, X } from "@/icons/IconRegistry";
import { Button, Spinner } from "@esparex/ui";
import { Input } from "@/components/ui/input";
import { cn } from "@/components/ui/utils";

export function LocationSelectorPanel({
    className,
    onClose,
    isDetecting,
    successFeedback,
    detectFeedback,
    handlePanelDetect,
    location,
    query,
    setQuery,
    disabled,
    isSearching,
    handleClearQuery,
    onKeyDown,
    children,
}: {
    className?: string;
    onClose?: () => void;
    isDetecting: boolean;
    successFeedback?: string | null;
    detectFeedback?: string | null;
    handlePanelDetect: () => void;
    location?: { source?: string; display?: string; city?: string; name?: string; state?: string } | null;
    query: string;
    setQuery: (val: string) => void;
    disabled?: boolean;
    isSearching: boolean;
    handleClearQuery: () => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex h-full min-h-0 flex-col bg-background", className)} onKeyDown={onKeyDown}>

                    </div>
                )}
            </div>

                <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5 px-1 space-y-0.5 focus:outline-none", isSearching && "opacity-60")}>
                    {children}
                </div>
            </div>
        </div>
    );
}
