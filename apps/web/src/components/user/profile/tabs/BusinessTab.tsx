import { useState } from "react";
import { Card, CardContent } from "@esparex/ui";
import { Button } from "@esparex/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@esparex/ui";
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
} from "@esparex/ui";

import { type Business } from "@/lib/api/user/businesses";
import { resolveListingLocationLabel } from "@/lib/listings/listingPresentation";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { canPublishBusiness } from "@/guards/businessGuards";
import { type UserPage } from "@/lib/routeUtils";
import { BusinessApplicationStatus } from "../BusinessApplicationStatus";
import { BusinessRegistrationPromo } from "./BusinessRegistrationPromo";

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
            <div className="space-y-6">
                {/* Visual Business Profile Card */}
                <Card className="rounded-3xl border border-border shadow-xs overflow-hidden bg-card">
                    <div className="h-24 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative border-b border-border">
                        <div className="absolute -bottom-7 left-6">
                            <div className="h-14 w-14 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center overflow-hidden">
                                {businessData.logo ? (
                                    <img src={businessData.logo} alt={businessData.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Building2 className="h-7 w-7 text-primary" />
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <CardContent className="pt-9 pb-5 px-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-h3 font-bold text-foreground">{businessData.name}</h2>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-caption font-semibold text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified
                                    </span>
                                </div>
                                <p className="text-body text-foreground-secondary mt-1">{businessData.businessType ?? businessData.businessTypes?.[0]}</p>
                            </div>
                            <Button onClick={() => navigateTo("business-edit")} variant="outline" size="sm" className="rounded-xl self-start sm:self-auto border-border">
                                Edit Profile
                            </Button>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-caption sm:text-body text-foreground-secondary">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>{locationLabel || "Location not specified"}</span>
                            </div>
                            <span className="text-foreground-subtle hidden sm:inline">•</span>
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4 text-foreground-subtle shrink-0" />
                                <span>{businessData.mobile}</span>
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
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                                {onDeactivate && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowDeactivateDialog(true)}
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
                                        onClick={() => setShowCloseDialog(true)}
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
                <Card className="rounded-2xl border border-border shadow-xs bg-card p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <Wrench className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-body font-bold text-foreground">Business services</h3>
                                <p className="text-caption text-foreground-secondary mt-0.5">
                                    Manage all your repair and maintenance offerings directly from your listings.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                            <Button 
                                onClick={() => navigateTo("my-services")} 
                                variant="outline" 
                                size="sm" 
                                className="h-8 rounded-xl border-border text-caption font-semibold"
                            >
                                Go to My Services
                            </Button>
                            <Button 
                                onClick={() => navigateTo("post-service")} 
                                size="sm" 
                                className="h-8 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption"
                            >
                                <Plus className="mr-1 h-3.5 w-3.5" />
                                Add Service
                            </Button>
                        </div>
                    </div>
                </Card>

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

                {/* Deactivate Confirmation Dialog */}
                <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
                    <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-h4 font-bold text-foreground">
                                Deactivate Business
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-body text-muted-foreground mt-2 leading-relaxed">
                                Are you sure you want to deactivate your business? Your listings and services will be hidden from public view until you reactivate.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex gap-3 pt-4 sm:justify-end">
                            <AlertDialogCancel disabled={isDeactivating} className="h-10 rounded-xl px-4 font-semibold border-border">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isDeactivating}
                                onClick={(e) => {
                                    e.preventDefault();
                                    void handleConfirmDeactivate();
                                }}
                                className="h-10 rounded-xl px-4 font-semibold border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                            >
                                {isDeactivating ? "Deactivating..." : "Deactivate"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Close Business Confirmation Dialog */}
                <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
                    <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-border">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-h4 font-bold text-destructive">
                                Close Business Permanently
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-body text-muted-foreground mt-2 leading-relaxed">
                                Are you sure you want to permanently close your business? This action cannot be undone and your business account role will be reverted.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex gap-3 pt-4 sm:justify-end">
                            <AlertDialogCancel disabled={isClosing} className="h-10 rounded-xl px-4 font-semibold border-border">
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                disabled={isClosing}
                                onClick={(e) => {
                                    e.preventDefault();
                                    void handleConfirmClose();
                                }}
                                className="h-10 rounded-xl px-4 font-semibold bg-destructive hover:bg-destructive/90 text-white"
                            >
                                {isClosing ? "Closing Business..." : "Close Business"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        );
    }

    return (
        <BusinessRegistrationPromo onRegister={() => navigateTo("business-register")} />
    );
}
