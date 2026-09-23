import { useState } from "react";
import {
    Card,
    Button,
    AlertDialog,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    AlertTriangle,
    Clock,
    AlertCircle,
    Edit2,
    XCircle,
    CheckCircle2,
    Trash2,
    type LucideIcon,
} from "@esparex/ui";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";
import { type Business, withdrawBusiness } from "@/lib/api/user/businesses";
import { notify } from "@/lib/feedback";

interface BusinessApplicationStatusProps {
    businessData: Business | null;
    onEditApplication?: () => void;
    navigateToBusinessTab?: () => void;
    onWithdraw?: () => void;
}

interface StatusCardProps {
    badge: { label: string; className: string };
    Icon: LucideIcon;
    iconBgClass: string;
    subtitle: string;
    businessName: string;
    businessCategory?: string;
    children?: React.ReactNode;
    actions: React.ReactNode;
}

const TIMELINE_STEPS = [
    { title: "Submitted", desc: "Docs received", state: "done" },
    { title: "Under Review", desc: "Verifying details", state: "active" },
    { title: "Activation", desc: "24–48h estimate", state: "upcoming" },
] as const;

function StatusCard({
    badge,
    Icon,
    iconBgClass,
    subtitle,
    businessName,
    businessCategory,
    children,
    actions,
}: StatusCardProps) {
    return (
        <Card className="rounded-2xl border border-border shadow-xs bg-card p-3.5 sm:p-4">
            {/* Unified Compact Header: Identity + Badge + Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-border/70">
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
                        <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-body font-bold text-foreground truncate">{businessName}</span>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-tiny font-semibold border shrink-0 ${badge.className}`}>
                                {badge.label}
                            </span>
                            {businessCategory && (
                                <span className="text-tiny text-foreground-secondary hidden sm:inline-block shrink-0 px-2 py-0.5 rounded-md bg-muted/60 border border-border/70">
                                    {businessCategory}
                                </span>
                            )}
                        </div>
                        <p className="text-tiny text-foreground-secondary mt-0.5 truncate">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {actions}
                </div>
            </div>

            {/* Compact Body / Timeline */}
            {children && <div className="mt-2.5">{children}</div>}
        </Card>
    );
}

