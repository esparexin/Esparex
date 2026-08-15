import { useState, useEffect, useCallback } from "react";
import { getPlans } from "@/lib/api/user/plans";
import type { ProfilePlan, ProfilePlanType } from "@/components/user/profile/types";
import type { User } from "@/types/User";
import logger from "@/lib/logger";

export function getPlanEntitlementFeatures(p: {
    type: string;
    description?: string;
    name?: string;
    durationDays?: number;
    duration?: string;
    credits?: number;
    limits?: {
        maxAds?: number;
        spotlightCredits?: number;
        smartAlerts?: number;
    };
    smartAlertConfig?: {
        radiusLimitKm?: number;
        matchFrequency?: string;
        notificationChannels?: string[];
    };
    features?: {
        priorityWeight?: number;
    };
}): string[] {
    const list: string[] = [];
    const validityStr = p.durationDays ? `Valid for ${p.durationDays} Days` : (p.duration ? `Valid for ${p.duration}` : "Lifetime Validity");

    if (p.type === "SPOTLIGHT") {
        const credits = p.limits?.spotlightCredits ?? p.credits ?? 1;
        list.push(`${credits} Spotlight ${credits === 1 ? "Credit" : "Credits"} for your wallet`);
        list.push("Prominent Gold Spotlight Ribbon on Listing Card");
        list.push("Pinned to Category Header & Top Search Results");
        list.push("Maximum Buyer Viewership & Inquiries");
        list.push(validityStr);
    } else if (p.type === "AD_PACK") {
        const slots = p.limits?.maxAds ?? p.credits ?? 5;
        list.push(`${slots} Extra Ad Posting ${slots === 1 ? "Slot" : "Slots"}`);
        list.push(validityStr);
        list.push("Up to 10 High-Resolution Photos per Listing");
        list.push("Direct Buyer Leads via Chat & Verified Phone");
        list.push("Zero Platform Sales Commission");
    } else if (p.type === "BOOST_AD") {
        const weight = p.features?.priorityWeight ?? 2;
        list.push(`Top Ad Search Placement (${weight}x Visibility Boost)`);
        list.push("Higher Ranking above Standard Marketplace Listings");
        list.push(validityStr);
        list.push("Direct Buyer Chat & Call Inquiries");
        list.push("Zero Sales Commission on Deals");
    } else if (p.type === "SMART_ALERT") {
        const slots = p.limits?.smartAlerts ?? p.credits ?? 1;
        const radius = p.smartAlertConfig?.radiusLimitKm ?? 50;
        const freq = p.smartAlertConfig?.matchFrequency || "instant";
        const channels = p.smartAlertConfig?.notificationChannels?.map(c => c.toUpperCase()).join(", ") || "Push & Email";
        
        list.push(`${slots} Smart Alert ${slots === 1 ? "Monitor" : "Monitors"}`);
        list.push(`${radius} km Geo-Radius Matching`);
        list.push(`${freq.charAt(0).toUpperCase() + freq.slice(1)} Deal Notifications (${channels})`);
        list.push("First Access to Newly Listed Parts & Vehicles");
        list.push(validityStr);
    } else if (p.type === "FREE_DEFAULT") {
        const slots = p.limits?.maxAds ?? p.credits ?? 5;
        list.push(`${slots} Monthly Free Ad Posting Slots`);
        list.push("Full Access to Marketplace Search & Chat");
        list.push("Lifetime Access");
    }

    if (p.description && p.description.trim() && p.description.trim() !== p.name && !list.includes(p.description.trim())) {
        list.unshift(p.description.trim());
    }

    return list.length > 0 ? list : [validityStr, "Standard Platform Features", "Direct Buyer Leads"];
}

export function useDynamicPlans(activeTab: string, user: User | null) {
    const [dynamicPlans, setDynamicPlans] = useState<ProfilePlan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(false);
    const [isError, setIsError] = useState(false);

    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    const fetchDynamicPlans = useCallback(async () => {
        setLoadingPlans(true);
        try {
            const userType =
                user?.role === "business" || user?.businessStatus === "live"
                    ? "business"
                    : "normal";
            const data = await getPlans({ userType });
            const mapPlanType = (rawType: string): ProfilePlanType => {
                switch (rawType) {
                    case "SPOTLIGHT": return "Spotlight";
                    case "AD_PACK": return "More Ads";
                    case "BOOST_AD": return "Top Ad";
                    case "SMART_ALERT": return "Alert Slots";
                    case "FREE_DEFAULT": return "More Ads";
                    default: return "More Ads";
                }
            };
            const mapped: ProfilePlan[] = data.map((p) => ({
                id: p.id,
                name: p.name,
                price: p.price,
                duration: p.duration || (p.durationDays ? `${p.durationDays} Days` : "Lifetime"),
                type: mapPlanType(p.type),
                features: getPlanEntitlementFeatures(p),
                popular: Boolean(p.isDefault),
            }));
            setDynamicPlans(mapped);
        } catch (error) {
            logger.error("Error fetching dynamic plans:", error);
            setIsError(true);
            setDynamicPlans([]);
        } finally {
            setLoadingPlans(false);
        }
    }, [user?.role, user?.businessStatus]);

    useEffect(() => {
        if (activeTab === 'plans' || activeTab === 'buyplans' || activeTab === 'purchases') {
            const timeoutId = setTimeout(() => {
                setIsError(false);
                void fetchDynamicPlans();
            }, 0);
            return () => clearTimeout(timeoutId);
        }
        return undefined;
    }, [activeTab, fetchDynamicPlans]);

    return {
        dynamicPlans,
        loadingPlans,
        isError,
        fetchDynamicPlans
    };
}
