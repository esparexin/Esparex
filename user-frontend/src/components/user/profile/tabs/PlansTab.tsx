import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Package } from "lucide-react";
import { PlanFeatureList } from "@/components/user/profile/PlanFeatureList";
import type { ProfilePlan, ProfilePlanType } from "../types";

type PlanCard = Omit<ProfilePlan, "type"> & { type: string };

interface PlansTabProps {
    dynamicPlans: PlanCard[];
    currentPlan: string;
    setSelectedPlan: (id: string) => void;
    setShowPlanDialog: (show: boolean) => void;
    formatCurrency: (amount: number) => string;
}

export function PlansTab({
    dynamicPlans,
    currentPlan,
    setSelectedPlan,
    setShowPlanDialog,
    formatCurrency,
}: PlansTabProps) {
    const isProfilePlanType = (value: string): value is ProfilePlanType => {
        return value === "Spotlight" || value === "More Ads" || value === "Alert Slots";
    };

    const plansToDisplay = dynamicPlans;

    const renderPlanGrid = (type: ProfilePlanType, title: string, description: string, icon: React.ReactNode, colorClass: string) => (
        <div>
            <div className="mb-3">
                <h3 className="font-bold flex items-center gap-2">
                    {icon}
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plansToDisplay
                    .filter((p) => isProfilePlanType(p.type) && p.type === type)
                    .map((plan) => (
                    <Card key={plan.id} className={plan.popular ? `border-2 ${colorClass} relative gap-0` : "gap-0"}>
                        {plan.popular && (
                            <Badge className={`absolute -top-2 left-1/2 transform -translate-x-1/2 bg-${colorClass.split('-')[1]}-600 text-xs text-white`}>
                                Popular
                            </Badge>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{plan.name}</CardTitle>
                            <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${colorClass.replace('border', 'text')}`}>
                                    {formatCurrency(plan.price)}
                                </span>
                                <span className="text-xs text-muted-foreground">/ {plan.duration}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <PlanFeatureList features={plan.features} />
                            <Button
                                onClick={() => {
                                    setSelectedPlan(plan.id);
                                    setShowPlanDialog(true);
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white h-11 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95"
                            >
                                Buy Now
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 border-0 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <Crown className="w-40 h-40 text-white" />
                </div>
                <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                                <Crown className="h-6 w-6 text-amber-400 fill-amber-400" />
                                Plans & Boosting
                            </h2>
                            <p className="text-blue-100 mt-2 text-sm">
                                Reach 10x more buyers and sell items faster
                            </p>
                        </div>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-md px-4 py-2 text-sm rounded-full">
                            Current: {currentPlan}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {renderPlanGrid(
                "Spotlight",
                "Spotlight Ads",
                "Get your ad to the top of search results",
                <span className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition-transform">⭐</span>,
                "border-green-500"
            )}

            {renderPlanGrid(
                "More Ads",
                "More Ads Packs",
                "Post more ads and reach a wider audience",
                <Package className="h-5 w-5 text-link" />,
                "border-blue-500"
            )}

            {renderPlanGrid(
                "Alert Slots",
                "Smart Alert Slots",
                "Increase the number of active alerts you can run",
                <span className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-sm">🔔</span>,
                "border-purple-500"
            )}

            {plansToDisplay.length === 0 && (
                <Card className="border-dashed border-slate-300">
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                        Plans are temporarily unavailable. Please try again shortly.
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
