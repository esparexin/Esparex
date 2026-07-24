"use client";

import { AlertCircle, Search, Target, X } from "lucide-react";
import { Button } from "@esparex/ui";
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
    children: React.ReactNode;
}) {
    return (
        <div className={cn("flex h-full min-h-0 flex-col bg-background", className)}>
            <div className="sticky top-0 z-10 border-b bg-background/95 px-3 pb-3 pt-2 backdrop-blur" style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}>
                <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">Choose location</p>
                        <p className="text-[11px] text-muted-foreground">Use GPS or search by city and state.</p>
                    </div>
                    {onClose ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 rounded-full"
                            onClick={onClose}
                            aria-label="Close location selector"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>

                <div className="space-y-2">
                    <Button
                        variant="outline"
                        className={cn(
                            "h-auto min-h-[44px] w-full justify-between rounded-xl border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10",
                            isDetecting && "border-primary/40 bg-primary/10"
                        )}
                        disabled={isDetecting || !!successFeedback}
                        onClick={handlePanelDetect}
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {successFeedback ? (
                                <Target className="h-4 w-4 shrink-0 text-green-600" />
                            ) : (
                                <Target className={cn("h-4 w-4 shrink-0", isDetecting && "animate-spin")} />
                            )}
                            <div className="flex flex-col items-start leading-tight min-w-0 flex-1 text-left">
                                {successFeedback ? (
                                    <span className="text-green-600 font-semibold truncate w-full">{successFeedback}</span>
                                ) : isDetecting ? (
                                    <span className="truncate w-full">{detectFeedback || "Detecting location..."}</span>
                                ) : (location?.source !== "default" && location?.display && location?.display !== "India") ? (
                                    <>
                                        <span className="truncate w-full font-semibold">{location.city || location.name}{location.state ? `, ${location.state}` : ''}</span>
                                        <span className="text-[10px] text-muted-foreground mt-0.5 w-full truncate">Current Location</span>
                                    </>
                                ) : (
                                    <span className="truncate w-full">Detect My Location</span>
                                )}
                            </div>
                        </div>
                    </Button>

                    {detectFeedback && !isDetecting && (
                        <div className="rounded-lg border border-destructive/10 bg-destructive/5 px-3 py-2">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                                <p className="text-[11px] font-medium leading-4 text-destructive">{detectFeedback}</p>
                            </div>
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search city, area, district..."
                            className="h-11 rounded-xl pl-9 pr-9 text-sm"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                            disabled={disabled}
                        />
                        {isSearching ? (
                            <div className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        ) : query ? (
                            <button onClick={handleClearQuery} className="absolute right-3 top-1/2 -translate-y-1/2" type="button" aria-label="Clear search">
                                <X className="h-4 w-4" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-3 pb-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                <div className={cn("min-h-0 flex-1 overflow-y-auto pt-2 pr-1", isSearching && "pointer-events-none opacity-60")}>
                    {children}
                </div>
            </div>
        </div>
    );
}
