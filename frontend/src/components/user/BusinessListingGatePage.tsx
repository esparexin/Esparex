"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useBusiness } from "@/hooks/useBusiness";
import { Button } from "@/components/ui/button";
import { normalizeBusinessStatus } from "@/lib/status/statusNormalization";

interface BusinessListingGatePageProps {
    listingTypeLabel: string;
    children: ReactNode;
    contentContainerClassName: string;
}

export function BusinessListingGatePage({
    listingTypeLabel,
    children,
    contentContainerClassName,
}: BusinessListingGatePageProps) {
    const router = useRouter();
    const { user } = useAuth();
    const { businessData, isLoading, isFetched } = useBusiness(user, undefined, {
        includeStats: false,
    });

    if (isLoading || !isFetched) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-muted-foreground font-medium">Checking business verification...</div>
            </div>
        );
    }

    const isLive = normalizeBusinessStatus(businessData?.status, "pending") === "live";
    if (!isLive) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-6">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground">Business Verification Required</h1>
                    <p className="text-slate-600">
                        Only admin-verified business accounts can post {listingTypeLabel}. Your account is{" "}
                        <strong>{businessData?.status ?? "not registered"}</strong>.
                    </p>
                    <Button
                        onClick={() => router.push("/account/business")}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold"
                    >
                        Go to Business Hub
                    </Button>
                </div>
            </div>
        );
    }

    return <div className={contentContainerClassName}>{children}</div>;
}
