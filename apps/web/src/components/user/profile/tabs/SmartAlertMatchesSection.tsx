"use client";

import {
    Bell,
    Button,
    Calendar,
    ExternalLink,
    ImageOff,
    MapPin,
    Pagination,
} from "@esparex/ui";
import { formatDate, formatPrice } from "@/lib/formatters";
import type { SmartAlertListItem } from "../types";
import type { FetchSmartAlertMatchesResponse } from "@/lib/api/user/smartAlerts";

export interface SmartAlertMatchesSectionProps {
    smartAlerts: SmartAlertListItem[];
    selectedAlertFilter?: string;
    onClearFilter: () => void;
    isLoadingMatches: boolean;
    matchesData?: FetchSmartAlertMatchesResponse;
    onPageChange: (page: number) => void;
    onNavigateToAd: (url: string) => void;
}

export function SmartAlertMatchesSection({
    smartAlerts,
    selectedAlertFilter,
    onClearFilter,
    isLoadingMatches,
    matchesData,
    onPageChange,
    onNavigateToAd,
}: SmartAlertMatchesSectionProps) {
    return (
        <div className="space-y-4">
            {selectedAlertFilter && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-caption">
                    <span className="text-foreground">
                        Filtered by: <strong className="text-foreground">{smartAlerts.find((a) => a.id === selectedAlertFilter)?.name || "Selected Alert"}</strong>
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-tiny text-primary hover:bg-primary/10 font-medium"
                        onClick={onClearFilter}
                    >
                        Clear Filter
                    </Button>
                </div>
            )}

            {isLoadingMatches ? (
                <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-4 animate-pulse h-20" />
                    ))}
                </div>
            ) : !matchesData?.matches || matchesData.matches.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border border-dashed border-border bg-card text-center space-y-1.5">
                    <h4 className="font-semibold text-body-lg text-foreground">No matched listings yet</h4>
                    <p className="text-caption text-foreground-secondary max-w-sm mx-auto">
                        {selectedAlertFilter
                            ? "No listings have matched this alert yet."
                            : "Matching listings will appear here when published."}
                    </p>
                    {selectedAlertFilter && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-caption font-semibold rounded-xl"
                            onClick={onClearFilter}
                        >
                            View All Matches
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="rounded-2xl border border-border bg-card shadow-2xs divide-y divide-border overflow-hidden">
                        {matchesData.matches.map((match) => {
                            const ad = match.ad;
                            const isSold = ad?.status === "sold";
                            const isUnavailable = !ad || ad.status === "inactive" || ad.status === "removed" || ad.status === "deleted";
                            const targetUrl = match.actionUrl || (match.adId ? `/ads/${match.adId}` : "#");

                            return (
                                <div
                                    key={match.id}
                                    className="p-3.5 sm:p-4 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row gap-3 sm:items-center justify-between"
                                >
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted/60 shrink-0 border border-border/60 flex items-center justify-center">
                                            {ad?.images?.[0] ? (
                                                <img
                                                    src={ad.images[0]}
                                                    alt={ad.title}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImageOff className="h-6 w-6 text-foreground-subtle" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                                                    <Bell className="h-2.5 w-2.5" />
                                                    {match.alertName}
                                                </span>
                                                {isSold ? (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                                        Sold
                                                    </span>
                                                ) : isUnavailable ? (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-muted text-foreground-secondary border border-border shrink-0">
                                                        Listing Removed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                                        Active
                                                    </span>
                                                )}
                                                <span className="text-tiny text-foreground-secondary flex items-center gap-1 ml-auto shrink-0">
                                                    <Calendar className="h-2.5 w-2.5" />
                                                    {formatDate(match.deliveredAt)}
                                                </span>
                                            </div>

                                            <h4 className="font-semibold text-foreground text-body truncate">
                                                {ad ? ad.title : "Listing no longer available"}
                                            </h4>

                                            {ad && (
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption font-semibold text-foreground">
                                                    <span>{formatPrice(ad.price)}</span>
                                                    <span className="text-border hidden sm:inline">•</span>
                                                    <span className="text-tiny font-normal text-foreground-secondary flex items-center gap-0.5 truncate">
                                                        <MapPin className="h-3 w-3 text-foreground-subtle shrink-0" />
                                                        {ad.location?.display || ad.location?.city || "Location on listing"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {ad && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-8 px-3 text-caption font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0 self-start sm:self-center whitespace-nowrap"
                                            onClick={() => onNavigateToAd(targetUrl)}
                                        >
                                            View Listing <ExternalLink className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <Pagination
                        currentPage={matchesData.page}
                        totalPages={matchesData.totalPages}
                        totalItems={matchesData.total}
                        pageSize={4}
                        onPageChange={onPageChange}
                        itemLabel="matches"
                        alwaysShow={false}
                    />
                </div>
            )}
        </div>
    );
}
