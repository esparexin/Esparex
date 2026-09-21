"use client";

import { Card, Button } from "@esparex/ui";
import {
    Building2,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    PowerOff,
    LogOut,
} from "@esparex/ui";
import type { Business } from "@/lib/api/user/businesses";
import type { UserPage } from "@/lib/routeUtils";

export interface BusinessProfileCardProps {
    businessData: Business;
    locationLabel: string;
    navigateTo: (page: UserPage) => void;
    hasDeactivate: boolean;
    hasClose: boolean;
    onOpenDeactivate: () => void;
    onOpenClose: () => void;
}

export function BusinessProfileCard({
    businessData,
    locationLabel,
    navigateTo,
    hasDeactivate,
    hasClose,
    onOpenDeactivate,
    onOpenClose,
}: BusinessProfileCardProps) {
    return (
        <Card className="rounded-2xl border border-border shadow-xs bg-card p-4">
            {/* Business Identity Row */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="h-11 w-11 rounded-xl bg-muted border border-border shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                        {businessData.logo ? (
                            <img src={businessData.logo} alt={businessData.name} className="h-full w-full object-cover" />
                        ) : (
                            <Building2 className="h-5 w-5 text-primary" />
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-body-lg font-bold text-foreground truncate">{businessData.name}</h2>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-tiny font-semibold shrink-0">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Verified
                            </span>
                        </div>
                        <p className="text-caption text-foreground-secondary truncate">
                            {businessData.businessType ?? businessData.businessTypes?.[0]}
                        </p>
                    </div>
                </div>
                <Button 
                    onClick={() => navigateTo("business-edit")} 
                    variant="outline" 
                    size="sm" 
                    className="rounded-xl border-border text-caption font-semibold h-8 px-3 shrink-0 whitespace-nowrap cursor-pointer"
                >
                    Edit Profile
                </Button>
            </div>

            {/* Compact Metadata Row */}
            <div className="mt-3 pt-2.5 border-t border-border/70 flex flex-wrap items-center gap-y-1 gap-x-2.5 text-tiny text-foreground-secondary">
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-foreground-subtle shrink-0" />
                    <span>{locationLabel || "Location not specified"}</span>
                </div>
                <span className="text-foreground-subtle hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-foreground-subtle shrink-0" />
                    <span>{businessData.mobile}</span>
                </div>
                <span className="text-foreground-subtle hidden sm:inline">•</span>
                <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3 text-foreground-subtle shrink-0" />
                    <span>{businessData.email}</span>
                </div>
                {businessData.website && (
                    <>
                        <span className="text-foreground-subtle hidden sm:inline">•</span>
                        <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-foreground-subtle shrink-0" />
                            <span>{businessData.website}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Account Lifecycle Actions */}
            {(hasDeactivate || hasClose) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 mt-3 border-t border-border/70">
                    <span className="text-tiny text-foreground-subtle font-medium">
                        Account status
                    </span>
                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                        {hasDeactivate && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenDeactivate}
                                className="h-8 border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-semibold text-caption rounded-xl gap-1.5 px-3 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                                <PowerOff className="h-3.5 w-3.5" />
                                Deactivate
                            </Button>
                        )}
                        {hasClose && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onOpenClose}
                                className="h-8 border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 font-semibold text-caption rounded-xl gap-1.5 px-3 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                                <LogOut className="h-3.5 w-3.5" />
                                Close Business
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}
