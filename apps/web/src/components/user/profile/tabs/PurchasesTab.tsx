import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, StatusChip } from "@esparex/ui";
import { ShoppingCart, FileText, Crown } from "@/icons/IconRegistry";
import { notify } from "@/lib/feedback";
import type { Transaction } from "@/lib/api/user/transactions";

interface PurchasesTabProps {
    purchaseHistory: Transaction[];
    setActiveTab: (tab: string) => void;
    formatDate: (date: string | Date) => string;
    formatCurrency: (amount: number) => string;
    loading?: boolean;
}

const PLAN_DISPLAY_NAMES: Record<string, string> = {
    USER_DEFAULT_PLAN: "Free Plan",
    USER_PREMIUM_PLAN: "Premium Plan",
    BUSINESS_BASIC: "Business Basic",
    BUSINESS_PRO: "Business Pro",
};

export const getPlanDisplayName = (rawName?: string): string => {
    if (!rawName) return "Plan";
    if (PLAN_DISPLAY_NAMES[rawName]) return PLAN_DISPLAY_NAMES[rawName];
    return rawName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export function PurchasesTab({
    purchaseHistory,
    setActiveTab,
    formatDate,
    formatCurrency,
    loading,
}: PurchasesTabProps) {
    const [nowMs, setNowMs] = useState<number | null>(null);

    useEffect(() => {
        void (async () => { setNowMs(Date.now()); })();
    }, []);

    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading History...</div>;
    const successfulOrders = purchaseHistory.filter((purchase) => purchase.status === "SUCCESS").length;
    const pendingOrders = purchaseHistory.filter((purchase) => purchase.status === "INITIATED").length;
    const activeEntitlements = purchaseHistory.filter((purchase) => {
        if (nowMs === null || purchase.status !== "SUCCESS" || !purchase.validUntil) return false;
        return new Date(purchase.validUntil).getTime() > nowMs;
    }).length;

    return (
        <div className="space-y-4">
            {/* Purchases Overview Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 gap-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                        <ShoppingCart className="h-5 w-5 text-purple-600" />
                        My Purchases
                    </CardTitle>
                    <CardDescription>
                        View all your plan purchases and transaction history
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-purple-100/50">
                            <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                {activeEntitlements}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">Active</p>
                        </div>
                        <div className="p-2 rounded-xl bg-blue-100/50">
                            <p className="text-xl sm:text-2xl font-bold text-link">
                                {pendingOrders}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">Pending</p>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-100/50">
                            <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                                {successfulOrders}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">Successful</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchase History */}
            <Card className="gap-0">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Transaction History
                    </CardTitle>
                    <CardDescription>All your purchases including Spotlight Ads, Ad Packs, and Smart Alert Slots</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {purchaseHistory.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No purchases yet</p>
                            <Button
                                onClick={() => setActiveTab("plans")}
                                variant="outline"
                                size="sm"
                                className="mt-3"
                            >
                                Browse Plans
                            </Button>
                        </div>
                    ) : (
                        purchaseHistory.map((purchase) => {
                            const displayAmount = purchase.amount === 0 ? "Free" : formatCurrency(purchase.amount);
                            const planTitle = getPlanDisplayName(purchase.planSnapshot?.name);

                            return (
                                <div key={purchase.id} className="border rounded-xl p-3.5 sm:p-4 hover:bg-gray-50/70 transition-colors">
                                    <div className="flex items-start justify-between gap-3 min-w-0">
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold text-sm text-slate-900 truncate">{planTitle}</h4>
                                                {purchase.status === "SUCCESS" && (
                                                    <StatusChip status="delivered" label="Delivered" />
                                                )}
                                                {purchase.status === "INITIATED" && (
                                                    <StatusChip status="initiated" label="Initiated" />
                                                )}
                                                {purchase.status === "FAILED" && (
                                                    <StatusChip status="failed" label="Failed" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                                <span>Purchased: {formatDate(purchase.createdAt)}</span>
                                                {purchase.validUntil && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Valid Until: {formatDate(purchase.validUntil)}</span>
                                                    </>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 truncate font-mono pt-0.5">Order ID: {purchase.gatewayOrderId || purchase.id}</p>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end justify-between">
                                            <p className="font-bold text-base text-purple-600">{displayAmount}</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs gap-1 px-2.5 mt-2 rounded-lg"
                                                onClick={async () => {
                                                    try {
                                                        const { downloadInvoice } = await import("@/lib/api/user/payments");
                                                        await downloadInvoice(purchase.id);
                                                        notify.success("Invoice opened!");
                                                    } catch {
                                                        notify.error("Failed to open invoice");
                                                    }
                                                }}
                                            >
                                                <FileText className="h-3 w-3" />
                                                Invoice
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>

            {/* Browse Plans CTA */}
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-lg text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Crown className="w-20 h-20 text-white" />
                </div>
                <CardContent className="p-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-base font-bold">Boost Your Presence</h3>
                        <p className="text-blue-100 text-xs">Unlock premium features and reach 10x more buyers</p>
                    </div>
                    <Button
                        onClick={() => setActiveTab("plans")}
                        className="bg-white text-link-dark hover:bg-blue-50 font-bold px-6 h-11 shadow-lg"
                    >
                        Upgrade Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
