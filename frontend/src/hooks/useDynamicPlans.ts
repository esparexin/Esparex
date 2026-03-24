import { useState, useEffect } from "react";
import { getPlans } from "@/lib/api/user/plans";
// Local type definitions for ProfilePlan and ProfilePlanType
type ProfilePlanType = "More Ads" | "Spotlight" | "Alert Slots";
interface ProfilePlan {
    id: string;
    name: string;
    price: number;
    duration: string;
    type: ProfilePlanType;
    features: string[];
    popular: boolean;
}
import logger from "@/lib/logger";

export function useDynamicPlans(activeTab: string) {
    const [dynamicPlans, setDynamicPlans] = useState<ProfilePlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const fetchDynamicPlans = async () => {
        setLoadingPlans(true);
        try {
            const data = await getPlans({ userType: "normal" });
            const mapped: ProfilePlan[] = data.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                duration: p.duration || (p.durationDays ? `${p.durationDays} Days` : "Lifetime"),
                type: (
                    p.type === "AD_PACK" ? "More Ads" : (p.type === "SPOTLIGHT" ? "Spotlight" : "Alert Slots")
                ) as ProfilePlanType,
                features: p.description ? [p.description] : [p.name],
                popular: p.active,
            }));
            setDynamicPlans(mapped);
        } catch (error) {
            logger.error("Error fetching dynamic plans:", error);
            setDynamicPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'plans') {
            fetchDynamicPlans();
        }
    }, [activeTab]);

    return {
        dynamicPlans,
        loadingPlans,
        fetchDynamicPlans
    };
}