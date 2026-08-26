import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@esparex/ui";
import { PageSection } from "@/components/layout";
import {
    Building2,
    CheckCircle2,
    Globe,
    Mail,
    MapPin,
    Phone,
    Wrench,
    Power,
    PowerOff,
    LogOut,
    RefreshCw,
    Plus,
} from "@/icons/IconRegistry";

import { type Business } from "@/lib/api/user/businesses";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";
import { BusinessRegistrationPromo } from "./BusinessRegistrationPromo";

interface BusinessTabProps {
    businessData: Business | null;
    businessStats?: { totalServices: number; approvedServices: number; pendingServices: number; views: number };
    isLoading?: boolean;
    isFetched?: boolean;
    navigateTo: (page: string, adId?: string | number, category?: string, sellerIdOrBusinessId?: string) => void;
    onDeactivate?: () => Promise<void>;
    onReactivate?: () => Promise<void>;
    onClose?: () => Promise<void>;
    onRenew?: (id: string) => Promise<unknown>;
}

export function BusinessTab({
    businessData,
    businessStats: _businessStats,
    isLoading,
    isFetched,
    navigateTo,
    onDeactivate,
    onReactivate,
    onClose,
    onRenew,
}: BusinessTabProps) {
    if (isLoading && !isFetched) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-48 rounded-3xl bg-muted" />
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 rounded-2xl bg-muted" />
                    ))}
                </div>
            </div>
        );
    }

    const status = businessData
        ? normalizeBusinessStatus(businessData.status, "pending")
        : "pending";
    const locationLabel = resolveListingLocationLabel(businessData?.location, "full");

    if (businessData && (status === "live" || status === "active")) {
        return (
            <div className="space-y-4 sm:space-y-5">
                <Card className="rounded-none sm:rounded-2xl border-0 sm:border border-border bg-transparent sm:bg-card shadow-none sm:shadow-xs">
                    <CardContent className="p-0 sm:p-5 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-body-lg sm:text-h4 font-bold text-foreground truncate">{businessData.name}</h2>
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-tiny font-semibold uppercase tracking-wide text-emerald-700">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Verified
                                        </span>
                                    </div>
                                    <p className="text-caption text-foreground-subtle truncate mt-0.5">
                                        Keep your business profile accurate so customers can find, trust, and contact you.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <Button
                                    size="sm"
                                    onClick={() => navigateTo("profile-settings-business")}
                                    className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-3.5 shadow-xs"
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => navigateTo("public-profile", undefined, undefined, businessData.slug || businessData.id)}
                                    variant="outline"
                                    className="h-9 rounded-xl border-border text-foreground-secondary hover:bg-muted font-semibold text-caption px-3.5"
                                >
                                    View Store
                                </Button>
                            </div>
                        </div>

                        {/* Normal Inline Info Metadata Row (Replacing Pill-Style Boxes) */}
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 border-t border-border text-caption text-foreground-secondary font-medium">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>{locationLabel || "Location not available"}</span>
                            </div>
                            <span className="text-foreground-subtle hidden sm:inline">•</span>
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>+91 {businessData.mobile}</span>
                            </div>
                            <span className="text-foreground-subtle hidden sm:inline">•</span>
                            <div className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>{businessData.email}</span>
                            </div>
                            <span className="text-foreground-subtle hidden sm:inline">•</span>
                            <div className="flex items-center gap-1.5">
                                <Globe className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>{businessData.website || "Website not added"}</span>
                            </div>
                        </div>

                        {/* Styled Action Buttons for Deactivate & Close Business */}
                        {(onDeactivate || onClose) && (
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                                {onDeactivate && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to deactivate your business? Your listings will be hidden.")) {
                                                await onDeactivate();
                                            }
                                        }}
                                        className="h-8 border-amber-300 text-amber-700 bg-amber-50/50 hover:bg-amber-100 font-semibold text-caption rounded-xl gap-1.5"
                                    >
                                        <PowerOff className="h-3.5 w-3.5" />
                                        Deactivate
                                    </Button>
                                )}
                                {onClose && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to PERMANENTLY CLOSE your business? This action cannot be undone and your role will be reverted.")) {
                                                await onClose();
                                            }
                                        }}
                                        className="h-8 border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 font-semibold text-caption rounded-xl gap-1.5 ml-auto"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Close Business
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Streamlined Business Services Section */}
                <PageSection
                    variant="bordered"
                    title={
                        <div className="flex items-center gap-2 text-body sm:text-body-lg font-bold text-foreground">
                            <Wrench className="h-4.5 w-4.5 text-primary" />
                            <span>Business services</span>
                        </div>
                    }
                >
                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
                        <Button
                            onClick={() => navigateTo("post-service")}
                            size="sm"
                            className="h-9 rounded-xl bg-primary px-4 font-semibold text-caption hover:bg-primary/90 text-primary-foreground shadow-xs gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Post Service
                        </Button>
                        <Button
                            onClick={() => navigateTo("post-ad")}
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl px-4 font-semibold text-caption border-border text-foreground-secondary hover:bg-muted gap-1.5"
                        >
                            <Plus className="h-4 w-4 text-foreground-subtle" />
                            Post Spare Part
                        </Button>
                        <Button
                            onClick={() => navigateTo("my-services")}
                            size="sm"
                            variant="outline"
                            className="h-9 rounded-xl px-4 font-semibold text-caption border-border text-foreground-secondary hover:bg-muted"
                        >
                            Edit Services, Listings, Spare Parts
                        </Button>
                    </div>
                </PageSection>
            </div>
        );
    }

    if (businessData) {
        return (
            <div className="space-y-4">
                <BusinessApplicationStatus
                    businessData={businessData}
                    onEditApplication={() => navigateTo("profile-settings-business")}
                    onWithdraw={() => navigateTo("business-register")}
                />

                {(status === "deactivated" || status === "expired") && (
                    <PageSection
                        variant="bordered"
                        className="border-dashed border-2"
                        title="Resume Business Operations"
                        subtitle={
                            status === "deactivated" 
                                ? "Your business is currently hidden. Reactivate it to start showing your listings again."
                                : "Your business subscription has expired. Renew it to continue using premium features."
                        }
                    >
                        <div className="flex items-center gap-2.5 sm:gap-3 pt-2">
                            {status === "deactivated" && onReactivate && (
                                <Button onClick={onReactivate} size="sm" className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-semibold text-caption px-4">
                                    <Power className="mr-1.5 h-3.5 w-3.5" />
                                    Reactivate Now
                                </Button>
                            )}
                            {status === "expired" && onRenew && (
                                <Button onClick={() => onRenew(businessData.id)} size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-4">
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Renew Subscription
                                </Button>
                            )}
                        </div>
                    </PageSection>
                )}
            </div>
        );
    }

    return (
        <BusinessRegistrationPromo onRegister={() => navigateTo("business-register")} />
    );
}
