import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, FileText, Crown } from "lucide-react";
import { notify } from "@/lib/notify";
import type { Transaction } from "@/lib/api/user/transactions";

interface PurchasesTabProps {
    purchaseHistory: Transaction[];
    setActiveTab: (tab: string) => void;
    formatDate: (date: string | Date) => string;
    formatCurrency: (amount: number) => string;
    loading?: boolean;
}

export function PurchasesTab({
    purchaseHistory,
    setActiveTab,
    formatDate,
    formatCurrency,
    loading,
}: PurchasesTabProps) {
    if (loading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Loading History...</div>;
    const successfulOrders = purchaseHistory.filter((purchase) => purchase.status === "SUCCESS").length;
    const pendingOrders = purchaseHistory.filter((purchase) => purchase.status === "INITIATED").length;
    const activeEntitlements = purchaseHistory.filter((purchase) => {
        if (purchase.status !== "SUCCESS" || !purchase.validUntil) return false;
        return new Date(purchase.validUntil).getTime() > Date.now();
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
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-purple-600">
                                {activeEntitlements}
                            </p>
                            <p className="text-xs text-muted-foreground">Active Entitlements</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-link">
                                {pendingOrders}
                            </p>
                            <p className="text-xs text-muted-foreground">Pending Orders</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-600">
                                {successfulOrders}
                            </p>
                            <p className="text-xs text-muted-foreground">Successful Orders</p>
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
                        purchaseHistory.map((purchase) => (
                            <div key={purchase.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm">{purchase.planSnapshot?.name || "Premium Plan"}</h4>
                                            {purchase.status === "SUCCESS" && (
                                                <Badge className="bg-blue-600 text-white text-xs rounded-full px-2">Delivered</Badge>
                                            )}
                                            {purchase.status === "INITIATED" && (
                                                <Badge className="bg-amber-500 text-white text-xs rounded-full px-2">Initiated</Badge>
                                            )}
                                            {purchase.status === "FAILED" && (
                                                <Badge variant="destructive" className="text-xs">Failed</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Order ID: {purchase.gatewayOrderId || purchase.id}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>Purchased: {formatDate(purchase.createdAt)}</span>
                                            {purchase.validUntil && (
                                                <>
                                                    <span>•</span>
                                                    <span>Valid Until: {formatDate(purchase.validUntil)}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-purple-600">{formatCurrency(purchase.amount)}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-11 text-xs gap-1"
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
                            </div>
                        ))
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
