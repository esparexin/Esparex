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
    businessStats,
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
                        <div key={i} className="h-24 rounded-2xl bg-muted" />
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
                    <CardContent className="p-0 sm:p-6 space-y-4 sm:space-y-5">
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

                        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 pt-3 border-t border-border">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                                <MapPin className="h-4 w-4 shrink-0 text-foreground-subtle" />
                                <span className="text-caption text-foreground-secondary truncate">
                                    {locationLabel || "Location not available"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                                <Phone className="h-4 w-4 shrink-0 text-foreground-subtle" />
                                <span className="text-caption text-foreground-secondary truncate">
                                    +91 {businessData.mobile}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                                <Mail className="h-4 w-4 shrink-0 text-foreground-subtle" />
                                <span className="text-caption text-foreground-secondary truncate">{businessData.email}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
                                <Globe className="h-4 w-4 shrink-0 text-foreground-subtle" />
                                <span className="text-caption text-foreground-secondary truncate">{businessData.website || "Website not added"}</span>
                            </div>
                        </div>

                        {(onDeactivate || onClose) && (
                            <div className="flex items-center justify-between pt-2 border-t border-border text-caption">
                                {onDeactivate && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to deactivate your business? Your listings will be hidden.")) {
                                                await onDeactivate();
                                            }
                                        }}
                                        className="text-foreground-subtle hover:text-amber-600 transition-colors inline-flex items-center gap-1 font-medium"
                                    >
                                        <PowerOff className="h-3.5 w-3.5" />
                                        Deactivate
                                    </button>
                                )}
                                {onClose && (
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to PERMANENTLY CLOSE your business? This action cannot be undone and your role will be reverted.")) {
                                                await onClose();
                                            }
                                        }}
                                        className="text-foreground-subtle hover:text-destructive transition-colors inline-flex items-center gap-1 font-medium ml-auto"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Close Business
                                    </button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                        <p className="text-tiny uppercase font-bold text-foreground-subtle tracking-wider">Total Services</p>
                        <p className="mt-1 text-xl sm:text-2xl font-black text-foreground">{businessStats?.totalServices ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                        <p className="text-tiny uppercase font-bold text-foreground-subtle tracking-wider">Approved</p>
                        <p className="mt-1 text-xl sm:text-2xl font-black text-emerald-600">{businessStats?.approvedServices ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                        <p className="text-tiny uppercase font-bold text-foreground-subtle tracking-wider">Pending</p>
                        <p className="mt-1 text-xl sm:text-2xl font-black text-amber-600">{businessStats?.pendingServices ?? 0}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-3.5 shadow-xs">
                        <p className="text-tiny uppercase font-bold text-foreground-subtle tracking-wider">Profile Views</p>
                        <p className="mt-1 text-xl sm:text-2xl font-black text-primary">{businessStats?.views ?? 0}</p>
                    </div>
                </div>

                <PageSection
                    variant="bordered"
                    title={
                        <div className="flex items-center gap-2 text-body sm:text-body-lg font-bold text-foreground">
                            <Wrench className="h-4.5 w-4.5 text-primary" />
                            <span>Business services</span>
                        </div>
                    }
                    subtitle="Post new service listings or manage the ones already attached to your business."
                >
                    <div className="flex items-center gap-2.5 sm:gap-3 pt-1">
                        <Button
                            onClick={() => navigateTo("post-service")}
                            size="sm"
                            className="flex-1 sm:flex-initial h-9 rounded-xl bg-primary px-4 font-semibold text-caption hover:bg-primary/90 text-primary-foreground shadow-xs"
                        >
                            Post Service
                        </Button>
                        <Button
                            onClick={() => navigateTo("my-services")}
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-initial h-9 rounded-xl px-4 font-semibold text-caption border-border text-foreground-secondary hover:bg-muted"
                        >
                            Manage Services & Parts
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