function WithdrawModal({
    open,
    onOpenChange,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md rounded-2xl bg-card p-5 sm:p-6 shadow-2xl border border-border">
                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive mt-0.5">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="space-y-1.5 text-left min-w-0">
                            <AlertDialogTitle className="text-body-lg sm:text-h4 font-bold text-foreground tracking-tight leading-snug">
                                Withdraw application?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-caption sm:text-body text-foreground-secondary leading-relaxed">
                                Are you sure you want to withdraw your business application? This action cannot be undone.
                            </AlertDialogDescription>
                        </div>
                    </div>

                    <div className="flex flex-row items-center justify-end gap-2.5 pt-2">
                        <AlertDialogCancel className="h-10 flex-1 sm:flex-initial rounded-xl px-4 text-caption sm:text-body font-semibold border-border text-foreground-secondary hover:bg-muted mt-0 cursor-pointer">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={onConfirm}
                            className="h-10 flex-1 sm:flex-initial rounded-xl bg-destructive text-destructive-foreground px-5 text-caption sm:text-body font-semibold hover:bg-destructive/90 shadow-xs cursor-pointer"
                        >
                            Withdraw
                        </AlertDialogAction>
                    </div>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export function BusinessApplicationStatus({
    businessData,
    onEditApplication,
    navigateToBusinessTab,
    onWithdraw,
}: BusinessApplicationStatusProps) {
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const status = businessData ? normalizeBusinessStatus(businessData.status, "none") : "none";
    const businessLabel = businessData?.name || "Pending Business";
    const category = businessData?.businessType ?? businessData?.businessTypes?.[0];

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

    if (businessData && status === "pending") {
        return (
            <div className="max-w-2xl space-y-2.5">
                <WithdrawModal open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog} onConfirm={confirmWithdraw} />
                <StatusCard
                    Icon={Clock}
                    iconBgClass="bg-amber-500/10 text-amber-600"
                    badge={{ label: "Under Review", className: "bg-amber-50 text-amber-700 border-amber-200" }}
                    subtitle="Verification is being reviewed by our team"
                    businessName={businessLabel}
                    businessCategory={category}
                    actions={
                        <>
                            <Button
                                type="button"
                                onClick={onEditApplication}
                                variant="outline"
                                size="sm"
                                disabled={!onEditApplication}
                                className="h-8 px-2.5 rounded-xl border-border text-caption font-semibold gap-1.5 whitespace-nowrap"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit Application
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowWithdrawDialog(true)}
                                variant="outline"
                                size="sm"
                                disabled={isWithdrawing}
                                className="h-8 px-2.5 rounded-xl border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 font-semibold text-caption gap-1.5 whitespace-nowrap"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                {isWithdrawing ? "Withdrawing..." : "Withdraw"}
                            </Button>
                        </>
                    }
                >
                    {/* Horizontal Compact 3-Step Progress */}
                    <div className="p-2.5 rounded-xl border border-border/70 bg-muted/30 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {TIMELINE_STEPS.map((step) => {
                            const IconComponent = step.state === "done" ? CheckCircle2 : step.state === "active" ? Clock : AlertCircle;
                            const iconStyle = step.state === "done"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : step.state === "active"
                                ? "bg-amber-50 text-amber-600 border-amber-300 animate-pulse"
                                : "bg-muted text-foreground-subtle border-border";
                            return (
                                <div key={step.title} className="flex items-center gap-2 min-w-0">
                                    <div className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${iconStyle}`}>
                                        <IconComponent className="h-3 w-3" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-caption font-semibold truncate ${step.state === "active" ? "text-amber-700" : "text-foreground"}`}>
                                            {step.title}
                                        </p>
                                        <p className="text-tiny text-foreground-subtle truncate">{step.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Single-line Notice Callout */}
                    <div className="mt-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/15 flex items-center gap-2 text-tiny text-foreground-secondary">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">
                            Notification sent on approval. Then you can post services & spare parts immediately.
                        </span>
                    </div>
                </StatusCard>
            </div>
        );
    }

    if (businessData && status === "rejected") {
        return (
            <div className="max-w-2xl space-y-2.5">
                <StatusCard
                    Icon={XCircle}
                    iconBgClass="bg-destructive/10 text-destructive"
                    badge={{ label: "Action Required", className: "bg-destructive/10 text-destructive border-destructive/20" }}
                    subtitle="Registration requires updates before approval"
                    businessName={businessLabel}
                    businessCategory={category}
                    actions={
                        <>
                            {navigateToBusinessTab && (
                                <Button
                                    type="button"
                                    onClick={navigateToBusinessTab}
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2.5 rounded-xl border-border text-caption font-semibold whitespace-nowrap"
                                >
                                    Manage Profile
                                </Button>
                            )}
                            <Button
                                type="button"
                                onClick={onEditApplication}
                                size="sm"
                                disabled={!onEditApplication}
                                className="h-8 px-3 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption gap-1.5 whitespace-nowrap"
                            >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit & Resubmit
                            </Button>
                        </>
                    }
                >
                    <div className="p-2.5 rounded-xl border border-destructive/20 bg-destructive/5 text-caption">
                        <span className="font-bold text-destructive mr-1.5">Reason:</span>
                        <span className="text-foreground-secondary">
                            {businessData.rejectionReason || "Documents provided were unclear or incomplete."}
                        </span>
                    </div>
                </StatusCard>
            </div>
        );
    }

    if (businessData && status === "suspended") {
        return (
            <div className="max-w-2xl space-y-2.5">
                <StatusCard
                    Icon={AlertTriangle}
                    iconBgClass="bg-amber-500/10 text-amber-600"
                    badge={{ label: "Suspended", className: "bg-amber-50 text-amber-700 border-amber-200" }}
                    subtitle="Operations have been temporarily halted"
                    businessName={businessLabel}
                    businessCategory={category}
                    actions={
                        <Button
                            type="button"
                            onClick={() => { window.location.href = '/contact'; }}
                            size="sm"
                            className="h-8 px-3.5 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-caption whitespace-nowrap"
                        >
                            Contact Support
                        </Button>
                    }
                >
                    <div className="p-2.5 rounded-xl border border-border/70 bg-muted/40 text-tiny text-foreground-secondary">
                        Your public profile is hidden. Please contact support to restore your account.
                    </div>
                </StatusCard>
            </div>
        );
    }

    return null;
}
