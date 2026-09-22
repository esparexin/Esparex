"use client";

import { 
    Clock, 
    XCircle, 
    AlertTriangle, 
    ArrowRight
} from "@esparex/ui";
import { Button } from "@esparex/ui";

import type { BusinessStatusValue } from "@esparex/contracts";

interface BusinessStatusBannerProps {
    status: BusinessStatusValue;
    rejectionReason?: string;
    onAction?: () => void;
}

export function BusinessStatusBanner({ status, rejectionReason, onAction }: BusinessStatusBannerProps) {
    if (status === 'live') return null;

    const config = {
        pending: {
            icon: <Clock className="w-4 h-4 text-warning shrink-0" />,
            bg: "bg-warning/10 border-warning/20 shadow-xs",
            title: "Application Pending Review",
            description: "Moderation team is verifying your business documents (24-48h).",
            actionLabel: "View Application",
            textColor: "text-warning"
        },
        rejected: {
            icon: <XCircle className="w-4 h-4 text-destructive shrink-0" />,
            bg: "bg-destructive/10 border-destructive/20 shadow-xs",
            title: "Application Rejected",
            description: rejectionReason || "Application did not meet verification criteria. Please review and resubmit.",
            actionLabel: "Resubmit",
            textColor: "text-destructive"
        },
        suspended: {
            icon: <AlertTriangle className="w-4 h-4 text-warning shrink-0" />,
            bg: "bg-warning/10 border-warning/20 shadow-xs",
            title: "Account Suspended",
            description: "Your business account has been suspended. Contact support for assistance.",
            actionLabel: "Support",
            textColor: "text-warning"
        }
    };

    const current = config[status as keyof typeof config];
    if (!current) return null;

    return (
        <aside 
            role="status" 
            aria-live="polite"
            className={`mb-3 sm:mb-4 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border ${current.bg} flex items-center justify-between gap-2.5 transition-all animate-in fade-in slide-in-from-top-2 duration-300`}
        >
            <div className="flex items-center gap-2 min-w-0 flex-1">
                {current.icon}
                <div className="min-w-0 flex items-baseline gap-1.5 truncate">
                    <span className={`font-semibold text-caption shrink-0 ${current.textColor}`}>
                        {current.title}
                    </span>
                    <span className="text-caption text-foreground-secondary hidden sm:inline truncate">
                        — {current.description}
                    </span>
                </div>
            </div>
            {onAction && (
                <Button 
                    onClick={onAction}
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2.5 text-caption font-medium rounded-lg bg-card/90 hover:bg-card text-foreground border border-border/80 shadow-2xs flex items-center gap-1 shrink-0 group transition-all"
                >
                    <span>{current.actionLabel}</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Button>
            )}
        </aside>
    );
}
