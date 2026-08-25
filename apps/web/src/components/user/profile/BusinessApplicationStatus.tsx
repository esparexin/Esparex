import { PageSection } from "@/components/layout";
import {
    Button,
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction,
    AlertDialogCancel,
} from "@esparex/ui";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Clock, AlertCircle, Edit2, XCircle, CheckCircle2, Trash2, type LucideIcon } from "@/icons/IconRegistry";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { type Business, withdrawBusiness } from "@/lib/api/user/businesses";
import { notify } from "@/lib/feedback";
import { useState } from "react";

interface BusinessApplicationStatusProps {
    businessData: Business | null;
    onEditApplication?: () => void;
    navigateToBusinessTab?: () => void;
    onWithdraw?: () => void;
}

interface StatusCardProps {
    cardClass: string;
    iconBgClass: string;
    Icon: LucideIcon;
    titleClass?: string;
    title: string;
    description: string;
    businessName: string;
    businessNameAppended?: React.ReactNode;
    children?: React.ReactNode;
    actions: React.ReactNode;
}

function StatusCard({
    cardClass, iconBgClass, Icon, titleClass, title, description, businessName, businessNameAppended, children, actions
}: StatusCardProps) {
    return (
        <PageSection
            variant="bordered"
            className={`bg-gradient-to-br ${cardClass}`}
            title={
                <div className="flex items-center gap-2.5">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${iconBgClass} shrink-0`}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className={`text-base sm:text-lg font-bold ${titleClass || ''}`}>{title}</span>
                    </div>
                </div>
            }
            subtitle={description}
        >
            <div className="bg-card rounded-xl p-4 border border-border mb-4">
                <p className="font-medium text-caption text-foreground-subtle uppercase tracking-wider mb-1">Business Name:</p>
                <p className={`text-body-lg font-bold text-foreground ${businessNameAppended ? 'mb-3' : ''}`}>
                    {businessName}
                </p>
                {businessNameAppended}
            </div>
            {children}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {actions}
            </div>
        </PageSection>
    );
}

export function BusinessApplicationStatus({
    businessData,
    onEditApplication,
    navigateToBusinessTab,
    onWithdraw
}: BusinessApplicationStatusProps) {
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const businessDataStatus = businessData
        ? normalizeBusinessStatus(businessData.status, "pending")
        : "pending";
    const businessLabel = businessData?.name || "Pending Business";

    const confirmWithdraw = async () => {
        setIsWithdrawing(true);
        setShowWithdrawDialog(false);
        try {
            await withdrawBusiness();
            notify.success("Business application withdrawn successfully");
            onWithdraw?.();
        } catch {
            notify.error("Failed to withdraw application");
        } finally {
            setIsWithdrawing(false);
        }
    };

    let cardContent: React.ReactNode = null;

    if (businessDataStatus === "pending") {
        cardContent = (
            <StatusCard
                cardClass="from-yellow-50 to-amber-50 border border-yellow-200"
                iconBgClass="bg-yellow-600"
                Icon={AlertTriangle}
                title="Business Verification Pending"
                description="Your application is under review"
                businessName={businessLabel}
                actions={
                    <>
                        <Button
                            onClick={onEditApplication}
                            variant="outline"
                            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            disabled={!onEditApplication}
                        >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Application
                        </Button>
                        <Button
                            onClick={() => setShowWithdrawDialog(true)}
                            variant="outline"
                            disabled={isWithdrawing}
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isWithdrawing ? "Withdrawing..." : "Withdraw Application"}
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 mb-4">
                    <h4 className="font-semibold text-sm">Verification Status:</h4>
                    <div className="space-y-2">
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Submitted</p>
                                <p className="text-xs text-muted-foreground">Application received successfully</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0 animate-pulse">
                                <Clock className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium">Under Review</p>
                                <p className="text-xs text-muted-foreground">Our team is verifying your details</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-muted-foreground">Approval Pending</p>
                                <p className="text-xs text-muted-foreground">Usually takes 24-48 hours</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-link-dark mb-4">
                    <p className="font-medium mb-1">What happens next?</p>
                    <p className="text-xs">You&apos;ll receive a notification once your business is verified. After approval, you can start adding services and managing your business profile.</p>
                </div>
            </StatusCard>
        );
    } else if (businessData && businessDataStatus === "rejected") {
        cardContent = (
            <StatusCard
                cardClass="from-red-50 to-rose-50 border border-red-200"
                iconBgClass="bg-red-600"
                Icon={XCircle}
                titleClass="text-red-900"
                title="Business Verification Not Approved"
                description="Your application needs attention"
                businessName={businessLabel}
                businessNameAppended={
                    <>
                        <Separator className="my-3" />
                        <p className="font-medium mb-1 text-red-900">Reason for Rejection:</p>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                            <p className="text-sm text-red-700">
                                {businessData.rejectionReason || "The business documents provided were unclear or incomplete. Please ensure all required documents are legible and match the business information provided."}
                            </p>
                        </div>
                    </>
                }
                actions={
                    <>
                        {navigateToBusinessTab && (
                            <Button
                                onClick={navigateToBusinessTab}
                                variant="outline"
                                className="w-full text-red-700 border-red-200 hover:bg-red-50"
                            >
                                Manage Business Profile
                            </Button>
                        )}
                        <Button
                            onClick={onEditApplication}
                            className="w-full bg-green-600 hover:bg-green-700 gap-2"
                            disabled={!onEditApplication}
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit & Resubmit
                        </Button>
                    </>
                }
            >
                <div className="space-y-3 mb-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-link-dark">
                        <p className="font-medium mb-1">What you can do:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                            <li>Review the rejection reason carefully</li>
                            <li>Update your business information</li>
                            <li>Upload clear, valid documents</li>
                            <li>Resubmit your application</li>
                        </ul>
                    </div>
                </div>
            </StatusCard>
        );
    } else if (businessData && businessDataStatus === "suspended") {
        cardContent = (
            <StatusCard
                cardClass="from-orange-50 to-amber-50 border border-orange-200"
                iconBgClass="bg-orange-600"
                Icon={AlertTriangle}
                titleClass="text-orange-900"
                title="Business Account Suspended"
                description="Your business operations have been temporarily halted"
                businessName={businessLabel}
                actions={
                    <Button
                        onClick={() => window.location.href = '/contact'}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        Contact Support
                    </Button>
                }
            >
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-700 mb-4">
                    <p className="font-medium mb-1">What this means:</p>
                    <p className="text-xs">Your public store is hidden and you currently cannot post new services or receive customer inquiries. Please contact admin support to resolve any outstanding issues and restore your account.</p>
                </div>
            </StatusCard>
        );
    } else if (businessData && businessDataStatus === "deleted") {
        cardContent = (
            <StatusCard
                cardClass="from-muted/40 to-muted border border-border"
                iconBgClass="bg-gray-600"
                Icon={Clock}
                titleClass="text-foreground"
                title="Business Profile Expired/Deleted"
                description="Your registration validity has concluded or account was deleted"
                businessName={businessLabel}
                actions={
                    <>
                        {navigateToBusinessTab && (
                            <Button
                                onClick={navigateToBusinessTab}
                                variant="outline"
                                className="w-full text-foreground-secondary border-border hover:bg-muted"
                            >
                                Manage Profile
                            </Button>
                        )}
                        <Button
                            onClick={onEditApplication}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                            disabled={!onEditApplication}
                        >
                            Renew Registration
                        </Button>
                    </>
                }
            >
                <div className="bg-muted border border-border rounded-lg p-3 text-body text-foreground-secondary mb-4">
                    <p className="font-medium mb-1">Action Required:</p>
                    <p className="text-caption">Your business registration has reached its expiry date. Your profile and services are currently offline. You must renew or re-verify your registration to continue operations.</p>
                </div>
            </StatusCard>
        );
    }

    if (!cardContent) {
        return null;
    }

    return (
        <>
            <AlertDialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
                <AlertDialogContent className="max-w-md rounded-2xl bg-card p-6 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-h4 font-bold text-foreground">
                            Withdraw Business Application?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-body text-muted-foreground mt-2">
                            Are you sure you want to withdraw your business application? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-3 pt-4 sm:justify-end">
                        <AlertDialogCancel className="h-10 rounded-xl px-4 font-medium border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmWithdraw}
                            className="h-10 rounded-xl bg-destructive text-destructive-foreground font-medium hover:bg-destructive/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                            Withdraw
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            {cardContent}
        </>
    );
}
