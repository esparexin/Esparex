import { useState, useEffect } from "react";
import { getPlans } from "@/lib/api/user/plans";
import type { ProfilePlan, ProfilePlanType } from "@/components/user/profile/types";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

export function useDynamicPlans(activeTab: string, user: User | null) {
    const [dynamicPlans, setDynamicPlans] = useState<ProfilePlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const fetchDynamicPlans = async () => {
        setLoadingPlans(true);
        try {
            const userType =
                user?.role === "business" || user?.businessStatus === "live"
                    ? "business"
                    : "normal";
            const data = await getPlans({ userType });
            const mapped: ProfilePlan[] = data.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                duration: p.duration || (p.durationDays ? `${p.durationDays} Days` : "Lifetime"),
                type: (
                    p.type === "AD_PACK" ? "More Ads" : (p.type === "SPOTLIGHT" ? "Spotlight" : "Alert Slots")
                ) as ProfilePlanType,
                features: p.description ? [p.description] : [p.name],
                popular: Boolean(p.isDefault),
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
    }, [activeTab, user?.businessStatus, user?.role]);

    return {
        dynamicPlans,
        loadingPlans,
        fetchDynamicPlans
    };
}
