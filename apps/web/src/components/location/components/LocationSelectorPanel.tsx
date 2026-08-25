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
            {/* Sticky Header: 1. Title Row -> 2. Search Field -> 3. Auto-Detect / GPS Tile */}
            {/* design-token-ignore: safe area padding for sticky mobile panel */}
            <div className="sticky top-0 z-10 border-b border-border/80 bg-background/95 p-3.5 pb-3 backdrop-blur flex flex-col gap-2.5" style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }} /* design-token-ignore: safe area padding for sticky mobile panel */>
                {/* Title and Close Button */}
                <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-body font-bold text-foreground">Choose location</p>
                        <p className="text-caption text-foreground-subtle">Use GPS or search by city and state.</p>
                    </div>
                    {onClose ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full hover:bg-muted cursor-pointer"
                            onClick={onClose}
                            aria-label="Close location selector"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>

                {/* 1. Crisp Search Field (On Top) */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search city, area, district..."
                        className="h-11 sm:h-10 rounded-xl pl-9 pr-9 text-caption sm:text-body bg-background border border-border shadow-xs hover:border-primary/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={onKeyDown}
                        autoFocus
                        disabled={disabled}
                    />
                    {isSearching ? (
                        <Spinner
                            size="sm"
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        />
                    ) : query ? (
                        <button onClick={handleClearQuery} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded-md" type="button" aria-label="Clear search">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>

                {/* 2. Auto-Detect / GPS Tile (Directly Below Search) */}
                <Button
                    type="button"
                    variant="outline"
                    className={cn(
                        "h-auto min-h-[44px] sm:min-h-[40px] w-full justify-between rounded-xl border-primary/25 bg-primary/5 px-3 py-2 text-body font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer",
                        isDetecting && "border-primary/50 bg-primary/10"
                    )}
                    disabled={isDetecting || !!successFeedback}
                    onClick={handlePanelDetect}
                >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        {successFeedback ? (
                            <Target className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                            <Target className={cn("h-4 w-4 shrink-0 text-primary", isDetecting && "animate-spin")} />
                        )}
                        <div className="flex flex-col items-start leading-tight min-w-0 flex-1 text-left">
                            {successFeedback ? (
                                <span className="text-emerald-600 font-semibold truncate w-full text-caption sm:text-body">{successFeedback}</span>
                            ) : isDetecting ? (
                                <span className="truncate w-full text-caption text-primary">{detectFeedback || "Detecting location..."}</span>
                            ) : (location?.source === "auto" || location?.source === "ip") && location?.display && location?.display !== "India" ? (
                                <>
                                    <span className="truncate w-full font-semibold text-foreground text-caption sm:text-body">{location.city || location.name}{location.state ? `, ${location.state}` : ''}</span>
                                    <span className="text-tiny font-medium text-emerald-600 mt-0.5 w-full truncate">Auto-Detected Location</span>
                                </>
                            ) : (
                                <span className="truncate w-full font-semibold text-foreground text-caption sm:text-body">Use Current Location</span>
                            )}
                        </div>
                    </div>
                </Button>

                {/* Error Feedback */}
                {detectFeedback && !isDetecting && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-2.5 py-1.5">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                            <p className="text-caption font-medium leading-4 text-destructive">{detectFeedback}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Results Area */}
            {/* design-token-ignore: safe area padding for mobile panel scroll bottom */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
                <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5 px-1 flex flex-col gap-0.5 focus:outline-none", isSearching && "opacity-60")}>
                    {children}
                </div>
            </div>
        </div>
    );
}
