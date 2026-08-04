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
    if (!rawName || rawName === "Plan") return "Free Plan";
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
    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse text-xs">Loading History...</div>;
    const successfulOrders = purchaseHistory.filter((purchase) => purchase.status === "SUCCESS").length;
    const pendingOrders = purchaseHistory.filter((purchase) => purchase.status === "INITIATED").length;
    const activeEntitlements = successfulOrders;

    return (
        <div className="space-y-3">
            {/* Purchases Overview Card */}
            <Card className="bg-gradient-to-br from-purple-50/70 to-pink-50/70 border-purple-200 gap-0">
                <CardHeader className="pb-2 pt-3 px-4 hidden sm:block">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-purple-800">
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                        My Purchases
                    </CardTitle>
                    <CardDescription className="text-xs">
                        View all your plan purchases and transaction history
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 sm:pt-0">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 sm:p-2.5 rounded-xl bg-purple-100/50">
                            <p className="text-lg sm:text-xl font-bold text-purple-700">
                                {activeEntitlements}
                            </p>
                            <p className="text-tiny sm:text-xs text-muted-foreground truncate font-medium">Active</p>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-blue-100/50">
                            <p className="text-lg sm:text-xl font-bold text-link">
                                {pendingOrders}
                            </p>
                            <p className="text-tiny sm:text-xs text-muted-foreground truncate font-medium">Pending</p>
                        </div>
                        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-100/50">
                            <p className="text-lg sm:text-xl font-bold text-emerald-600">
                                {successfulOrders}
                            </p>
                            <p className="text-tiny sm:text-xs text-muted-foreground truncate font-medium">Successful</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchase History */}
            <Card className="gap-0">
                <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <FileText className="h-4 w-4 text-slate-600" />
                        Transaction History
                    </CardTitle>
                    <CardDescription className="text-xs hidden sm:block">All your purchases including Spotlight Ads, Ad Packs, and Smart Alert Slots</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5 p-3 sm:p-4 sm:pt-0">
                    {purchaseHistory.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p className="text-xs">No purchases yet</p>
                            <Button
                                onClick={() => setActiveTab("plans")}
                                variant="outline"
                                size="sm"
                                className="mt-2 h-8 text-xs px-3"
                            >
                                Browse Plans
                            </Button>
                        </div>
                    ) : (
                        purchaseHistory.map((purchase) => {
                            const displayAmount = purchase.amount === 0 ? "Free" : formatCurrency(purchase.amount);
                            const planTitle = getPlanDisplayName(purchase.planSnapshot?.name);

                            return (
                                <div key={purchase.id} className="border rounded-xl p-3 sm:p-3.5 hover:bg-gray-50/80 transition-colors">
                                    <div className="flex items-start justify-between gap-3 min-w-0">
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">{planTitle}</h4>
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
                                            <div className="flex items-center gap-2 text-tiny sm:text-xs text-muted-foreground flex-wrap">
                                                <span>Purchased: {formatDate(purchase.createdAt)}</span>
                                            </div>
                                            <p className="text-tiny text-slate-400 truncate font-mono pt-0.5">Order ID: {purchase.gatewayOrderId || purchase.id}</p>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end justify-between">
                                            <p className="font-extrabold text-sm sm:text-base text-purple-600">{displayAmount}</p>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 sm:h-8 text-tiny sm:text-xs gap-1 px-2.5 mt-1.5 rounded-lg"
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
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-md text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                    <Crown className="w-16 h-16 text-white" />
                </div>
                <CardContent className="p-3.5 sm:p-4 relative z-10 flex flex-row items-center justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold truncate">Boost Your Presence</h3>
                        <p className="text-blue-100 text-tiny sm:text-xs truncate">Unlock premium features & reach 10x more buyers</p>
                    </div>
                    <Button
                        onClick={() => setActiveTab("plans")}
                        className="bg-white text-link-dark hover:bg-blue-50 font-bold px-4 h-8 sm:h-9 text-xs shadow-md shrink-0"
                    >
                        Upgrade Now
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
