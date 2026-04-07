"use client";

import { 
    Clock, 
    XCircle, 
    AlertTriangle, 
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessStatusBannerProps {
    status: 'pending' | 'live' | 'rejected' | 'suspended' | 'deleted';
    rejectionReason?: string;
    onAction?: () => void;
}

export function BusinessStatusBanner({ status, rejectionReason, onAction }: BusinessStatusBannerProps) {
    if (status === 'live') return null;

    const config = {
        pending: {
            icon: <Clock className="w-5 h-5 text-amber-600" />,
            bg: "bg-amber-50 border-amber-200 shadow-amber-100/50",
            title: "Application Pending Review",
            description: "Our moderation team is verifying your business documents. This typically takes 24-48 hours.",
            actionLabel: "View Application",
            textColor: "text-amber-900"
        },
        rejected: {
            icon: <XCircle className="w-5 h-5 text-red-600" />,
            bg: "bg-red-50 border-red-200 shadow-red-100/50",
            title: "Application Rejected",
            description: rejectionReason || "Your application did not meet our verification criteria. Please review and resubmit.",
            actionLabel: "Update & Resubmit",
            textColor: "text-red-900"
        },
        suspended: {
            icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
            bg: "bg-orange-50 border-orange-200 shadow-orange-100/50",
            title: "Business Account Suspended",
            description: "Your account has been suspended due to a policy violation or expired documents. Contact support for assistance.",
            actionLabel: "Contact Support",
            textColor: "text-orange-900"
        }
    };

    const current = config[status as keyof typeof config];
    if (!current) return null;

    return (
        <div className={`mb-6 p-4 rounded-2xl border ${current.bg} shadow-lg transition-all animate-in fade-in slide-in-from-top-4 duration-500`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    {current.icon}
                </div>
                <div className="flex-1 space-y-1">
                    <h3 className={`font-bold text-sm ${current.textColor}`}>{current.title}</h3>
                    <p className="text-xs text-foreground-tertiary leading-relaxed max-w-2xl">
                        {current.description}
                    </p>
                </div>
                {onAction && (
                    <Button 
                        onClick={onAction}
                        size="sm"
                        className="bg-white hover:bg-slate-50 text-foreground border border-slate-200 shadow-sm text-xs font-bold px-4 h-9 rounded-xl flex items-center gap-2 group shrink-0"
                    >
                        {current.actionLabel}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                )}
            </div>
        </div>
    );
}
