import { useState } from "react";
import { Button } from "@esparex/ui";
import { PageSection } from "@/components/layout";
import { Power, RefreshCw } from "@esparex/ui";

import { type Business } from "@/lib/api/user/businesses";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canPublishBusiness } from "@/guards/businessGuards";
import { type UserPage } from "@/lib/routeUtils";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";
import { BusinessRegistrationPromo } from "./BusinessRegistrationPromo";
import { BusinessProfileCard } from "./BusinessProfileCard";
import { BusinessOperationsHub } from "./BusinessOperationsHub";
import { BusinessLifecycleDialogs } from "./BusinessLifecycleDialogs";

interface BusinessTabProps {
    businessData: Business | null;
    businessStats?: { totalServices: number; approvedServices: number; pendingServices: number; views: number };
    isLoading?: boolean;
    isFetched?: boolean;
    navigateTo: (page: UserPage, adId?: string | number, category?: string, sellerIdOrBusinessId?: string) => void;
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
    const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const handleConfirmDeactivate = async () => {
        if (!onDeactivate) return;
        setIsDeactivating(true);
        try {
            await onDeactivate();
            setShowDeactivateDialog(false);
        } finally {
            setIsDeactivating(false);
        }
    };

    const handleConfirmClose = async () => {
        if (!onClose) return;
        setIsClosing(true);
        try {
            await onClose();
            setShowCloseDialog(false);
        } finally {
            setIsClosing(false);
        }
    };

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
    const isLive = canPublishBusiness(businessData?.status);
    const locationLabel = resolveListingLocationLabel(businessData?.location, "full");

    if (status === "pending" || status === "rejected") {
        return (
            <BusinessApplicationStatus
                businessData={businessData}
                onEditApplication={() => navigateTo("business-edit")}
                navigateToBusinessTab={() => navigateTo("business-register")}
            />
        );
    }

    if (businessData) {
        return (
            <div className="max-w-2xl space-y-3.5">
                {/* Visual Business Profile Card */}
                <BusinessProfileCard
                    businessData={businessData}
                    locationLabel={locationLabel}
                    navigateTo={navigateTo}
                    hasDeactivate={Boolean(onDeactivate)}
                    hasClose={Boolean(onClose)}
                    onOpenDeactivate={() => setShowDeactivateDialog(true)}
                    onOpenClose={() => setShowCloseDialog(true)}
                />

                {/* Operations Hub: Services & Spare Parts Cards */}
                <BusinessOperationsHub navigateTo={navigateTo} />

                {/* Account Status / Lifecycle Alerts */}
                {!isLive && (
                    <PageSection variant="bordered" title="Business Account Status" className="bg-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-body font-bold capitalize text-foreground">{status}</p>
                                <p className="text-caption text-foreground-secondary mt-0.5">
                                    {status === "deactivated" 
                                        ? "Your business is currently inactive. Re-activate to resume listings and services." 
                                        : status === "expired"
                                        ? "Your subscription has lapsed. Renew to restore premium benefits."
                                        : "Your business is currently suspended."}
                                </p>
                            </div>
                            {status === "deactivated" && onReactivate && (
                                <Button onClick={onReactivate} size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-4 cursor-pointer">
                                    <Power className="mr-1.5 h-3.5 w-3.5" />
                                    Reactivate Now
                                </Button>
                            )}
                            {status === "expired" && onRenew && (
                                <Button onClick={() => onRenew(businessData.id)} size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption px-4 cursor-pointer">
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                    Renew Subscription
                                </Button>
                            )}
                        </div>
                    </PageSection>
                )}

                {/* Lifecycle Dialogs */}
                <BusinessLifecycleDialogs
                    showDeactivateDialog={showDeactivateDialog}
                    setShowDeactivateDialog={setShowDeactivateDialog}
                    isDeactivating={isDeactivating}
                    onConfirmDeactivate={handleConfirmDeactivate}
                    showCloseDialog={showCloseDialog}
                    setShowCloseDialog={setShowCloseDialog}
                    isClosing={isClosing}
                    onConfirmClose={handleConfirmClose}
                />
            </div>
        );
    }

    return (
        <BusinessRegistrationPromo onRegister={() => navigateTo("business-register")} />
    );
}
